const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name:{
        type: String,
        required : [true, 'Please enter a name']
    },
    email:{
        type: String,
        required : [true,'Please enter a valid email'],
        unique : true,
        match : [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,'Please enter a valid email'
        ]
    },
    password:{
        type : String,
        required: [true,'Please enter a valid password'],
        minlength : 6,
        select : false
    },
    role :{
        type: String,
        enum : ['guard' , 'admin','viewer'],
        // default: 'guard'
    }
    
},{timestamps:true});

//here it says that when u enter pass it store in db and then the below func says that before saving the pass in db u must encrypt it to hash one 
//pre -- before , save -- before saving the pass--> async --> first run this next and for this next u have to check if ur pass is modified or not
    UserSchema.pre('save',async function (next) {
        if(!this.isModified('password')){
            next();
        }
        const salt = await bcrypt.genSalt(10); // await says stop at this line untill it creates hash 
        this.password = await bcrypt.hash(this.password,salt);
    });
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword,this.password)
};
module.exports = mongoose.model('User', UserSchema);
