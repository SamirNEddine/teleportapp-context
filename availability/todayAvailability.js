const {getLocalTodayDate} = require('../utils/timezone');
const Availability = require('./Availability');
const TimeSlot = require('./TimeSlot');
const UserContextParams = require('../model/UserContextParams');
// const UserIntegration = require('../model/UserIntegration');
const {availabilityFromCalendarEvents} = require('./availabilityFromCalendar');
const {updateCalendarWithTimeSlots} = require('./calendarFromAvailability');
const {computeAvailabilitySuggestionFromUnassignedSlots} = require('./availabilitySuggestion');
// const {performCalendarSync} = require('../helpers/google');
const {redisHmgetAsync, redisHmsetAsyncWithTTL, redisHmgetallAsync} = require('../utils/redis');
const {getTimestampFromLocalTodayTime} = require('../utils/timezone');

const TODAY_SCHEDULE_CACHE_PREFIX = 'TODAY_SCHEDULE';

const _getCachedTodayAvailability = async function(userId){
    const cacheKey = `${TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    const cache = await redisHmgetallAsync(cacheKey);
    console.log(cache);
    if(cache){
        console.log('Returning cached availability');
        const {startTime, endTime, schedule} = await redisHmgetallAsync(cacheKey);
        const availability = new Availability(parseInt(startTime), parseInt(endTime));
        const parsedSchedule = JSON.parse(schedule);
        parsedSchedule.forEach( timeSlot => {
            availability.addTimeSlot(new TimeSlot(timeSlot.start, timeSlot.end, timeSlot.status) );
        });
        return availability;
    }else{
        return null;
    }
};
const _setCachedTodayAvailability = async function(userId, availability, IANATimezone){
    const cacheKey = `${TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    const now = new Date().getTime();
    const TTL = Math.ceil(( getTimestampFromLocalTodayTime('2359', IANATimezone) - now ) / 1000);
    await redisHmsetAsyncWithTTL(cacheKey, {startTime: availability.startTime, endTime: availability.endTime, schedule: JSON.stringify(availability.schedule)}, TTL);
};

const getSuggestedAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    const availabilityFromCalendar = await getAvailabilityForToday(userId);
    return await computeAvailabilitySuggestionFromUnassignedSlots(availabilityFromCalendar, userContextParams.minAvailableSlotInMinutes, userContextParams.minFocusSlotInMinutes);
};

const getAvailabilityForToday = async function (userId) {
    //Start by doing a sync
    // const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
    // if(!googleCalendarIntegration) throw new Error('Bad request!');
    // await performCalendarSync(googleCalendarIntegration);
    let todayAvailability = await _getCachedTodayAvailability(userId);
    if(!todayAvailability){
        const userContextParams = await UserContextParams.findOne({userId});
        todayAvailability = await availabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
        await _setCachedTodayAvailability(userId, todayAvailability, userContextParams.IANATimezone);
    }
    return todayAvailability;
};

const scheduleAvailabilityForToday = async function (userId, timeSlots) {
    const userContextParams = await UserContextParams.findOne({userId});
    const today = getLocalTodayDate(userContextParams.IANATimezone);
    if(today !== userContextParams.lastScheduledAvailabilityDate){
        await updateCalendarWithTimeSlots(userId, timeSlots);
        userContextParams.lastScheduledAvailabilityDate = today;
        await userContextParams.save();
        return 'ok';
    }else{
        return 'Already done for today!';
    }
};

module.exports.getSuggestedAvailabilityForToday = getSuggestedAvailabilityForToday;
module.exports.getAvailabilityForToday = getAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = scheduleAvailabilityForToday;