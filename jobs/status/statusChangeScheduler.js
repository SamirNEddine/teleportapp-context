require('../../utils').config();
require('dotenv').config();
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {getAvailabilityForToday} = require('../../availability');
const {redisGetAsync, redisDelAsync, redisSetAsync} = require('../../utils/redis');
const Queue = require('bull');
const {REDIS_PREFIX, STATUS_CHANGE_QUEUE_NAME, STATUS_CHANGE_SCHEDULER_JOB, STATUS_CHANGE_JOB} = require('./index');

const statusChangeQueue = new Queue(STATUS_CHANGE_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: START`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId} = job.data;
    const now = new Date().getTime();
    const jobs = [];
    const {busyTimeSlots, focusTimeSlots, availableTimeSlots} = await getAvailabilityForToday(userId, now);
    await Promise.all( busyTimeSlots.concat(focusTimeSlots).concat(availableTimeSlots).map(async (timeSlot) => {
        //Only remaining events for the day.
        if(now < timeSlot.end) {
            const jobId = `job-${timeSlot.start}-${timeSlot.end}-${timeSlot.status}`;
            const delay = now >= timeSlot.start ? timeSlot.start - now : 0;
            console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: SCHEDULING JOB:`, jobId);
            statusChangeQueue.add(STATUS_CHANGE_JOB, {userId, timeSlot}, {jobId, delay});
            jobs.push(jobId);
        }
    }));
    const redisEntry = `${REDIS_PREFIX}_${userId}`;
    redisSetAsync(redisEntry, JSON.stringify(jobs));
    await disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: END`);
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};