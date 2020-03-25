const UserIntegration = require('../../model/UserIntegration');
const {connectToDb} = require('../../utils/mongoose');
const {performCalendarSync} = require('../../helpers/google');

module.exports = async function (job) {
    connectToDb();
    console.log("Start user iterator job");
    const users = await UserIntegration.find({name:'google'});
    users.forEach(async u => {
        await performCalendarSync(u);
    });
    return "OK";
};