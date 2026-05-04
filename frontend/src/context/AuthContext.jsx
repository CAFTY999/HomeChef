import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // 🔥 LOAD USER ON REFRESH
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 🔐 LOGIN
  const login = (data) => {
    const userData = {
      token: data.token,
      role: data.role,
      name: data.name,
      location: data.location,
      address: data.address,
      coordinates: data.coordinates
    };

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  // 🆙 UPDATE USER (for profile updates)
  const updateUser = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);