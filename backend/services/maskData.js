const maskPhone = (phoneNumber , countryCode , role , status ) => {
    // for guard if vehicle is inside then record its status 
    
    if(role === 'guard'){
        if(status === 'INSIDE'){
            return{
                phoneNumber,
                countryCode
            };
        }
        //otw return nothing 
        return {
            phoneNumber: "*******",
            countryCode : "***"
        };

        }
        //for admin return phone number and actual details --> full access 
        if(role === 'admin'){
            return {
                phoneNumber,
                countryCode
            };
        }
        //viewer --> always masked 
        if(role === 'viewer'){
            return {
                phoneNumber : '********',
                countryCode : '*****'
            };
        }
        return {
            phoneNumber : "******",
            countryCode : "**"
        };
        
};
module.exports = {maskPhone};
