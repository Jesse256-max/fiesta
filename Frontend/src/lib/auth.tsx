import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleAuthProvider } from "./firebase.ts";
import { signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { User } from "../types.ts";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  dbUser: User | null;
  loading: boolean;
  token: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserSync: () => Promise<void>;
  
  // Local Auth Extensions
  localUser: { email: string; batchNo: string; name: string; isGuest: boolean; department?: string } | null;
  loginLocally: (email: string, batchNo: string, password: string, saveInfo: boolean) => Promise<void>;
  loginAsGuest: () => void;
  savedInfo: { email: string; batchNo: string; password: string; saved: boolean } | null;
  clearSavedInfo: () => void;
  updateLocalUserProfile: (name: string, department: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Local user authentication states
  const [localUser, setLocalUser] = useState<{ email: string; batchNo: string; name: string; isGuest: boolean } | null>(null);
  const [savedInfo, setSavedInfo] = useState<{ email: string; batchNo: string; password: string; saved: boolean } | null>(null);

  const syncUserWithBackend = async (fbUser: FirebaseUser, idToken: string) => {
    try {
      const response = await fetch("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: fbUser.displayName || fbUser.email?.split("@")[0],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to sync user on backend");
      }

      const data = await response.json();
      if (data.success) {
        setDbUser(data.user);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
    }
  };

  useEffect(() => {
    // 1. Initialise saved credentials & auto-login active sessions
    const storedSavedInfo = localStorage.getItem("technotrons_saved_login");
    if (storedSavedInfo) {
      try {
        setSavedInfo(JSON.parse(storedSavedInfo));
      } catch (e) {
        console.error("Error parsing saved login info", e);
      }
    }

    const storedLocalUser = localStorage.getItem("technotrons_local_user");
    if (storedLocalUser) {
      try {
        setLocalUser(JSON.parse(storedLocalUser));
      } catch (e) {
        console.error("Error parsing stored local user", e);
      }
    }

    // 2. Firebase Auth Listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (user) {
        setFirebaseUser(user);
        try {
          const idToken = await user.getIdToken();
          setToken(idToken);
          await syncUserWithBackend(user, idToken);
        } catch (err) {
          console.error("Error fetching token:", err);
        }
      } else {
        setFirebaseUser(null);
        setDbUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleAuthProvider);
      const idToken = await result.user.getIdToken();
      setToken(idToken);
      setFirebaseUser(result.user);
      await syncUserWithBackend(result.user, idToken);
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginLocally = async (email: string, batchNo: string, password: string, saveInfo: boolean) => {
    setLoading(true);
    try {
      // Create a student name based on email prefix or custom formatting
      const cleanEmail = email.trim();
      const emailPrefix = cleanEmail.split("@")[0];
      const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
      
      const u = {
        email: cleanEmail,
        batchNo: batchNo.trim(),
        name: `${displayName} (${batchNo.trim()})`,
        isGuest: false
      };

      setLocalUser(u);
      localStorage.setItem("technotrons_local_user", JSON.stringify(u));

      if (saveInfo) {
        const info = { email: cleanEmail, batchNo: batchNo.trim(), password, saved: true };
        setSavedInfo(info);
        localStorage.setItem("technotrons_saved_login", JSON.stringify(info));
      } else {
        setSavedInfo(null);
        localStorage.removeItem("technotrons_saved_login");
      }
    } catch (error) {
      console.error("Local login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    const u = {
      email: "guest@technotrons.edu",
      batchNo: "GUEST",
      name: "Guest Student",
      isGuest: true
    };
    setLocalUser(u);
    localStorage.setItem("technotrons_local_user", JSON.stringify(u));
  };

  const clearSavedInfo = () => {
    setSavedInfo(null);
    localStorage.removeItem("technotrons_saved_login");
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setFirebaseUser(null);
      setDbUser(null);
      setToken(null);
      setLocalUser(null);
      localStorage.removeItem("technotrons_local_user");
    } catch (error) {
      console.error("Sign-out failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateLocalUserProfile = (name: string, department: string) => {
    if (localUser) {
      const updated = { ...localUser, name, department };
      setLocalUser(updated);
      localStorage.setItem("technotrons_local_user", JSON.stringify(updated));
    }
  };

  const refreshUserSync = async () => {
    if (firebaseUser && token) {
      await syncUserWithBackend(firebaseUser, token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        dbUser,
        loading,
        token,
        loginWithGoogle,
        logout,
        refreshUserSync,
        localUser,
        loginLocally,
        loginAsGuest,
        savedInfo,
        clearSavedInfo,
        updateLocalUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
