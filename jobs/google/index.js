const Queue = require('bull');

const calendarQueue = new Queue('Google Calendar Sync', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
calendarQueue.process('PerformSync', 1,`${__dirname}/calendarSync.js`);
calendarQueue.add("PerformSync", {}, {repeat:{every:process.env.JOB_GOOGLE_CALENDAR_SYNC_REPEAT_EVERY_IN_SECONDS*1000}});
