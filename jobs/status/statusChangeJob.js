require('../../utils').config();
require('dotenv').config();
require('../../utils/sentry').setupSentry(process.env.SENTRY_STATUS_CHANGE_JOB);
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const UserIntegration = require('../../model/UserIntegration');
const {updateUserStatus} = require('../../helpers/slack');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${job.name} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId, timeSlot} = job.data;
    const {data} = await UserIntegration.findOne({userId, name:'slack'});
    if(data) {
        await updateUserStatus(data, timeSlot.status, timeSlot.end);
        console.log(`${job.name} :::: SLACK STATUS UPDATED FOR USER: ${userId}`);
    }

    await disconnectFromDb();
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${job.name} :::: END`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};