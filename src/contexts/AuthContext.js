import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, database } from '../firebase';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const employeesRef = ref(database, 'employees');
          const snapshot = await get(employeesRef);
          const data = snapshot.val();

          if (data) {
            const employeeId = Object.keys(data).find(key => data[key].email === user.email);
            
            if (employeeId) {
              const employeeData = data[employeeId];
              setCurrentUser({
                ...user,
                ...employeeData,
                id: employeeId
              });
            } else {
              setCurrentUser({
                ...user,
                fullName: 'Гость'
              });
            }
          } else {
            setCurrentUser({
              ...user,
              fullName: 'Гость'
            });
          }
        } catch (error) {
          setCurrentUser({
            ...user,
            fullName: 'Гость'
          });
        }
      } else {
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 