const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {performCalendarSync} = require('../../helpers/google');

module.exports = async function (job) {
    await connectToDb();
    console.log("Start calendar sync job");
    const users = await UserIntegration.find({name:'google'});
    users.forEach(async u => {
        await performCalendarSync(u);
    });
    disconnectFromDb();
    return "OK";
};