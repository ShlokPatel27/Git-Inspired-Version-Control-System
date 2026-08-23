import React, {createContext, useState, useEffect, useContext} from 'react';

const AuthContext = createContext();

export const useAuth = ()=>{
    return useContext(AuthContext);
}

export const AuthProvider = ({children})=>{
    // Read localStorage synchronously to prevent flash of default content on refresh
    const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('userId'));
    const [cachedUsername, setCachedUsername] = useState(() => localStorage.getItem('mygit_cached_username') || '');

    // Helper to update username cache everywhere
    const updateCachedUsername = (name) => {
        if (name) {
            setCachedUsername(name);
            localStorage.setItem('mygit_cached_username', name);
        }
    };

    const value = {
        currentUser, setCurrentUser,
        cachedUsername, updateCachedUsername
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}