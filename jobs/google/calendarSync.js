const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {performCalendarSync} = require('../../helpers/google');
const {rescheduleStatusChangeForUser} = require('../status');

module.exports = async function (job) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("CALENDAR_SYNC_JOB :::: START");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const users = await UserIntegration.find({name:'google'});

    await Promise.all( users.map(async (u) => {
        const {updates} = await performCalendarSync(u);
        if(updates){
            console.log("CALENDAR_SYNC_JOB :::: GOT UPDATES: RESCHEDULE STATUS CHANGE JOBS");
            rescheduleStatusChangeForUser(u.userId);
        }
    }));
    disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("CALENDAR_SYNC_JOB :::: END");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};