const express = require('express');
const router = express.Router();
const EntryLog = require('../models/EntryLog');
const {protect} = require('../middleware/authMiddleware');
router.post('/',protect,async(req,res)=>{
    try{
        console.log("Post entries ");
        console.log("req.body", req.body);
        console.log("req.user", req.user);
        const{visitorName , idCardNumber , vehicleNumber , enteredAt , recordedBy } = req.body;
        if(!visitorName || !idCardNumber || !vehicleNumber || !enteredAt || !recordedBy){
            return res.status(400).json({message:"All fields are required "});
        }
        const entry = new EntryLog({visitorName, idCardNumber, vehicleNumber, enteredAt, recordedBy, recordedById : req.user.id});
        await entry.save();
        console.log("Saved entry", entry);
        res.status(201).json({message:"Successfully recorded all the entries ", entry});
    }catch(err){
        res.status(500).json({message:"Server error!! please try again later",error :  err.message });
    }
}); 
router.put('/:id', protect , async(req, res)=>{
    try{
        const entry = await EntryLog.findByIdAndUpdate
        //arguments 
        (
            req.params.id ,
            {$set : req.body} , 
            //get the updated data following the rules of schema 
            {new : true , runValidators : true}
        );
        if(!entry) return res.status(404).json({message: "Entry not found"});
        res.json({message:'Entry Updated', entry});
    }catch(err){
        res.status(500).json({message:"Server not responding !!", error : err.message});
    }
});
router.get('/',protect, async (req,res)=>{
    try{
        console.log('Get entries ');
        console.log('req.user:', req.user);
        console.log('req.user.role', req.user.role);
        let entries;
        if(req.user.role === 'admin'){

            entries = await EntryLog.find().sort({enteredAt:-1});
        }
        else{
            entries = await EntryLog.find({recordedById:req.user.id}).sort({enteredAt:-1});
        }
        console.log('Entries found ', entries.length);
        console.log('Entries data', JSON.stringify(entries,null,2));
        res.json(entries);
    }
    catch(err){
        res.status(500).json({message:"Server error" , error : err.message});
    }
});
router.delete('/:id',protect, async (req,res)=>{
    try{
        const entry = await EntryLog.findByIdAndDelete(
            req.params.id
        );
        if(!entry) return res.status(404).json({message:"Entry not found "});
        res.json({message : "Entry Deleted", entry});
    }
    catch(err){
        res.status(500).json({message:"Server not responding try again later",error :err.message});
    }
});

module.exports = router;