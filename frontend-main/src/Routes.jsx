import React, { useEffect } from "react";
import { useNavigate, useRoutes, useLocation } from 'react-router-dom';

// Pages List
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/user/Profile";
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import CreateRepository from "./components/dashboard/CreateRepository";
import Community from "./components/user/Community";
import Issues from "./components/dashboard/Issues";
import RepoDetail from "./components/dashboard/RepoDetail";

// Auth Context
import { useAuth } from "./authContext";

const ProjectRoutes = ()=>{
    const {currentUser} = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        if(!currentUser && !["/auth", "/signup"].includes(location.pathname))
        {
            navigate("/auth", { replace: true });
        }

        if(currentUser && ["/auth", "/signup"].includes(location.pathname)){
            navigate("/", { replace: true });
        }
    }, [currentUser, location.pathname, navigate]);

    let element = useRoutes([
        {
            path:"/",
            element:<Dashboard/>
        },
        {
            path:"/auth",
            element:<Login/>
        },
        {
            path:"/signup",
            element:<Signup/>
        },
        {
            path:"/profile",
            element:<Profile/>
        },
        {
            path:"/create",
            element:<CreateRepository/>
        },
        {
            path:"/community",
            element:<Community/>
        },
        {
            path:"/issues",
            element:<Issues/>
        },
        {
            path:"/repo/:id",
            element:<RepoDetail/>
        }
    ]);

    return element;
}

export default ProjectRoutes;