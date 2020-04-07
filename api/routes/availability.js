const express = require ('express');
const {computeAvailabilityFromCalendarEvents, updateCalendarWithTimeSlots} = require('../../availability');

const router = express.Router();

router.get('/current', async function (req, res) {
    try {
        const {userId, startTimestamp, endTimestamp} = req.query;
        if(!userId || !parseInt(startTimestamp) || !parseInt(endTimestamp)){
            res.status(400).send('Bad request!');
        }else{
            const now = new Date().getTime();
            if(now < parseInt(startTimestamp)) {
                await res.json({start:now, end: parseInt(startTimestamp), status: 'unassigned'});
            }else {
                const availability = await computeAvailabilityFromCalendarEvents(userId, parseInt(startTimestamp), parseInt(endTimestamp));
                console.log(availability.current());
                await res.json(availability.current().toObject());
            }
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/current', function (req, res) {
    try {
        res.send('ok');
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.get('/remaining', async function (req, res) {
    try {
        const {userId, startTimestamp, endTimestamp} = req.query;
        if(!userId || !parseInt(startTimestamp) || !parseInt(endTimestamp)){
            res.status(400).send('Bad request!');
        }else{
            const availability = await computeAvailabilityFromCalendarEvents(userId, parseInt(startTimestamp), parseInt(endTimestamp));
            await res.json(availability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/remaining', async function (req, res) {
    try {
        const {userId, timeSlots} = req.query;
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
        const {userId, startTimestamp, endTimestamp, minAvailableSlotInMinutes, minFocusSlotInMinutes} = req.query;
        if(!userId || !parseInt(startTimestamp) || !parseInt(endTimestamp) || !parseInt(minAvailableSlotInMinutes) || !parseInt(minFocusSlotInMinutes)){
            res.status(400).send('Bad request!');
        }else{
            const availability = await computeAvailabilityFromCalendarEvents(userId, parseInt(startTimestamp), parseInt(endTimestamp));
            await res.json(availability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});

module.exports = router;