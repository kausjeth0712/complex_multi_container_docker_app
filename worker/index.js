const keys = require("./keys");

const redis = require("redis");

const redisClient = redis.createClient({
    socket:{
        host: keys.redisHost,
        port: keys.redisPort,
    },
    retry_strategy: () => 1000
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));
const sub = redisClient.duplicate();

const fib = (index) => {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

sub.on("message", (channel, message)=>{
    redisClient.hSet("values", message, fib(parseInt(message)));
});

sub.subscribe("insert");