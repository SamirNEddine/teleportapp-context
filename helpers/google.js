const {google} = require('googleapis');
const CalendarEvent = require('../model/CalendarEvent');

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const syncMinTimeFrameInHours = 120;
const syncTimeFrameMarginInHours = 48;
const TELEPORT_STATUS_TOKEN_IN_ID = 'tlprt';
const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    'https://tlprt.io/google/auth'
);

const getStatusForEvent = function (event) {
    if(event.id.includes(TELEPORT_STATUS_TOKEN_IN_ID)){
        const status = event.id.split(TELEPORT_STATUS_TOKEN_IN_ID)[1];
        console.log("TESTING", event.id.split(TELEPORT_STATUS_TOKEN_IN_ID), status)
        switch (status) {
            case '1':
                return 'focus';
            case '2':
                return 'available';
        }
    }else{
        return 'busy';
    }
};

const getCalendarEventsUpdatesWithToken = async function(calendar, syncToken){
    console.debug("Check for calendar updates with syncToken");
    const response = await calendar.events.list({
        calendarId: 'primary',
        syncToken
    });
    return response.data;
};
const getCalendarEventsUpdatesWithISODates = async function(calendar, timeMin, timeMax){
    console.debug("Check for calendar updates with time frame");
    const response = await calendar.events.list({
        calendarId: 'primary',
        timeMax,
        timeMin
    });
    return response.data;
};
const getCalendarEventsUpdates = async function (userIntegration, timeFrameInHours) {
    oauth2Client.setCredentials(userIntegration.data);
    const calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client
    });

    const integrationDataBeforeSync = userIntegration.data;
    const integrationDataAfterSync = integrationDataBeforeSync;

    let calendarUpdates = null;
    if (!integrationDataBeforeSync.timeFrameInHours ||
        (new Date().getTime() - new Date(integrationDataBeforeSync.lastFullSyncDate).getTime())/1000 > integrationDataBeforeSync.timeFrameInHours*60*60 ||
        (new Date().getTime()/1000 + timeFrameInHours*60*60) > new Date(integrationDataBeforeSync.lastFullSyncDate).getTime()/1000 + integrationDataBeforeSync.timeFrameInHours*60*60){
        const timeFrameToUse = (timeFrameInHours > syncMinTimeFrameInHours ? timeFrameInHours : syncMinTimeFrameInHours)+syncTimeFrameMarginInHours;
        const timeMin = new Date();
        const timeMax = new Date(timeMin.getTime() + timeFrameToUse*60*60*1000);
        calendarUpdates = await getCalendarEventsUpdatesWithISODates(calendar, timeMin.toISOString(), timeMax.toISOString());
        integrationDataAfterSync.timeFrameInHours = timeFrameToUse;
        integrationDataAfterSync.lastFullSyncDate = timeMin;
    }else{
        calendarUpdates = await getCalendarEventsUpdatesWithToken(calendar, integrationDataBeforeSync.syncToken);
    }
    integrationDataAfterSync.syncToken = calendarUpdates.nextSyncToken;
    if(JSON.stringify(integrationDataAfterSync) === JSON.stringify(integrationDataBeforeSync) ){
        userIntegration.data = integrationDataAfterSync;
        await userIntegration.save();
    }
    return calendarUpdates.items;
};

module.exports.performCalendarSync = async function (userIntegration, timeFrameInHours=120) {
    const calendarUpdates = await getCalendarEventsUpdates(userIntegration, timeFrameInHours);
    const updates = [];
    for(let i=0; i<calendarUpdates.length; i++){
        const update = calendarUpdates[i];
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
                        externalDescription: update.summary,
                        userId: userIntegration.userId,
                        startDateTime: new Date(update.start.dateTime),
                        endDateTime: new Date(update.end.dateTime),
                        status: getStatusForEvent(update)
                    },
                    upsert: true,
                    setDefaultsOnInsert: true
                }
            });
        }
    }

    if(updates.length){
        console.log(calendarUpdates);
        await CalendarEvent.bulkWrite(updates);
        return {updates: true};
    }else{
        console.log('No updates!');
        return {updates: false};
    }
};