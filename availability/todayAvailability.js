const {getLocalTodayDate} = require('../utils/timezone');
const Availability = require('./Availability');
const TimeSlot = require('./TimeSlot');
const UserContextParams = require('../model/UserContextParams');
const UserIntegration = require('../model/UserIntegration');
const {availabilityFromCalendarEvents} = require('./availabilityFromCalendar');
const {updateCalendarWithTimeSlots} = require('./calendarFromAvailability');
const {computeAvailabilitySuggestionFromUnassignedSlots} = require('./availabilitySuggestion');
const {performCalendarSync} = require('../helpers/google');
const {redisHmsetAsyncWithTTL, redisHmgetallAsync, redisDelAsync} = require('../utils/redis');
const {getTimestampFromLocalTodayTime} = require('../utils/timezone');
const {scheduleTodayStatusChangeForUserIfNeeded} = require('../jobs/status');

const TODAY_SCHEDULE_CACHE_PREFIX = 'TODAY_SCHEDULE';
const FULL_TODAY_SCHEDULE_CACHE_PREFIX = 'FULL_TODAY_SCHEDULE';
/** Private **/
const _getCachedAvailabilityForKey = async function(cacheKey){
    const cache = await redisHmgetallAsync(cacheKey);
    if(cache){
        console.log('Returning cached availability');
        const {startTime, lunchTime, lunchDurationInMinutes, endTime, schedule} = await redisHmgetallAsync(cacheKey);
        const availability = new Availability(parseInt(startTime), parseInt(lunchTime), parseInt(lunchDurationInMinutes), parseInt(endTime));
        const parsedSchedule = JSON.parse(schedule);
        parsedSchedule.forEach( timeSlot => {
            if(timeSlot.status !== 'lunch'){
                availability.addTimeSlot(new TimeSlot(timeSlot.start, timeSlot.end, timeSlot.status) );
            }
        });
        return availability;
    }else{
        return null;
    }
};
const _setCachedAvailabilityForKey = async function(cacheKey, availability, IANATimezone){
    const now = new Date().getTime();
    const TTL = Math.ceil(( getTimestampFromLocalTodayTime('2359', IANATimezone) - now ) / 1000);
    await redisHmsetAsyncWithTTL(cacheKey, {startTime: availability.startTime, lunchTime: availability.lunchTime, lunchDurationInMinutes: availability.lunchDurationInMinutes, endTime: availability.endTime, schedule: JSON.stringify(availability.schedule)}, TTL);
};
const _getCachedTodayAvailability = async function(userId){
    const cacheKey = `${TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    return await _getCachedAvailabilityForKey(cacheKey);
};
const _setCachedTodayAvailability = async function(userId, availability, IANATimezone){
    const cacheKey = `${TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    await _setCachedAvailabilityForKey(cacheKey, availability, IANATimezone)
};
const _getCachedFullTodayAvailability = async function(userId){
    const cacheKey = `${FULL_TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    return await _getCachedAvailabilityForKey(cacheKey);
};
const _setCachedFullTodayAvailability = async function(userId, availability, IANATimezone){
    const cacheKey = `${FULL_TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    await _setCachedAvailabilityForKey(cacheKey, availability, IANATimezone)
};
const _updateHasScheduledAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    userContextParams.lastScheduledAvailabilityDate = getLocalTodayDate(userContextParams.IANATimezone);
    await userContextParams.save();
};

/** Public **/
const invalidatedCachedTodayAvailability = async function(userId){
    console.log('Invalidating today availability cache for user', userId);
    const todayCacheKey = `${TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    await redisDelAsync(todayCacheKey);
    const fullTodayCacheKey = `${FULL_TODAY_SCHEDULE_CACHE_PREFIX}_${userId}`;
    await redisDelAsync(fullTodayCacheKey);
};

const hasScheduledAvailabilityForToday = async function(userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    const today = getLocalTodayDate(userContextParams.IANATimezone);
    return (today === userContextParams.lastScheduledAvailabilityDate);
};
const getSuggestedAvailabilityForToday = async function (userId) {
    const userContextParams = await UserContextParams.findOne({userId});
    const availabilityFromCalendar = await getAvailabilityForToday(userId);
    return await computeAvailabilitySuggestionFromUnassignedSlots(availabilityFromCalendar, userContextParams.minAvailableSlotInMinutes, userContextParams.minFocusSlotInMinutes);
};
const getAvailabilityForToday = async function (userId) {
    //Start by doing a sync
    const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
    if(!googleCalendarIntegration) throw new Error('Bad request!');
    const {todayUpdates} = await performCalendarSync(googleCalendarIntegration);
    if(todayUpdates) await scheduleTodayStatusChangeForUserIfNeeded(userId, true);
    let todayAvailability = await _getCachedTodayAvailability(userId);
    if(!todayAvailability){
        const userContextParams = await UserContextParams.findOne({userId});
        todayAvailability = await availabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayLunchTimestamp, userContextParams.lunchDurationInMinutes, userContextParams.todayEndWorkTimestamp);
        await _setCachedTodayAvailability(userId, todayAvailability, userContextParams.IANATimezone);
    }
    return todayAvailability;
};
const getAvailabilityForFullToday = async function (userId) {
    //Start by doing a sync
    const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
    if(!googleCalendarIntegration) throw new Error('Bad request! Not integration found for user');
    const {todayUpdates} = await performCalendarSync(googleCalendarIntegration);
    if(todayUpdates) await scheduleTodayStatusChangeForUserIfNeeded(userId, true);
    let fullTodayAvailability = await _getCachedFullTodayAvailability(userId);
    if(!fullTodayAvailability){
        const userContextParams = await UserContextParams.findOne({userId});
        fullTodayAvailability = await availabilityFromCalendarEvents(userId, userContextParams.todayZeroTimestamp, userContextParams.todayLunchTimestamp, userContextParams.lunchDurationInMinutes, userContextParams.today24Timestamp, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
        await _setCachedFullTodayAvailability(userId, fullTodayAvailability, userContextParams.IANATimezone);
    }
    return fullTodayAvailability;
};
const scheduleAvailabilityForToday = async function (userId, timeSlots) {
    if(! await hasScheduledAvailabilityForToday(userId)){
        await updateCalendarWithTimeSlots(userId, timeSlots);
        await _updateHasScheduledAvailabilityForToday(userId);
        await invalidatedCachedTodayAvailability(userId);
        return 'ok';
    }else{
        return 'Already done for today!';
    }
};

/** Exports **/
module.exports.hasScheduledAvailabilityForToday = hasScheduledAvailabilityForToday;
module.exports.getSuggestedAvailabilityForToday = getSuggestedAvailabilityForToday;
module.exports.getAvailabilityForToday = getAvailabilityForToday;
module.exports.scheduleAvailabilityForToday = scheduleAvailabilityForToday;
module.exports.invalidatedCachedTodayAvailability = invalidatedCachedTodayAvailability;
module.exports.getAvailabilityForFullToday = getAvailabilityForFullToday;