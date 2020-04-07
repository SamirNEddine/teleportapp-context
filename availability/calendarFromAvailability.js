const UserIntegration = require('../model/UserIntegration');
const {bookCalendarEventsFromTimeSlots} = require('../helpers/google');

const updateCalendarWithTimeSlots = async function(userId, timeSlots) {
    const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
    if(!googleCalendarIntegration) throw new Error('Bad request!');
    await bookCalendarEventsFromTimeSlots(googleCalendarIntegration, timeSlots);
};

/** Exports **/
module.exports.updateCalendarWithTimeSlots = updateCalendarWithTimeSlots;