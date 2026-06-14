// import { Children } from "react";
import { Navigate } from "react-router-dom";
export default function ProtectedRoute({children,allowedRoles}){
    const token = localStorage.getItem('token');
    if(!token) return <Navigate to='/login'/>;
    let role;

    try {
        role = JSON.parse(atob(token.split('.')[1])).role;
    }catch{
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        return <Navigate to="/login"/>;
    }

    const roleRedirectMap = {
        admin : '/admin',
        guard : '/guard',
        viewer : '/viewer'
    };

    if(allowedRoles && !allowedRoles.includes(role)){
        return <Navigate to={roleRedirectMap[role] || '/login'} />;
    }

    return children;
}
//this file basically tells u that u render btw diff pages 
//here we are using children for rendering pages
