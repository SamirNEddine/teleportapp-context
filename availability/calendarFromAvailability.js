const CalendarEvent = require('../model/CalendarEvent');
const {scheduleTodayStatusChangeForUserIfNeeded} = require('../jobs/status');
const {bookCalendarEvents} = require('../jobs/google');

const shouldCreateEventForTimeSlot = function (timeSlot) {
    return timeSlot.status === 'available' || timeSlot.status === 'focus';
};
const updateCalendarWithTimeSlots = async function(userId, timeSlots) {
    const calendarEvents = [];
    await Promise.all( timeSlots.map(async (timeSlot) => {
        if(shouldCreateEventForTimeSlot(timeSlot)){
            const calendarEvent = CalendarEvent.eventFromTimeSlot(timeSlot);
            calendarEvent.userId = userId;
            await calendarEvent.save();
            calendarEvents.push(calendarEvent);
        }
    }));
    await scheduleTodayStatusChangeForUserIfNeeded(userId);
    bookCalendarEvents(userId, calendarEvents);
};

/** Exports **/
module.exports.updateCalendarWithTimeSlots = updateCalendarWithTimeSlots;