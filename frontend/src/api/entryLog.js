import API from "./axios";

//to fetch details --> all three dashBoards -->get
const getAllLogs =() => API.get('/entrylogs');

//to enter data by guard -->for guard --> put
const createLogs =(logData) => API.post('/entrylogs', logData);

//to markExit by guard and admin --> for admin as well as guard --> patch (partially updating the data)
const exitvisitor = (id,exitData) => API.put(`/entrylogs/${id}/exit`,exitData);

export {getAllLogs,createLogs,exitvisitor};
