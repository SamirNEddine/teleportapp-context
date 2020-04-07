const Queue = require('bull');

const CALENDAR_SYNC_QUEUE_NAME = 'Google Calendar Sync';
const CALENDAR_SYNC_REPEATABLE_JOB = 'GoogleCalendarSyncCronJob';
const CALENDAR_SYNC_ONETIME_JOB = 'GoogleCalendarSyncOneTimeJob';
const CALENDAR_BOOK_QUEUE_NAME = 'Google Calendar Book';
const CALENDAR_BOOK_FROM_AVAILABILITY_JOB = 'GoogleCalendarBookFromAvailabilityJob';

/** Queue setup **/
const calendarSyncQueue = new Queue(CALENDAR_SYNC_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
calendarSyncQueue.process(CALENDAR_SYNC_REPEATABLE_JOB, 1,`${__dirname}/calendarSync.js`);
calendarSyncQueue.process(CALENDAR_SYNC_ONETIME_JOB, 10,`${__dirname}/calendarSync.js`);
const calendarBookQueue = new Queue(CALENDAR_BOOK_QUEUE_NAME, `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
calendarBookQueue.process(CALENDAR_BOOK_FROM_AVAILABILITY_JOB, 10,`${__dirname}/bookCalendarFromAvailabilitySlots.js`);


/** Sync cron job setup **/
calendarSyncQueue.getRepeatableJobs().then( (jobs) => {
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
        calendarSyncQueue.add(CALENDAR_SYNC_REPEATABLE_JOB, {}, {repeat:{every:5*60*1000}});
    }
});
calendarSyncQueue.on('failed', function(job, err){
    console.log(`${CALENDAR_SYNC_REPEATABLE_JOB} :::: FAILED!`, err);
});

/** One time jobs **/
const syncCalendarForUser = function(userId) {
    console.log(`${CALENDAR_SYNC_ONETIME_JOB} :::: Scheduling job for user ${userId}`);
    calendarSyncQueue.add(CALENDAR_SYNC_ONETIME_JOB, {userId});
};
const bookCalendarFromAvailabilityForUser = function(userId, timeSlots) {
    console.log(`${CALENDAR_BOOK_FROM_AVAILABILITY_JOB} :::: Scheduling job for user ${userId}`);
    calendarBookQueue.add(CALENDAR_BOOK_FROM_AVAILABILITY_JOB, {userId, timeSlots});
};

/** Exports **/
module.exports.CALENDAR_SYNC_REPEATABLE_JOB = CALENDAR_SYNC_REPEATABLE_JOB;
module.exports.CALENDAR_SYNC_ONETIME_JOB = CALENDAR_SYNC_ONETIME_JOB;
module.exports.CALENDAR_BOOK_FROM_AVAILABILITY_JOB = CALENDAR_BOOK_FROM_AVAILABILITY_JOB;
module.exports.syncCalendarForUser = syncCalendarForUser;
module.exports.bookCalendarFromAvailabilityForUser = bookCalendarFromAvailabilityForUser;