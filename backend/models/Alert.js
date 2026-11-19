const mongoose = require("mongoose");

const AlertSchema = new mongoose.Schema({
    message:{type:String,required:true},
    severity:{type:String,enum:['medium','high','low'],default:'medium'},
    isRead:{type:Boolean,default:false},
    createdAt:{type:Date,default:Date.now},
});

module.exports=mongoose.model('Alert',AlertSchema);