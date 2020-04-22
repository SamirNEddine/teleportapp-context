const mongoose = require('mongoose');
const dbConnectURL = process.env.DB_FULL_URL;
module.exports.connectToDb = function () {
    return new Promise(async function (resolve, reject) {
        try{
            await mongoose.connect(dbConnectURL, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex:true, useUnifiedTopology:true});
            console.info('Successfully connected to the database');
            resolve();
        }catch(error){
            console.error(error);
            reject(error);
        }
    });
};
module.exports.disconnectFromDb = async function () {
    await mongoose.disconnect();
};