const {computeAvailabilityFromCalendarEvents} = require('./index');

const getCurrentAvailability = async function (userContextParams) {
    const now = new Date().getTime();
    if(now < userContextParams.todayStartWorkTimestamp) {
        return {start:now, end: userContextParams.todayStartWorkTimestamp, status: 'unassigned'};
    }else {
        const availability = await computeAvailabilityFromCalendarEvents(userContextParams.userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
        return availability.current().toObject();
    }
};
const setCurrentAvailability = async function (userContextParams, newAvailability) {

};

module.exports.getCurrentAvailability = getCurrentAvailability;
module.exports.setCurrentAvailability = setCurrentAvailability;
