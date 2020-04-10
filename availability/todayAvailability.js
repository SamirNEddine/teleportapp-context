const UserContextParams = require('../model/UserContextParams');
const {availabilityFromCalendarEvents} = require('./availabilityFromCalendar');
const {updateCalendarWithTimeSlots} = require('./calendarFromAvailability');
const {computeAvailabilitySuggestionFromUnassignedSlots} = require('./availabilitySuggestion');

const getSuggestedAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    const availabilityFromCalendar = await getAvailabilityForToday(userId);
    return await computeAvailabilitySuggestionFromUnassignedSlots(availabilityFromCalendar, userContextParams.minAvailableSlotInMinutes, userContextParams.minFocusSlotInMinutes);
};

const getAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    return await availabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
};

const scheduleAvailabilityForToday = async function (userId, timeSlots) {
    await updateCalendarWithTimeSlots(userId, timeSlots);
};

module.exports.getSuggestedAvailabilityForToday = getSuggestedAvailabilityForToday;
module.exports.getAvailabilityForToday = getAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = scheduleAvailabilityForToday;