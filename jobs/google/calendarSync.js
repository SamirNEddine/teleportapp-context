const UserIntegration = require('../../model/UserIntegration');
const {connectToDb} = require('../../utils/mongoose');

module.exports = async function (job) {
    connectToDb();
    console.log("Start user iterator job");
    const users = await UserIntegration.find({name:'google'});
    users.forEach(u => {
        console.log("Sync With Google for user", u.userId);
    });
    return "OK";
};