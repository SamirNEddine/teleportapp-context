const Queue = require('bull');
const {redisGetAsync, redisSetAsync} = require('../../utils/redis');

const REDIS_PREFIX = 'STATUS_SCHEDULE_JOBS';
const STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME = 'Status Change Scheduler Queue';
const STATUS_CHANGE_QUEUE_NAME = 'Status Change Queue';
const STATUS_CHANGE_SCHEDULER_JOB = 'StatusChangeScheduler';
const STATUS_CHANGE_JOB = 'StatusChangeJob';

const addJobToStatusChangeJobsCache = async function(userId, jobId) {
    const redisEntry = `${REDIS_PREFIX}_${userId}`;
    const existingCache = JSON.parse(await redisGetAsync(redisEntry));
    const updatedCache =  existingCache ? existingCache : [];
    updatedCache.push(jobId);
    redisSetAsync(redisEntry, JSON.stringify(updatedCache));
};
const removeJobFromStatusChangeJobsCache = async function(userId, jobId) {
    const redisEntry = `${REDIS_PREFIX}_${userId}`;
    const cache = JSON.parse(await redisGetAsync(redisEntry));
    if(cache){
        const updatedCache = cache.filter(id => id !== jobId);
        await redisSetAsync(redisEntry, JSON.stringify(updatedCache));
    }
};

/** Status Change Scheduler **/
const jobsSchedulerQueue = new Queue(STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const rescheduleStatusChangeForUser = function (userId) {
    jobsSchedulerQueue.add(STATUS_CHANGE_SCHEDULER_JOB, {userId});
};
jobsSchedulerQueue.process(STATUS_CHANGE_SCHEDULER_JOB, 10,`${__dirname}/statusChangeScheduler.js`);
jobsSchedulerQueue.on('failed', function(job, err){
    console.log(`${STATUS_CHANGE_SCHEDULER_JOB} :::: FAILED!`, err);
});

/** Status change job **/
const statusChangeQueue = new Queue(STATUS_CHANGE_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
statusChangeQueue.process(STATUS_CHANGE_JOB, 10,`${__dirname}/statusChangeJob.js`);
statusChangeQueue.on('completed', async function (job) {
    console.log(`${STATUS_CHANGE_JOB} :::: UPDATING CACHE AFTER COMPLETION`, job.data.userId, job.id);
    await removeJobFromStatusChangeJobsCache(job.data.userId, job.id);
    await job.remove();
});
statusChangeQueue.on('failed', function(job, err){
    console.log(`${STATUS_CHANGE_JOB} :::: FAILED!`, err);
});

/** Exports **/
module.exports.rescheduleStatusChangeForUser = rescheduleStatusChangeForUser;
module.exports.REDIS_PREFIX = REDIS_PREFIX;
module.exports.STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME = STATUS_CHANGE_JOBS_SCHEDULER_QUEUE_NAME;
module.exports.STATUS_CHANGE_QUEUE_NAME = STATUS_CHANGE_QUEUE_NAME;
module.exports.STATUS_CHANGE_SCHEDULER_JOB = STATUS_CHANGE_SCHEDULER_JOB;
module.exports.STATUS_CHANGE_JOB = STATUS_CHANGE_JOB;