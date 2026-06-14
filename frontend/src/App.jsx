import {BrowserRouter as Router , Routes ,Route} from 'react-router-dom'; 
import Register from "./pages/register";
import Login from "./pages/login";
import ProtectedRoute from './components/ProtectedRoute';

//admin , guard and viewer pages 
import AdminDashboard from "./pages/AdminDashboard";
import GuardDashboard from "./pages/GuardDashboard";
import ViewerDashboard from "./pages/ViewerDashboard";

 function App(){
  return (
    <Router>
      <Routes>
      <Route path="/" element={<Login/>}/>
      <Route path="/register" element={<Register/>}/>
      <Route path="/login" element={<Login/>}/>
      
       <Route path="/dashboard" element={<h1>Welcome to the dashboard</h1>}/> 
      <Route path='/admin' element={<ProtectedRoute allowedRoles={['admin']}>
        <AdminDashboard/>
      </ProtectedRoute>}/> 
      <Route path='/guard' element={<ProtectedRoute allowedRoles={['guard']}>
        <GuardDashboard/>
      </ProtectedRoute>}/>
       <Route path='/viewer' element ={<ProtectedRoute allowedRoles={['viewer']}>
        <ViewerDashboard/>
      </ProtectedRoute>}/> 
      </Routes>
    </Router>
  );
 }
 export default App;
