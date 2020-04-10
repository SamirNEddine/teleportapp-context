const CalendarEvent = require('../model/CalendarEvent');
const {scheduleTodayStatusChangeForUser} = require('../jobs/status');
const {bookCalendarEvents} = require('../jobs/google');

const updateCalendarWithTimeSlots = async function(userId, timeSlots) {
    const calendarEvents = [];
    await Promise.all( timeSlots.map(async (timeSlot) => {
        const calendarEvent = CalendarEvent.eventFromTimeSlot(timeSlot);
        calendarEvent.userId = userId;
        await calendarEvent.save();
        calendarEvents.push(calendarEvent);
    }));
    scheduleTodayStatusChangeForUser(userId);
    bookCalendarEvents(userId, calendarEvents);
};

/** Exports **/
module.exports.updateCalendarWithTimeSlots = updateCalendarWithTimeSlots;