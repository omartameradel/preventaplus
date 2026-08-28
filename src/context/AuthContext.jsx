import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db, googleProvider } from "../firebase/config.js";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const register = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", res.user.uid), {
      uid: res.user.uid,
      name,
      email,
      role: "user",
      status: "active",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });
    return res;
  };

  const loginWithGoogle = async () => {
    const res = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, "users", res.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        name: res.user.displayName,
        email: res.user.email,
        photoURL: res.user.photoURL,
        role: "user",
        status: "active",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }
    return res;
  };

  const logout = () => signOut(auth);

  return React.createElement(
    AuthContext.Provider,
    { value: { currentUser, userData, loading, login, register, loginWithGoogle, logout } },
    !loading && children
  );
};
