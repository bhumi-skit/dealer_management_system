 import API from "./axios";
 export const sendAgentMessage = (message , history =[])=>{
    return API.post("/agent/chat", {message,history});
 };

 //this file is basically created for posting the queries or asking queries to gemini by user and it is created separately so it can be use easily from other files 
  