const dotenv = require('dotenv');
dotenv.config();
global.fetch = require('node-fetch');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {startAgent} = require("./guardianAgent");
const agentRoutes = require("./routes/agentRoutes");
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/authRoutes');
const entryLogRoutes = require('./routes/entryLogRoutes');
// const entryLogRoutes = require('./routes/entryLogRoutes');
//remember all the things and part of .env file 

const app = express();

//use cors telling it the connection btw backend and fronted 
app.use(cors());
app.use(express.json());//allowing to read the data 
// app.use('/api/entries', entryLogRoutes);

//rate limiting 
const limiter = rateLimit({
    windowMs:15*60*1000,//the request is open for 15 minutes 1min = 60 sec, 1 sec = 1000 ms
    max:100, //max request which can be taken in one go is 100
    message : " Too many request from this ip, try again later"
    });
    app.use(limiter);//when any request comes in first it will go through this limiter-- it is a middleware

    app.use((req,res,next)=>{
        console.log(`${req.method}${req.url}`);
        next();
    });
    //routes 
    app.use('/api/auth',authRoutes);
    app.use('/api/entrylogs',entryLogRoutes);
    app.use('/api/agent',agentRoutes);
    
    //Test routes
    app.get('/',(req,res)=>{
        res.send("The Dealer management system is running ");
    });
    
    //now connection of mongodb
    mongoose.connect(process.env.MONGO_URI)
    .then(() =>{ console.log("Mongo Connected");
        startAgent();
    })
    .catch((err)=>console.log("Mongo not connected",err));
    
    ///Start the server 
    const PORT = process.env.PORT || 5000;
    app.listen(PORT , ()=>{
        console.log(`Server is running on http://localhost:${PORT}`);
    });

