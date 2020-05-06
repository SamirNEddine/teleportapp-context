require('../../utils').config();
require('dotenv').config();
require('../../utils/sentry').setupSentry(process.env.SENTRY_STATUS_CHANGE_SCHEDULER_JOB);
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {getAvailabilityForToday} = require('../../availability');
const {setScheduledJobsCache, scheduleStatusChangeJob} = require('./index');

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${job.name} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId} = job.data;
    const jobs = [];
    const now = new Date().getTime();
    const {busyTimeSlots, focusTimeSlots, availableTimeSlots, endTime} = await getAvailabilityForToday(userId, now);
    await Promise.all( busyTimeSlots.concat(focusTimeSlots).concat(availableTimeSlots).map(async (timeSlot) => {
        //Only remaining events for the day.
        if(now < timeSlot.end) {
            jobs.push(scheduleStatusChangeJob(userId, timeSlot));
        }
    }));
    await setScheduledJobsCache(userId, jobs, endTime);
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