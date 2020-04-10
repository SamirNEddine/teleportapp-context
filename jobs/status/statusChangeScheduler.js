require('../../utils').config();
require('dotenv').config();
const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const {availabilityFromCalendarEvents} = require('../../availability');
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
    const redisEntry = `${REDIS_PREFIX}_${userId}`;
    //Clean existing jobs if they exists
    const scheduledJobs = JSON.parse(await redisGetAsync(redisEntry));
    if(scheduledJobs && scheduledJobs.length){
        console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: CLEANING EXISTING SCHEDULED JOBS`);
        await Promise.all(scheduledJobs.map(async (jobId) => {
            const job = await statusChangeQueue.getJobFromId(jobId);
            console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: REMOVING JOB:`, jobId);
            await job.remove();
        }));
        await redisDelAsync(redisEntry);
    }
    const now = new Date();
    const jobs = [];
    const {busyTimeSlots, focusTimeSlots, availableTimeSlots} = await availabilityFromCalendarEvents(userId, now.getTime());
    await Promise.all( busyTimeSlots.concat(focusTimeSlots).concat(availableTimeSlots).map(async (timeSlot) => {
        const jobId = `job-${timeSlot.start}-${timeSlot.end}-${timeSlot.status}`;
        const delay = timeSlot.start - new Date().getTime();
        console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: SCHEDULING JOB:`, jobId);
        statusChangeQueue.add(STATUS_CHANGE_JOB, {userId, timeSlot}, {jobId, delay});
        jobs.push(jobId);
    }));
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