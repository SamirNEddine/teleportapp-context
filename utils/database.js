const UserIntegration = require('../model/UserIntegration');
const UserContextParams = require('../model/UserContextParams');
const CalendarEvent = require('../model/CalendarEvent');

module.exports.clearDataForUser = async function(userId) {
    await UserIntegration.deleteMany({userId});
    await UserContextParams.deleteMany({userId});
    await CalendarEvent.deleteMany({userId});
};