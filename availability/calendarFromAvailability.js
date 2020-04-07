const {bookCalendarFromAvailabilityForUser} = require('../jobs/google');

const updateCalendarWithTimeSlots = async function(userId, timeSlots) {
    bookCalendarFromAvailabilityForUser(userId, timeSlots);
};

/** Exports **/
module.exports = updateCalendarWithTimeSlots;