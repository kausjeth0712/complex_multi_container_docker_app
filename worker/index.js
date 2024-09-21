const keys = require("./keys");

const redis = require("redis");
const client = redis.createClient(
  {
    socket: {
      host: keys.redisHost,
      port: keys.redisPort,
    },
    retry_strategy: () => 1000,
  }
);

(async () => {
  await client.connect();
  const subscriber = client.duplicate();
  await subscriber.connect();
  await subscriber.subscribe("insert", async (message)=>{
    console.log("message", message);
    await client.hSet("values", message, fib(parseInt(message)));
  });

})();

const fib = (index) => {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
};
