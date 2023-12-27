const keys = require("./keys");


// Express setup
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// postgres client setup
const { Pool } = require("pg");
const pgClient = new Pool ({
    user:keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort
});

pgClient.on("error", ()=> console.log("Lost PG connection.."));

pgClient.query("CREATE TABLE IF NOT EXISTS values (number INT)").catch((err)=> console.log(err));

//redis client setup
const redis = require("redis");
let redisPublisher;
let redisClient;

const client = async () => {
    redisClient = redis.createClient({
        socket:{
            host: keys.redisHost,
            port: keys.redisPort,
        },
        retry_strategy: ()=> 1000
    });
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    await redisClient.connect();
    redisPublisher = redisClient.duplicate();
}

client();

// Express route handlers

app.get("/", (req, res)=>{
    res.send("hi");
});

app.get("/values/all", async (req, res)=>{
    const values = await pgClient.query("SELECT * from values");
    res.send(values.rows);
});

app.get("/values/current", async (req, res)=>{
    try{
        redisClient.hGetAll("values", (err, values)=>{
        res.send(values);
        })
    }catch(e){
        console.log(e);
    }
   
});

app.post("/values", async (req, res)=>{
    const index = req.body.index;

    if(parseInt(index) > 40){
        return res.status(422).send("Index too high");
    }

    redisClient.hSet("values", index, "Nothing yet!");
    redisPublisher.publish("insert", index);
    pgClient.query("INSERT INTO values(number) VALUES($1)", [index]);
    res.send({Working: true});
});

app.listen(5000, ()=>{
    console.log("Listening...")
})