import axios from  'axios'; // import the library 
//now create a basic url --> in this file we will be having with  the  url--> thats why we dont need to add the url everytime in diff files 
const API = axios.create({
    baseURL:'http://localhost:5000/api',
})

//now the interceptors it tells that when user enters details it acts a guard and check all the config the details 
API.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');

    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;

},(error)=>{
    return Promise.reject(error);
});

//to handle that whether the token is expired or not 
API.interceptors.response.use(
    (response)=> response ,
(error)=>{
    if(error.response?.status === 401){
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    }
    return Promise.reject(error);
}
);


export default API;