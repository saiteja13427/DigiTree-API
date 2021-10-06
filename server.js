const express = require("express");
const _ = require("dotenv");


//Initialising app with express
const app = express();

//Loading env variables
_.config({path: "./config/config.env"});


const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log("Sever runnin on port: " + PORT);
})