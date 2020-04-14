const Queue = require('bull');
const {redisDelAsync, redisGetAsync, redisSetAsyncWithTTL} = require('../../utils/redis');

const TODAY_JOBS_REDIS_PREFIX = 'STATUS_SCHEDULED_JOBS';
const STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME = 'Status Change Scheduler Queue';
const STATUS_CHANGE_QUEUE_NAME = 'Status Change Queue';
const STATUS_CHANGE_SCHEDULER_JOB = 'StatusChangeScheduler';
const STATUS_CHANGE_JOB = 'StatusChangeJob';

const _getScheduledJobsRedisKey = function (userId) {
    return `${TODAY_JOBS_REDIS_PREFIX}_${userId}`;
};
const getCachedScheduledJobs = async function(userId) {
    const redisEntry = _getScheduledJobsRedisKey(userId);
    return JSON.parse(await redisGetAsync(redisEntry));
};
const hasJobsScheduledForToday = async function(userId) {
    return (await getCachedScheduledJobs(userId) !== null);
};
const setScheduledJobsCache = async function(userId, scheduledJobs, endTime) {
    const redisEntry = _getScheduledJobsRedisKey(userId);
    const now = new Date().getTime();
    const TTL = Math.ceil(( (endTime + 5*60*1000) - now ) / 1000);
    await redisSetAsyncWithTTL(redisEntry,  JSON.stringify(scheduledJobs), TTL);
};

/** Status Change Scheduler **/
const jobsSchedulerQueue = new Queue(STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const scheduleTodayStatusChangeForUser = function (userId) {
    jobsSchedulerQueue.add(STATUS_CHANGE_SCHEDULER_JOB, {userId});
};
const rescheduleRemainingTodayStatusChangeJobsForUser = async function (userId) {
    //Clean existing jobs if they exists
    const redisEntry = _getScheduledJobsRedisKey(userId);
    const scheduledJobs = JSON.parse(await redisGetAsync(redisEntry));
    if(scheduledJobs && scheduledJobs.length){
        await Promise.all(scheduledJobs.map(async (jobId) => {
            const job = await statusChangeQueue.getJobFromId(jobId);
            if(job) await job.remove();
        }));
        await redisDelAsync(redisEntry);
    }
    scheduleTodayStatusChangeForUser(userId);
};
jobsSchedulerQueue.process(STATUS_CHANGE_SCHEDULER_JOB, 10,`${__dirname}/statusChangeScheduler.js`);
jobsSchedulerQueue.on('failed', function(job, err){
    console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: FAILED!`, err);
});

/** Status change job **/
const statusChangeQueue = new Queue(STATUS_CHANGE_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
statusChangeQueue.process(STATUS_CHANGE_JOB, 10,`${__dirname}/statusChangeJob.js`);
statusChangeQueue.on('failed', function(job, err){
    console.log(`${STATUS_CHANGE_JOB} :::: FAILED!`, err);
});
const performChangeStatusForUser = function(userId, timeSlot) {
    console.log(`${STATUS_CHANGE_QUEUE_NAME} :::: ADDING CHANGE STATUS JOB FOR USER: ${userId}`);
    statusChangeQueue.add(STATUS_CHANGE_JOB, {userId, timeSlot});
};
const scheduleStatusChangeJob = function(userId, timeSlot) {
    const now = new Date().getTime();
    const delay =  timeSlot.start > now ? timeSlot.start - now : 0;
    const jobId = `job-${timeSlot.start}-${timeSlot.end}-${timeSlot.status}`;
    console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: SCHEDULING JOB:`, jobId);
    statusChangeQueue.add(STATUS_CHANGE_JOB, {userId, timeSlot}, {jobId, delay});
    return jobId;
};

/** Exports **/
module.exports.scheduleTodayStatusChangeForUser = scheduleTodayStatusChangeForUser;
module.exports.rescheduleRemainingTodayStatusChangeJobsForUser = rescheduleRemainingTodayStatusChangeJobsForUser;
module.exports.performChangeStatusForUser = performChangeStatusForUser;
module.exports.hasJobsScheduledForToday = hasJobsScheduledForToday;
module.exports.getCachedScheduledJobs = getCachedScheduledJobs;
module.exports.setScheduledJobsCache = setScheduledJobsCache;
module.exports.scheduleStatusChangeJob = scheduleStatusChangeJob;