import React, { useState,createContext, useEffect } from 'react'
import app from "../firebase/firebase.config"
import {onAuthStateChanged ,createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth"


export const AuthContext = createContext();
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const AuthProvider = ({children}) => {
  const [ user, setUser ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  const createUser = (email,password)=>{
   setLoading(true);
   return createUserWithEmailAndPassword(auth,email,password).finally(() => setLoading(false));
  }
  
  const loginWithGoogle = () =>{
    setLoading(true);
    return signInWithPopup(auth, googleProvider).finally(() => setLoading(false));
  }  
  const login = (email,password)=> {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password).finally(() => setLoading(false));
  }
  const logOut = () => {
    return signOut(auth)
  }

  // Helper: get current user's ID token for API calls
  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

   useEffect(()=>{
    const unsubscribe = onAuthStateChanged(auth,currentUser=>{
      setUser(currentUser);
      setLoading(false);
    });
    return()=>{
      return unsubscribe();
    }
   },[])
  const authInfo = {
     user,
     createUser,
     loginWithGoogle,
     loading,
     login,
     logOut,
     getToken
  }
  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  )
} 

export default AuthProvider