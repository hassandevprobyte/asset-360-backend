const IORedis = require("ioredis");
const env = require("./env");

const redis = new IORedis(env.REDIS.URL, {
  maxRetriesPerRequest: null,
});

module.exports = redis;
