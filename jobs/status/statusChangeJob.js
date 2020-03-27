const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const UserIntegration = require('../../model/UserIntegration');
const {updateUserStatus} = require('../../helpers/slack');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("STATUS_CHANGE_JOB :::: START");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId, timeSlot} = job.data;
    const {data} = await UserIntegration.findOne({userId, name:'slack'});
    if(data) {
        await updateUserStatus(data, timeSlot.status, timeSlot.end);
        console.log("Status change JOB Done!", job.data);
    }

    await connectToDb();
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("STATUS_CHANGE_JOB :::: END");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};