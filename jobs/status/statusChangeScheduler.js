const {connectToDb, disconnectFromDb} = require('../../utils/mongoose');
const CalendarEvent = require('../../model/CalendarEvent');
const {computeAvailabilityFromCalendarEvents} = require('../../helpers/availability');
const {redisGetAsync, redisDelAsync, redisSetAsync} = require('../../utils/redis');
const Queue = require('bull');

const REDIS_PREFIX = 'STATUS_SCHEDULE_JOBS';
const statusChangeQueue = new Queue('Status Change Job', `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

module.exports = async function (job, done) {
    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("STATUS_CHANGE_SCHEDULER :::: START");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');

    await connectToDb();
    const {userId} = job.data;
    const redisEntry = `${REDIS_PREFIX}_${userId}`;
    //Clean existing jobs if they exists
    const scheduledJobs = JSON.parse(await redisGetAsync(redisEntry));
    if(scheduledJobs && scheduledJobs.length){
        console.log("STATUS_CHANGE_SCHEDULER :::: CLEANING EXISTING SCHEDULED JOBS");
        await Promise.all(scheduledJobs.map(async (jobId) => {
            const job = await statusChangeQueue.getJobFromId(jobId);
            console.log("STATUS_CHANGE_SCHEDULER :::: REMOVING JOB:", jobId);
            await job.remove();
        }));
        await redisDelAsync(redisEntry);
    }
    const now = new Date();
    const remainingEvents = await CalendarEvent.find({
        userId,
        endDateTime: {$gt:now}
    });
    const jobs = [];
    const {busyTimeSlots, focusTimeSlots, availableTimeSlots} = computeAvailabilityFromCalendarEvents(remainingEvents, now.getTime());
    await Promise.all( busyTimeSlots.concat(focusTimeSlots).concat(availableTimeSlots).map(async (timeSlot) => {
        const jobId = `job-${timeSlot.start}-${timeSlot.end}-${timeSlot.status}`;
        const delay = timeSlot.start - new Date().getTime();
        console.log("STATUS_CHANGE_SCHEDULER :::: SCHEDULING JOB:", jobId);
        statusChangeQueue.add('StatusChangeJob', {userId, timeSlot}, {jobId, delay});
        jobs.push(jobId);
    }));
    redisSetAsync(redisEntry, JSON.stringify(jobs));
    await disconnectFromDb();

    console.log('\n');
    console.log('#####################################################');
    console.log('#####################################################');
    console.log("STATUS_CHANGE_SCHEDULER :::: END");
    console.log('#####################################################');
    console.log('#####################################################');
    console.log('\n');
    done();
};