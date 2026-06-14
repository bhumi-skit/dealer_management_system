const mongoose = require ('mongoose');
const {validateAndFormat} = require('../services/phoneValidator');
const EntrylogSchema = new mongoose.Schema({

        //Core visitor info 
        visitorName : {type:String,required : true}, //who visits the office 
        idCardNumber : {type : String,required: true}, // what is the id card number--> aadhar , licence or any other identification proof of that person entering the showroom
        // vehicleNumber : {type: String , required: true,lowercase : true}, 
        phoneNumber : {type : String , required: true, trim : true},
        countryCode : {type : String, required : true , default : "+91"},
        email:{type:String,default:""},
        recordedBy : {type : String , required : true},
        recordedById:{type:mongoose.Schema.Types.ObjectId, ref:'User'},

        //vehicle info 
        vehicleNumber:{type:String , required :true ,lowercase:true},
        vehicleType :{
            type :String,
            enum :['TWO_WHEELER','THREE_WHEELER','FOUR_WHEELER','HEAVY_VEHICLE' ],
            required : true 
        },
        vehicleModel :{type:String , default:""},
        vehicleColor :{type:String, default:""},
        // could be nullable as they havent left yet

        //Two wheeler 
        helmetWorn:{type:String , enum :["yes", "no",""],default:""},
        pillionRider:{type:String,default:""},
        pillionHelmet:{type:String , enum :["yes", "no",""],default:""},

        //Three Wheeler 
        permitNumber :{type:String,default:""},

        //Common Field 
        rcBookNo :{type: String , default:""},
        insuranceValidTill :{type: Date , default:null},
        passengerCount :{type: Number , default:null},
        driverLicenceNumber :{type: String , default:""},

        //Heavy Vehicle 
        loadType :{
            type:String,
            enum :["GOODS","RAW_MATERIAL","EMPTY",""],
            default :""
        },
        loadWeight :{type:Number , default : null},
        vendorNumber :{type:String , default : ""},
        challanNumber :{type:String , default : ""},

        //purpose 
        purpose :{
            type : String , 
            enum :["TEST_DRIVE", "SERVICE","REGULAR", "PERMANENT", "ENQUIRY", "DELIVERY", "VISIT", ""],
            default:""
        },

        //Test Drive 
        driverName : {type:String, default:""},
        customerName :{type:String, default:""},

        //service field
        customerComplaint :{type:String,default :""},
        serviceType :{type:String, default : ""},
        estimatedTime :{type:String, default :""},
        serviceAdvisor :{type:String, default :""},

        //Delivery fields 
        itemDescription :{type:String , default :""},
        recipientName :{type:String , default :""},

        //Enquiry or Visit 
        personToMeet :{type:String,default:""},
        department :{type:String,default:""},

        //timming and status 
        enteredAt : {type:Date, required : true},
        exitedAt:{type:Date , default : null},
        expectedReturnAt:{type:Date,default:null},
        status:{type:String, 
            enum :['INSIDE' , 'EXITED', 'PERMANENT', 'SERVICE', 'TEST_DRIVE'],
            default:'INSIDE'
        },
        exitType:{
            type:String,
            enum:['REGULAR','TEST_DRIVE','SERVICE','PERMANENT', ''],
            default :""
        },
        exitReason :{type:String, default:""},

        //PHOTOS 
        visitorPhoto:{
            url:{type:String, default:""},
            publicId:{type:String , default:""},
        },
        idCardPhoto:{
            url: {type:String, default:""},
            publicId:{type:String , default :""},
        },
        vehiclePhoto:{
            url:{type:String, default:""},
            publicId:{type:String, default:""},
        },

    },{timestamps :true});
    //timestamps --> when the data is created and updatedAt
    //here before saving the document run the function next 
EntrylogSchema.pre('save', function () {
    const {phoneNumber, countryCode} = validateAndFormat(
        this.phoneNumber,
        this.countryCode
    );
    this.phoneNumber = phoneNumber;
    this.countryCode = countryCode;
});
    module.exports = mongoose.model('EntryLog', EntrylogSchema);
