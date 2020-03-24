const express = require('express');
const UserIntegration = require('../../model/UserIntegration');

const router = express.Router();

router.get('/', function (req, res) {
    res.send('ok');
});

router.post('/', async function (req, res) {
     try {
         const {userId, name, data} = req.body;
         await UserIntegration.findOneAndUpdate({userId, name}, {name, data, userId}, {upsert: true, runValidators: true});
         res.send('ok');
     }catch (e) {
         console.error(e);
         if(e.name === 'ValidationError'){
             res.status(400).send('Bad request!');
         }else{
             res.status(500).send('Something went wrong!');
         }
     }
});

module.exports = router;