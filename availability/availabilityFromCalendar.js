const TimeSlot = require('./TimeSlot');
const Availability = require('./Availability');
const CalendarEvent = require('../model/CalendarEvent');

const getCalendarEvents = async function (userId, startTimestamp, endTimestamp) {
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

//8640000000000000 is the max timestamp value: http://www.ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const availabilityFromCalendarEvents = async function (userId, startTime, lunchTime, lunchDurationInMinutes, endTime=8640000000000000, startWorkTime, endWorkTime) {
    const events = await getCalendarEvents(userId, startTime, endTime);
    if(!startWorkTime) startWorkTime = startTime;
    if(!endWorkTime) endWorkTime = endTime;
    const availability = new Availability(startWorkTime, lunchTime, lunchDurationInMinutes, endWorkTime);
    await Promise.all( events.map(async (event) => {
        availability.addTimeSlot(new TimeSlot(
            event.startDateTime.getTime() < startTime ? startTime : event.startDateTime.getTime(),
            event.endDateTime.getTime() > endTime ? endTime : event.endDateTime.getTime(),
            event.status));
    }));
    return availability;
};

module.exports.availabilityFromCalendarEvents = availabilityFromCalendarEvents;