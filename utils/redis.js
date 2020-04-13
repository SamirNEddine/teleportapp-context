const {promisify} = require('util');
const redis = require('redis');

const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST);

client.on("error", function (err) {
    console.error("Redis Error: " + err);
});

const redisGetAsync = promisify(client.get).bind(client);
const redisSetAsync = promisify(client.set).bind(client);
const redisHmsetAsync = promisify(client.hmset).bind(client);
const redisHmgetAsync = promisify(client.hmget).bind(client);
const redisHmgetallAsync = promisify(client.hgetall).bind(client);
const redisDelAsync = promisify(client.del).bind(client);
const redisSetAsyncWithTTL = async function(key, value, TTL) {
    await redisSetAsync(key, value);
    client.expire(key, TTL)
};
const redisHmsetAsyncWithTTL = async function(key, value, TTL) {
    await redisHmsetAsync(key, value);
    client.expire(key, TTL)
};

module.exports.redisGetAsync = redisGetAsync;
module.exports.redisSetAsync = redisSetAsync;
module.exports.redisHmsetAsync = redisHmsetAsync;
module.exports.redisHmgetAsync = redisHmgetAsync;
module.exports.redisHmgetallAsync = redisHmgetallAsync;
module.exports.redisDelAsync = redisDelAsync;
module.exports.redisSetAsyncWithTTL = redisSetAsyncWithTTL;
module.exports.redisHmsetAsyncWithTTL = redisHmsetAsyncWithTTL;