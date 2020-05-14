const CalendarEvent = require('../model/CalendarEvent');
const {getAvailabilityForFullToday, invalidatedCachedTodayAvailability} = require('./todayAvailability');
const {performChangeStatusForUser} = require('../jobs/status');

const getCurrentAvailability = async function (userContextParams) {
    const availability = await getAvailabilityForFullToday(userContextParams.userId);
    return availability.current().toObject();
};
const setCurrentAvailability = async function (userContextParams, newAvailability) {
    const availability = await getAvailabilityForFullToday(userContextParams.userId);
    const current = availability.current();
    const now = new Date();
    if(current.status !== newAvailability){
       if(current.status === 'end'){
            if(newAvailability === 'available'){
                current.end = now.getTime() + userContextParams.minAvailableSlotInMinutes*60*1000;
            }else{
                current.end = now.getTime() + userContextParams.minFocusSlotInMinutes*60*1000;
            }
        }else if(current.status !== 'start'){
            //Update Teleport Events
            const updates = [];
            const eventsToUpdate = await CalendarEvent.findEventsBetweenTwoTimestamps(userContextParams.userId, current.start, current.end);
            eventsToUpdate.forEach(event => {
                if(event.startDateTime.getTime() >= now.getTime()){
                    //It means it's not started yet but part of the previous availability slot computation. Remove it.
                    updates.push({
                        deleteOne: {
                            filter: {_id: event.id}
                        }
                    });
                }else if(event.endDateTime.getTime() > now.getTime()){
                    //It means it was ongoing
                    updates.push({
                        updateOne: {
                            filter: {_id: event.id},
                            update: {
                                endDateTime: now
                            }
                        }
                    });
                }

            });
            if(updates.length > 0) {
                await CalendarEvent.bulkWrite(updates);
            }
        }

        //Create a new Event for the new current availability
        current.start = now.getTime();
        current.status = newAvailability;
        const calendarEvent = CalendarEvent.eventFromTimeSlot(current);
        calendarEvent.userId = userContextParams.userId;
        await calendarEvent.save();

        //Return the new availability
        const next = availability.next();
        //Merge with next status if needed
        if(next && next.status === current.status){
            current.end = next.end;
        }

        //Update Slack status
        performChangeStatusForUser(userContextParams.userId, current);
        await invalidatedCachedTodayAvailability(userContextParams.userId);
    }
    return current.toObject();
};
const getNextAvailability = async function (userContextParams) {
    const availability = await getAvailabilityForFullToday(userContextParams.userId);
    return availability.next().toObject();
};

module.exports.getCurrentAvailability = getCurrentAvailability;
module.exports.setCurrentAvailability = setCurrentAvailability;
module.exports.getNextAvailability = getNextAvailability;
