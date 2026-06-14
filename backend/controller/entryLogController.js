const EntryLog = require('../models/EntryLog'); 
const {maskPhone} = require('../services/maskData');
const uploadToCloudinary = require('../utils/uploadToCloudinary');
const { v2: cloudinary } = require('cloudinary');
// Mark Exit Controller
const markExit = async (req, res) => {
  try {
    const { id } = req.params;
    const {exitType,exitReason,expectedReturnAt} = req.body;
    //det status based on exit Type 
    //permanent /regular --> exited or permanent
    //test drive / service --> vehicle is out temporarily 
    const statusMap ={
      REGULAR : 'EXITED',
      PERMANENT :'PERMANENT',
      SERVICE :'SERVICE',
      TEST_DRIVE :'TEST_DRIVE',
    };

    const updatedLog = await EntryLog.findByIdAndUpdate(
      id,
      {  
        exitedAt:new Date(),
        exitType : exitType || "REGULAR",
        exitReason:exitReason|| " ",
        expectedReturnAt:expectedReturnAt||null,
        status: statusMap[exitType] || 'EXITED', 
      },
      { new: true } // Returns the updated document to the frontend
    );
    
    if (!updatedLog) {
      return res.status(404).json({ message: "Entry log not found" });
    }
    
    res.status(200).json(updatedLog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//  Vehicle History 
const getVehicleHistory = async (req, res) => {
  try {
    const { vehicleNumber } = req.params;
    
    // Finds all logs for this vehicle number (case-insensitive)
    const history = await EntryLog.find({ 
      vehicleNumber: vehicleNumber.toLowerCase()
    }).sort({ enteredAt: -1 }); // Newest entries at the top
 
    // res.status(200).json(history);
    const role = req.user.role ;

    const maskedHistory = history.map (log => {
      const obj = log.toObject();
      const{phoneNumber, countryCode} = maskPhone(
        obj.phoneNumber,
        obj.countryCode,
        role , 
        obj.status
      );
      return {...obj , phoneNumber, countryCode};
    });
    res.status(200).json(maskedHistory);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createLog = async(req,res)=>{
  try{
    const {
      //core visitor 
      phoneNumber,visitorName,idCardNumber,countryCode,email,recordedBy,

      //vehicle 
      vehicleNumber,vehicleType, vehicleModel,vehicleColor,

      //two wheeler 
      helmetWorn,pillionRider, pillionHelmet,

      //three wheeler 
      permitNumber, 

      //common field 
      rcBookNo, insuranceValidTill, passengerCount , driverLicenceNumber,

      //heavy vehicle 
      loadType , loadWeight , vendorNumber, challanNumber,

      //purpose 
      purpose,
      
      //test drive 
      driverName,customerName, 
      
      //service field 
      customerComplaint , serviceType , estimatedTime , serviceAdvisor , 

      //Delivery fields 
      itemDescription , recipientName ,

      //enquiry or visit 
      personToMeet,department, 
      
      //timming and status 
      enteredAt , exitedAt, expectedReturnAt, status , exitType ,exitReason 


    } = req.body;

    const log = new EntryLog({
      visitorName: visitorName?.trim(),
      idCardNumber: idCardNumber?.trim(),
      phoneNumber: phoneNumber?.trim(),
      countryCode: countryCode?.trim() || '+91',
      email:email?.trim(),
      recordedBy: recordedBy?.trim(),
      recordedById : req.user.id,

      //vehicle 
      vehicleNumber: vehicleNumber?.trim(),
      vehicleType,//coz here we use dropdown 
      vehicleModel :vehicleModel?.trim(),
      vehicleColor:vehicleColor?.trim(),

      //two wheeler 
      helmetWorn:helmetWorn||" ",
      pillionRider:pillionRider?.trim()||" ",
      pillionHelmet:pillionHelmet || "",

      //three wheeler 
      permitNumber :permitNumber?.trim()|| "",

      //common field 
      rcBookNo:rcBookNo?.trim()||" ",
      insuranceValidTill:insuranceValidTill||null,
      passengerCount:passengerCount||null,
      driverLicenceNumber:driverLicenceNumber||null,

      //heavyVehicle 
      loadType:loadType||"",
      loadWeight:loadWeight|| null,
      vendorNumber:vendorNumber|| null,
      challanNumber:challanNumber|| null,

      //purpose 
      purpose:purpose||" ",

      //test drive 
      driverName:driverName||" ",
      customerName:customerName||" ",

      //service field 
      customerComplaint:customerComplaint||" ",
      serviceType:serviceType||" ",
      estimatedTime:estimatedTime||" ",
      serviceAdvisor:serviceAdvisor||" ",

      //delivery fields 
      itemDescription:itemDescription||" ",
      recipientName:recipientName||" ",

      //enquiry or visit
      personToMeet:personToMeet|| " ",
      department:department|| " ",

      //timming and status 
      enteredAt : enteredAt?new Date(enteredAt) : new Date(),
      status: 'INSIDE'
    
    });
    await log.save();
    res.status(201).json(log);
  }
  catch(err){
    console.error('Create entry log failed:', err.message);
    res.status(400).json({message: err.message});
  }
};

//get all logs 
const getAllLogs = async(req,res)=>{
  try{
    const logs = await EntryLog.find().sort({enteredAt:-1});
    const role = req.user.role ;
    
    const maskedLogs = logs.map(log => {
      const obj = log.toObject();
      const {phoneNumber, countryCode } = maskPhone(
        obj.phoneNumber,
        obj.countryCode,
        role,   //admin, guard , viewer
        obj.status // inside or outside
      );
      return {...obj , phoneNumber, countryCode};
    });
    res.json(maskedLogs);
  }catch(err){
    res.status(500).json({message:err.message});
  }
}

const updateLog = async(req,res)=>{
  try{
    const updatedLog = await EntryLog.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if(!updatedLog){
      return res.status(404).json({message:"Entry log not found"});
    }

    res.status(200).json(updatedLog);
  }catch(err){
    res.status(400).json({message:err.message});
  }
};

const deleteLog = async(req,res)=>{
  try{
    const deletedLog = await EntryLog.findByIdAndDelete(req.params.id);

    if(!deletedLog){
      return res.status(404).json({message:"Entry log not found"});
    }

    res.status(200).json({message:"Entry deleted", entry: deletedLog});
  }catch(err){
    res.status(500).json({message:err.message});
  }
};

//upload photo 
const uploadPhoto = async (req,res)=>{
  try{
      const {id} = req.params;
      const {fieldName} = req.body;

      //validate fieldName -> only these 3 are allowed 
      const allowedField = ['visitorPhoto', 'idCardPhoto','vehiclePhoto'];
      if(!allowedField.includes(fieldName)){
        return res.status(400).json({message:"Invalid photo field"});
      }
      //multer puts file in req.file 
      //if no file received 
      if(!req.file){
        return res.status(400).json({message:"No file received "});
      }
      //folderMap for photo 
      const folderMap ={
        visitorPhoto : "visitors",
        idCardPhoto : "id-cards",
        vehiclePhoto : "vehicles"
      };

      const entry = await EntryLog.findById(id);
      if(!entry){
        return res.status(404).json({message:"Entry not found"});
      }

      if(entry[fieldName]?.publicId){
        try{
        await cloudinary.uploader.destroy(entry[fieldName].publicId);

        }
        catch(deleteErr){
          console.error('Failed to delete old photos:',deleteErr.message);
        }
      }

      //upload new photo
      const folder = folderMap[fieldName];
      const {url,publicId}=await uploadToCloudinary(req.file.buffer, folder);

      //save both url and public id in mongo
      const updated = await EntryLog.findByIdAndUpdate(
        id,
        {
          $set:{
            [fieldName]:{
              url,
              publicId
            }
          }
        },
        {new : true}
      );
      res.status(200).json({
        message : "Photo uploaded successfully ",
        url , 
        publicId,
        entry : updated
      });
  }
  catch(err){
    if(err.code ==="LIMIT_FILE_SIZE"){
      return res.status(400).json({message :"File too large!! Max 5 MB is allowed "});
    }
    if(err.message?.includes("Only JPG")){
      return res.status(400).json({message:err.message});
    }
    console.error('Photo upload failed :',err.message);
    res.status(500).json({message:"Photo upload failed..Try again."});
   }
};
module.exports = {
  markExit,
  getVehicleHistory, 
  createLog,
  getAllLogs, 
  updateLog,
  deleteLog,
  uploadPhoto,
};
