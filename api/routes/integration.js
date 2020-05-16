const express = require('express');
const UserIntegration = require('../../model/UserIntegration');
const UserContextParams = require('../../model/UserContextParams');
const {performCalendarSync} = require('../../helpers/google');

const router = express.Router();

router.get('/', async function (req, res) {
    try {
        const {userId, name} = req.query;
        const integration = await UserIntegration.findOne({userId, name});
        if(integration){
            await res.json({name, data: integration.data});
        }else{
            res.status(400).send('Bad request!');
        }
    }catch (e) {
        console.error(e);
        if(e.name === 'ValidationError' || e.name === 'CastError'){
            res.status(400).send('Bad request!');
        }else{
            res.status(500).send('Something went wrong!');
        }
    }
});
router.get('/all', async function (req, res) {
    try {
        const {userId} = req.query;
        const integrations = await UserIntegration.find({userId});
        if(integrations){
            await res.json(integrations.map(integration => {return integration.name}));
        }else{
            res.status(400).send('Bad request!');
        }
    }catch (e) {
        console.error(e);
        if(e.name === 'ValidationError' || e.name === 'CastError'){
            res.status(400).send('Bad request!');
        }else{
            res.status(500).send('Something went wrong!');
        }
    }
});

router.post('/', async function (req, res) {
     try {
         const {userId, name, data} = req.body;
         const integration = await UserIntegration.findOneAndUpdate({userId, name}, {name, data, userId}, {upsert: true, runValidators: true, new: true});
         //Quick and dirty for now
         if(name === 'google'){
             const userContextParams = await UserContextParams.findOne({userId});
             await performCalendarSync(integration, new Date(userContextParams.todayStartWorkTimestamp));
         }
         res.send('ok');
     }catch (e) {
         console.error(e);
         if(e.name === 'ValidationError' || e.name === 'CastError'){
             res.status(400).send('Bad request!');
         }else{
             res.status(500).send('Something went wrong!');
         }
     }
});

module.exports = router;