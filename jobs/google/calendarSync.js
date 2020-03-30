const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {performCalendarSync} = require('../../helpers/google');
const {rescheduleStatusChangeForUser} = require('../status');
const {CALENDAR_SYNC_REPEATABLE_JOB} = require('./index');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const users = await UserIntegration.find({name:'google'});

    await Promise.all( users.map(async (u) => {
        const {updates} = await performCalendarSync(u);
        if(updates){
            console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: GOT UPDATES: RESCHEDULE STATUS CHANGE JOBS`);
            rescheduleStatusChangeForUser(u.userId);
        }
    }));
    await disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: END`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};