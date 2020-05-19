const Sentry = require('@sentry/node');
const {google} = require('googleapis');
const CalendarEvent = require('../model/CalendarEvent');
const UserContextParams = require('../model/UserContextParams');
const clientId = process.env.GOOGLE_CLIENT_ID;
const syncMinTimeFrameInHours = 120;
const syncTimeFrameMarginInHours = 48;

const _getCalendarClient = function (userIntegration) {
    const oauth2Client = new google.auth.OAuth2(
        clientId,
    );
    oauth2Client.setCredentials(userIntegration.data);
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens) {
            console.log('Token refreshed for user:', userIntegration.userId);
            //Update database
            const integrationData = userIntegration.data;
            for(let key in tokens){
                if(tokens.hasOwnProperty(key)){
                    integrationData[key] = tokens[key];
                }
            }
            userIntegration.data = integrationData;
            await userIntegration.save();
        }
    });

    return google.calendar({
        version: 'v3',
        auth: oauth2Client
    });
};
const getCalendarEventsUpdatesWithToken = async function(calendar, syncToken){
    console.debug("Check for calendar updates with syncToken");
    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            showDeleted: true,
            syncToken
        });

        return response.data;
    }catch(e){
        if(e.response && e.response.status === 410){
            //SyncToken is no longer valid. Do a full sync instead
            return 410;
        }else{
            throw (e);
        }
    }
};
const getCalendarEventsUpdatesWithISODates = async function(calendar, timeMin, timeMax){
    console.debug("Check for calendar updates with time frame");
    const response = await calendar.events.list({
        calendarId: 'primary',
        showDeleted: true,
        timeMax,
        timeMin,
    });
    return response.data;
};
const getCalendarEventsUpdates = async function (userIntegration, timeMin, timeFrameInHours) {
    const calendar = _getCalendarClient(userIntegration);
    let newTimeFrameInHours = userIntegration.data.timeFrameInHours;
    let newLastFullSyncDate = userIntegration.data.lastFullSyncDate;
    let calendarUpdates = null;
    if (!userIntegration.data.syncToken ||
        !userIntegration.data.timeFrameInHours ||
        (new Date().getTime() - new Date( userIntegration.data.lastFullSyncDate).getTime())/1000 >  userIntegration.data.timeFrameInHours*60*60 ||
        (new Date().getTime()/1000 + timeFrameInHours*60*60) > new Date( userIntegration.data.lastFullSyncDate).getTime()/1000 +  userIntegration.data.timeFrameInHours*60*60){
        const timeFrameToUse = (timeFrameInHours > syncMinTimeFrameInHours ? timeFrameInHours : syncMinTimeFrameInHours)+syncTimeFrameMarginInHours;
        const timeMax = new Date(timeMin.getTime() + timeFrameToUse*60*60*1000);
        calendarUpdates = await getCalendarEventsUpdatesWithISODates(calendar, timeMin.toISOString(), timeMax.toISOString());
        newTimeFrameInHours = timeFrameToUse;
        newLastFullSyncDate = timeMin;
    }else{
        calendarUpdates = await getCalendarEventsUpdatesWithToken(calendar,  userIntegration.data.syncToken);
        if(calendarUpdates === 410){
            console.log('SyncToken is no longer valid. Do a full sync instead');
            const data = userIntegration.data;
            delete data['syncToken'];
            userIntegration.data = data;
            await userIntegration.save();
            return await getCalendarEventsUpdates(userIntegration, timeMin,timeFrameInHours);
        }
    }
    let newSyncToken = calendarUpdates.nextSyncToken;
    const integrationDataBeforeSync = userIntegration.data;
    const integrationDataAfterSync = integrationDataBeforeSync;
    integrationDataAfterSync.timeFrameInHours = newTimeFrameInHours;
    integrationDataAfterSync.lastFullSyncDate = newLastFullSyncDate;
    integrationDataAfterSync.syncToken = newSyncToken;
    if(JSON.stringify(integrationDataAfterSync) !== JSON.stringify(integrationDataBeforeSync) ){
        userIntegration.data = integrationDataAfterSync;
        await userIntegration.save();
    }
    return calendarUpdates.items;
};
const performCalendarSync = async function (userIntegration, timeMin=new Date(), timeFrameInHours=120) {
    try {
        const calendarUpdates = await getCalendarEventsUpdates(userIntegration, timeMin, timeFrameInHours);
        const userContextParams = await UserContextParams.findOne({userId: userIntegration.userId});
        let todayUpdates = false;
        const updates = [];
        for(let i=0; i<calendarUpdates.length; i++){
            const update = calendarUpdates[i];
            if(!todayUpdates){
                const updateStartTimeStamp = new Date(update.start.dateTime);
                const updateEndTimeStamp = new Date(update.end.dateTime);
                if(
                    (updateStartTimeStamp >= userContextParams.todayZeroTimestamp && updateStartTimeStamp < userContextParams.today24Timestamp) ||
                    (updateEndTimeStamp >= userContextParams.todayZeroTimestamp && updateEndTimeStamp < userContextParams.today24Timestamp)
                ) {
                    todayUpdates = true;
                }
            }
            if(update.status === 'cancelled'){
                updates.push({
                    deleteOne: {
                        filter: {externalIdentifier: update.id}
                    }
                });
            }else{
                updates.push({
                    updateOne: {
                        filter: {externalIdentifier: update.id},
                        update: {
                            externalIdentifier: update.id,
                            title: update.summary,
                            description: update.description,
                            userId: userIntegration.userId,
                            startDateTime: new Date(update.start.dateTime),
                            endDateTime: new Date(update.end.dateTime),
                        },
                        upsert: true,
                        setDefaultsOnInsert: true
                    }
                });
            }
        }

        if(updates.length){
            console.log(calendarUpdates, 'today updates', todayUpdates);
            await CalendarEvent.bulkWrite(updates);
            if(todayUpdates) await require('../availability/todayAvailability').invalidatedCachedTodayAvailability(userIntegration.userId);
            return {updates: true, todayUpdates};
        }else{
            console.log('No updates!');
            return {updates: false};
        }
    }catch(e){
        console.debug(e);
        Sentry.withScope(scope => {
            scope.setLevel(Sentry.Severity.Critical);
            if(e.stack.includes('google')){
                scope.setTag('job', 'Google Calendar Sync');
            }
            scope.setUser({id: userIntegration.userId});
            Sentry.captureException(e);
        });
        return {updates: false};
    }
};

const googleCalendarEventFromTeleportCalendarEvent = function (teleportCalendarEvent) {
    return {
        id: teleportCalendarEvent.externalIdentifier,
        start: {
            dateTime: new Date(teleportCalendarEvent.startDateTime).toISOString()
        },
        end: {
            dateTime: new Date(teleportCalendarEvent.endDateTime).toISOString()
        },
        summary: teleportCalendarEvent.title,
        description: teleportCalendarEvent.description
    }
};
const bookCalendarEvents = async function (userIntegration, calendarEvents) {
    const calendar = _getCalendarClient(userIntegration);
    await Promise.all( calendarEvents.map(async (calendarEvent) => {
        //Then sync with Google
        const googleCalendarEvent = googleCalendarEventFromTeleportCalendarEvent(calendarEvent);
        await calendar.events.insert({
            calendarId: 'primary',
            requestBody: googleCalendarEvent
        });
    }));
};


/** Exports **/
module.exports.performCalendarSync = performCalendarSync;
module.exports.bookCalendarEvents = bookCalendarEvents;