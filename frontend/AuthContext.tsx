import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User, BusinessContext } from './types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  businessContext: BusinessContext | null;
  loading: boolean;
  refreshContext: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  businessContext: null,
  loading: true,
  refreshContext: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [businessContext, setBusinessContext] = useState<BusinessContext | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as User);
      }
      
      const contextDoc = await getDoc(doc(db, 'business_context', uid));
      if (contextDoc.exists()) {
        setBusinessContext(contextDoc.data() as BusinessContext);
      } else {
        setBusinessContext(null);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshContext = async () => {
    if (currentUser) {
      await fetchUserData(currentUser.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
        setBusinessContext(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, businessContext, loading, refreshContext }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
