const UserContextParams = require('../model/UserContextParams');
const {availabilityFromCalendarEvents} = require('./availabilityFromCalendar');


const getSuggestedAvailabilityForToday = async function (userId) {

};

const getAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    return await availabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
};

const scheduleAvailabilityForToday = async function (userId) {

};

module.exports.getSuggestedAvailabilityForToday = getSuggestedAvailabilityForToday;
module.exports.getAvailabilityForToday = getAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = scheduleAvailabilityForToday;