const jwt = require('jsonwebtoken');
const protect = async(req,res ,next)=>{
    let token;

    //now check that the token received from client matches the token present in db 
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token ){
        return res.status(401).json({message:"Not Authorized"});

    }
    try{
        const decoder = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoder;
        next();
    }
    catch(err){
        res.status(401).json({message:"Token is invalid"});
    }
}

const authorize = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return res.status(403).json({message:`Access denied ${req.user.role} cannnot perform this action `});
        }
        next();
    };
};
module.exports ={protect , authorize};