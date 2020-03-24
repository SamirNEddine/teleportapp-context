const {verifyClientCredentials} = require('../../helpers/internalClient');

const apiAuth = async function (req, res, next) {
    const {clientId, clientSecret} = req.method === 'GET' ? req.query : req.body;
    if(!clientId || !clientSecret) return res.status(401).send('Access Denied');
    try{
        if(!await verifyClientCredentials(clientId, clientSecret)){
            res.status(401).send('Access Denied');
        }else{
            next();
        }
    }catch(error){
        res.status(400).send(error.message);
    }
};

module.exports = apiAuth;