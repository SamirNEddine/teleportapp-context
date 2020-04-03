const TimeSlot = require('./TimeSlot');
const Availability = require('./Availability');

const availabilityFromCalendar = function (events, startTime, endTime=Number.POSITIVE_INFINITY) {
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