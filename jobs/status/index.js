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
const setScheduledJobsCache = async function(userId, scheduledJobs, endTime) {
    const redisEntry = _getScheduledJobsRedisKey(userId);
    if(scheduledJobs){
        const now = new Date().getTime();
        const TTL = Math.ceil(( (endTime + 5*60*1000) - now ) / 1000);
        await redisSetAsyncWithTTL(redisEntry,  JSON.stringify(scheduledJobs), TTL);
    }else{
        await redisDelAsync(redisEntry);
    }
};

/** Status Change Scheduler **/
const jobsSchedulerQueue = new Queue(STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const cleanStatusChangeJobsForUser = async function(userId) {
    const scheduledJobs = await getCachedScheduledJobs(userId);
    await Promise.all(scheduledJobs.map(async (jobId) => {
        const job = await statusChangeQueue.getJobFromId(jobId);
        if(job) await job.remove();
    }));
    await setScheduledJobsCache(userId, null);
};
const scheduleTodayStatusChangeForUserIfNeeded = async function (userId, forceReschedule=false) {
    const scheduledJobs = await getCachedScheduledJobs(userId);
    if(forceReschedule && scheduledJobs){
        //Clean
        console.log('Rescheduling status change jobs');
        if(scheduledJobs && scheduledJobs.length){
            await cleanStatusChangeJobsForUser(userId);
        }
        jobsSchedulerQueue.add(STATUS_CHANGE_SCHEDULER_JOB, {userId});
    }else if (!scheduledJobs){
        console.log('Scheduling status change jobs');
        jobsSchedulerQueue.add(STATUS_CHANGE_SCHEDULER_JOB, {userId});
    }
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
module.exports.scheduleTodayStatusChangeForUserIfNeeded = scheduleTodayStatusChangeForUserIfNeeded;
module.exports.performChangeStatusForUser = performChangeStatusForUser;
module.exports.getCachedScheduledJobs = getCachedScheduledJobs;
module.exports.setScheduledJobsCache = setScheduledJobsCache;
module.exports.scheduleStatusChangeJob = scheduleStatusChangeJob;
module.exports.cleanStatusChangeJobsForUser = cleanStatusChangeJobsForUser;