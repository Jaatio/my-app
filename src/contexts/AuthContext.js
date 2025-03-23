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
              const userData = {
                ...user,
                ...employeeData,
                id: employeeId
              };
              
              setCurrentUser(userData);

              // Сохраняем данные сессии
              sessionStorage.setItem('userSession', JSON.stringify({
                email: user.email,
                role: employeeData.role,
                fullName: employeeData.fullName
              }));
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
        // Проверяем наличие сохраненной сессии
        const savedSession = sessionStorage.getItem('userSession');
        if (savedSession) {
          // Если есть сохраненная сессия, но нет пользователя, очищаем сессию
          sessionStorage.removeItem('userSession');
        }
        setCurrentUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    loading,
    getTargetPage: (role) => {
      switch (role) {
        case 'admin':
          return '/admin';
        case 'manager':
          return '/manager';
        case 'warehouse':
          return '/warehouse';
        case 'auditor':
          return '/auditor';
        default:
          return '/login';
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 