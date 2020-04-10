require('../../utils').config();
require('dotenv').config();
const UserIntegration = require('../../model/UserIntegration');
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {performCalendarSync} = require('../../helpers/google');
const {rescheduleRemainingTodayStatusChangeJobsForUser} = require('../status');
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
    const {userId} = job.data;
    const users = userId ? [await UserIntegration.findOne({name:'google', userId})] : await UserIntegration.find({name:'google'});

    await Promise.all( users.map(async (u) => {
        const {todayUpdates} = await performCalendarSync(u);
        if(todayUpdates){
            console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: GOT UPDATES FOR TODAY: RESCHEDULE STATUS CHANGE JOBS`);
            await rescheduleRemainingTodayStatusChangeJobsForUser(u.userId);
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