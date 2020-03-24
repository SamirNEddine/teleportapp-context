const crypto = require('crypto');
const argon2 = require('argon2');
const InternalClient = require('../model/InternalClient');

const generateClientId = function () {
    return crypto.randomBytes(20).toString('base64').slice(0, 14);
};
const generateClientSecret = function (clientId) {
    return `${clientId}_${crypto.randomBytes(20).toString('base64').slice(0, 30)}_${clientId}`;
};
const generateAndSaveClientSecret = async function (clientId) {
    const clientSecret = generateClientSecret(clientId);
    const clientSecretHash = await argon2.hash(clientSecret, argon2.argon2id);
    const client = InternalClient({clientId, clientSecret: clientSecretHash});
    await client.save();
    return {clientId, clientSecret};
};
const generateAndSaveCredentials = async function() {
    return await generateAndSaveClientSecret(generateClientId());
};
const verifyClientCredentials = async function (clientId, clientSecret) {
    const client = await InternalClient.findOne({clientId});
    if(client){
        return await argon2.verify(client.clientSecret, clientSecret);
    }else{
        return false;
    }
};

module.exports.generateAndSaveCredentials = generateAndSaveCredentials;
module.exports.verifyClientCredentials = verifyClientCredentials;