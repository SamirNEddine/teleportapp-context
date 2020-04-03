const TimeSlot = require('./TimeSlot');
const Availability = require('./Availability');
const UserIntegration = require('../model/UserIntegration');
const CalendarEvent = require('../model/CalendarEvent');
const {performCalendarSync} = require('../helpers/google');

const getCalendarEvents = async function (userId, startTimestamp, endTimestamp) {
    //Start by doing a sync
    const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
    if(!googleCalendarIntegration) throw new Error('Bad request!');
    await performCalendarSync(googleCalendarIntegration);
    const startDate = new Date(parseInt(startTimestamp));
    const endDate =  new Date(parseInt(endTimestamp));
    return await CalendarEvent.find({
        userId,
        $or: [{
            $and:[
                {startDateTime: {$gte:startDate}},
                {startDateTime: {$lte:endDate}}
            ]
        },
            {
                $and:[
                    {endDateTime: {$gte:startDate}},
                    {endDateTime: {$lte:endDate}}
                ]
            }]
    });
};

const availabilityFromCalendar = async function (userId, startTime, endTime=Number.POSITIVE_INFINITY) {
    const events = await getCalendarEvents(userId, startTime, endTime);
    const availability = new Availability(startTime, endTime);
    events.forEach(event => {
        availability.addTimeSlot(new TimeSlot(
            event.startDateTime.getTime() < startTime ? startTime : event.startDateTime.getTime(),
            event.endDateTime.getTime() > endTime ? endTime : event.endDateTime.getTime(),
            event.status));
    });
    return availability;
};

module.exports = availabilityFromCalendar;