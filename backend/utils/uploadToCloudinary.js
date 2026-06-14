const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer,folder)=>{
    return new Promise((resolve,reject)=>{
        
        const stream = cloudinary.uploader.upload_stream({
            folder:`guard-dashboard/${folder}`,
            //it is a way of organization a folder like visitors , vehicles
            //guard-dashboard/vistors 
            //guard-dashboard/vehicles 

            resource_type : "image",
            transformation :[
                {
                    width:800,
                    height:800,
                    crop : "limit",
                    quality:"auto",
                }
            ]
        },
        (error,result) => {
            if(error){
                reject(error);
                //here it rejects the promise 
            }
            else {
               resolve({
                url: result.secure_url,
                publicId:result.public_id,
               })
            }
        }
    );
    stream.end(buffer);
    });

};
module.exports = uploadToCloudinary;
