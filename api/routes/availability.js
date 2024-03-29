const express = require ('express');
const UserContextParams = require('../../model/UserContextParams');
const {
    getAvailabilityForToday,
    scheduleAvailabilityForToday,
    getSuggestedAvailabilityForToday,
    getCurrentAvailability,
    setCurrentAvailability,
    hasScheduledAvailabilityForToday,
    getNextAvailability
} = require('../../availability');
const {timeSlotsListFromObjectsList} = require('../../utils/timeSlot');

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
router.get('/next', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const userContextParams = await UserContextParams.findOne({userId});
            if(!userContextParams){
                res.status(400).send('Bad request!');
            }else{
                await res.json(await getNextAvailability(userContextParams));
            }
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/current', async function (req, res) {
    try {
        const {userId, newAvailability} = req.body;
        if(!userId || !newAvailability){
            res.status(400).send('Bad request!');
        }else{
            const userContextParams = await UserContextParams.findOne({userId});
            if(!userContextParams){
                res.status(400).send('Bad request!');
            }else{
                await res.json(await setCurrentAvailability(userContextParams, newAvailability));
            }
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.get('/today', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const availability = await getAvailabilityForToday(userId);
            await res.json(availability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.post('/today', async function (req, res) {
    try {
        const {userId, timeSlots} = req.body;
        if(!userId || !timeSlots){
            res.status(400).send('Bad request!');
        }else{
            res.send (await scheduleAvailabilityForToday(userId, timeSlotsListFromObjectsList(timeSlots)));
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});
router.get('/today/scheduled', async function (req, res) {
    try {
        const {userId} = req.query;
        if(!userId){
            res.status(400).send('Bad request!');
        }else{
            const result = await hasScheduledAvailabilityForToday(userId);
            res.send(result ? 'yes' : 'no');
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
            const suggestedAvailability = await getSuggestedAvailabilityForToday(userId);
            await res.json(suggestedAvailability.toObject());
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});

module.exports = router;