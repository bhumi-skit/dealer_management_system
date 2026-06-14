const { parsePhoneNumber, isValidPhoneNumber } = require('libphonenumber-js');

const validateAndFormat = (phoneNumber , countryCode) =>{
    const cleanCountryCode = String(countryCode || '').trim();
    const cleanPhoneNumber = String(phoneNumber || '').trim().replace(/[\s-]/g, '');
    const fullNumber = cleanPhoneNumber.startsWith('+')
        ? cleanPhoneNumber
        : `${cleanCountryCode}${cleanPhoneNumber}`;

    if(!isValidPhoneNumber(fullNumber)){
        throw new Error('Invalid phone number for the given country code ');
    }    

    const parsed = parsePhoneNumber(fullNumber);
    return {
        phoneNumber : parsed.nationalNumber , 
        countryCode : `+${parsed.countryCallingCode}`
    };
};

module.exports = { validateAndFormat};
