const express = require ('express');
const UserContextParams = require('../../model/UserContextParams');
const {
    computeAvailabilityFromCalendarEvents,
    updateCalendarWithTimeSlots,
    computeAvailabilitySuggestionsFromUnassignedSlots,
    getCurrentAvailability,
    setCurrentAvailability
} = require('../../availability');

const router = express.Router();

router.get('/current', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const userContextParams = await UserContextParams.findOne({userId});
            if(!userContextParams){
                res.status(400).send('Bad request!');
            }else{
                await res.json(await getCurrentAvailability(userContextParams));
            }
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/current', function (req, res) {
    try {
        const {userId, newAvailability} = req.body;
        if(!userId || !newAvailability){
            res.status(400).send('Bad request!');
        }else{

        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.get('/remaining', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const userContextParams = await UserContextParams.findOne({userId});
            const availability = await computeAvailabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
            await res.json(availability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/remaining', async function (req, res) {
    try {
        const {userId, timeSlots} = req.body;
        if(!userId || !timeSlots){
            res.status(400).send('Bad request!');
        }else{
            await updateCalendarWithTimeSlots(userId, timeSlots);
            res.send('ok');
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.get('/suggested', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const userContextParams = await UserContextParams.findOne({userId});
            const availabilityFromCalendar = await computeAvailabilityFromCalendarEvents(userId, userContextParams.todayStartWorkTimestamp, userContextParams.todayEndWorkTimestamp);
            const suggestedAvailability = await computeAvailabilitySuggestionsFromUnassignedSlots(availabilityFromCalendar, userContextParams.minAvailableSlotInMinutes, userContextParams.minFocusSlotInMinutes);
            await res.json(suggestedAvailability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});

module.exports = router;