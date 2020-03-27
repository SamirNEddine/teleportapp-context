const Queue = require('bull');

/** Status Change Scheduler **/
const jobsSchedulerQueue = new Queue('Status Change Scheduler', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
const rescheduleStatusChangeForUser = function (userId) {
    jobsSchedulerQueue.add('StatusChangeScheduler', {userId});
};
jobsSchedulerQueue.process('StatusChangeScheduler', 10,`${__dirname}/statusChangeScheduler.js`);

/** Status change job **/
const statusChangeQueue = new Queue('Status Change Job', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
statusChangeQueue.process('StatusChangeJob', 10,`${__dirname}/statusChangeJob.js`);

/** Exports **/
module.exports.rescheduleStatusChangeForUser = rescheduleStatusChangeForUser;