import API from './axios';

//called from login.jsx
export const loginUser = (credential) => API.post('/auth/login',credential);//here credential is a parameter only which we will be usig in entryLogApi.js 

//called from register.jsx
export const registeruser =(userData) => API.post('/auth/register',userData);