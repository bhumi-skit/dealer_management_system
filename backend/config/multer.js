const multer = require("multer");

const upload = multer({
    storage:multer.memoryStorage(),

    limits:{
        fileSize: 5*1024*1024
    },
    fileFilter:(req , file , cb)=>{
        const allowedTypes = ["image/jpeg","image/png","image/webp"];

        if(allowedTypes.includes(file.mimetype)){
            cb(null,true);
            //if call back is null --> no error then accept the file 

        }
        else{
            cb(new Error ("Only JPG , PNG , WEBP files alllowed "),false );
            //if err 
        }
    }
})

module.exports = upload;