const {getAvailabilityForToday} = require('./todayAvailability');
const {performChangeStatusForUser} = require('../jobs/status');

const getCurrentAvailability = async function (userContextParams) {
    const now = new Date().getTime();
    if(now < userContextParams.todayStartWorkTimestamp) {
        return {start:now, end: userContextParams.todayStartWorkTimestamp, status: 'unassigned'};
    }else {
        const availability = await getAvailabilityForToday(userContextParams.userId);
        return availability.current().toObject();
    }
};
const setCurrentAvailability = async function (userContextParams, newAvailability) {
    const availability = await getAvailabilityForToday(userContextParams.userId);
    const current = availability.current();
    if(current.status !== newAvailability){
        const next = availability.next();
        //Merge with next status if applicable
        if(next && next.status === current.status){
            current.end = next.end;
        }
        current.status = newAvailability;
        //Update Slack status
        performChangeStatusForUser(userContextParams.userId, current);
    }
    return current.toObject();
};
const getNextAvailability = async function (userContextParams) {
    const now = new Date().getTime();
    if(now < userContextParams.todayStartWorkTimestamp) {
        return {start:now, end: userContextParams.todayStartWorkTimestamp, status: 'unassigned'};
    }else {
        const availability = await getAvailabilityForToday(userContextParams.userId);
        return availability.next().toObject();
    }
};

module.exports.getCurrentAvailability = getCurrentAvailability;
module.exports.setCurrentAvailability = setCurrentAvailability;
