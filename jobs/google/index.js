const Queue = require('bull');

const calendarQueue = new Queue('Google Calendar Sync', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);
calendarQueue.getRepeatableJobs().then( (jobs) => {
    let existingSyncJob = null;
    for(let i=0; i<jobs.length; i++){
        const job = jobs[i];
        if(job.name === 'PerformSync'){
            existingSyncJob = job;
            break;
        }
    }
    if(!existingSyncJob){
        console.log("Scheduling google calendar sync job");
        calendarQueue.add("PerformSync", {}, {repeat:{every:60*1000}});
    }
});

calendarQueue.process('PerformSync', 1,`${__dirname}/calendarSync.js`);
