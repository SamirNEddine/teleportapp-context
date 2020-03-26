const express = require('express');
const UserIntegration = require('../../model/UserIntegration');

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

router.post('/', async function (req, res) {
     try {
         const {userId, name, data} = req.body;
         await UserIntegration.findOneAndUpdate({userId, name}, {name, data, userId}, {upsert: true, runValidators: true});
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