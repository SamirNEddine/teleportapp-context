const express = require('express');
const UserContextParams = require('../../model/UserContextParams');

const router = express.Router();

router.get('/', async function (req, res) {
    try {
        const {userId} = req.query;
        const contextParams = await UserContextParams.findOne({userId});
        if(contextParams){
            await res.json({name, data: contextParams.data});
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
        const {userId, userContextParams} = req.body;
        if(!userId || !userContextParams){
            res.status(400).send('Bad request!');
        }else{
            await UserContextParams.findOneAndUpdate({userId}, userContextParams, {upsert: true, runValidators: true});
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