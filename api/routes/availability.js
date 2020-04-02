const express = require ('express');
const UserIntegration = require('../../model/UserIntegration');
const CalendarEvent = require('../../model/CalendarEvent');
const {performCalendarSync} = require('../../helpers/google');
const {computeAvailabilityFromCalendarEvents} = require('../../availability');

const router = express.Router();

router.get('/', async function (req, res) {
    try {
        const {userId, startTimestamp, endTimestamp} = req.query;
        if(!userId || !parseInt(startTimestamp) || !parseInt(endTimestamp)){
            res.status(400).send('Bad request!');
        }else{
            //Start by doing a sync
            const googleCalendarIntegration = await UserIntegration.findOne({userId, name:'google'});
            if(!googleCalendarIntegration) res.status(400).send('Bad request!');
            await performCalendarSync(googleCalendarIntegration);
            const startDate = new Date(parseInt(startTimestamp));
            const endDate =  new Date(parseInt(endTimestamp));
            const events = await CalendarEvent.find({
                userId,
                $or: [{
                        $and:[
                            {startDateTime: {$gte:startDate}},
                            {startDateTime: {$lte:endDate}}
                        ]
                    },
                    {
                        $and:[
                            {endDateTime: {$gte:startDate}},
                            {endDateTime: {$lte:endDate}}
                        ]
                    }]
            });
            const availability = computeAvailabilityFromCalendarEvents(events, startTimestamp, endTimestamp);
            await res.json(availability);
        }
    }catch (e) {
        console.error(e);
        res.status(500).send('Something went wrong!');
    }
});

router.post('/', function (req, res) {
    res.send('ok');
});

module.exports = router;