const Queue = require('bull');

const CALENDAR_SYNC_QUEUE_NAME = 'Google Calendar Sync';
const CALENDAR_SYNC_REPEATABLE_JOB = 'GoogleCalendarSyncCronJob';
const CALENDAR_SYNC_ONETIME_JOB = 'GoogleCalendarSyncOneTimeJob';

/** Queue setup **/
const calendarQueue = new Queue(CALENDAR_SYNC_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
calendarQueue.process(CALENDAR_SYNC_REPEATABLE_JOB, 1,`${__dirname}/calendarSync.js`);
calendarQueue.process(CALENDAR_SYNC_ONETIME_JOB, 1,`${__dirname}/calendarSync.js`);

/** Sync cron job setup **/
calendarQueue.getRepeatableJobs().then( (jobs) => {
    let existingSyncJob = null;
    for(let i=0; i<jobs.length; i++){
        const job = jobs[i];
        if(job.name === CALENDAR_SYNC_REPEATABLE_JOB){
            existingSyncJob = job;
            break;
        }
    }
    if(!existingSyncJob){
        console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: Scheduling Cron job`);
        calendarQueue.add(CALENDAR_SYNC_REPEATABLE_JOB, {}, {repeat:{every:60*1000}});
    }
});
calendarQueue.on('failed', function(job, err){
    console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: FAILED!`, err);
});

/** One time job **/
const syncCalendarForUser = function(userId) {
    console.log(`${CALENDAR_SYNC_ONETIME_JOB} :::: Scheduling job for user ${userId}`);
    calendarQueue.add(CALENDAR_SYNC_ONETIME_JOB, {userId});
};

/** Exports **/
module.exports.CALENDAR_SYNC_REPEATABLE_JOB = CALENDAR_SYNC_REPEATABLE_JOB;
module.exports.CALENDAR_SYNC_ONETIME_JOB = CALENDAR_SYNC_ONETIME_JOB;
module.exports.syncCalendarForUser = syncCalendarForUser;