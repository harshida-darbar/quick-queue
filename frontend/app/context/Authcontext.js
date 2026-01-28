// quick-queue/frontend/app/context/Authcontext.js

"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

export { AuthContext };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Load from localStorage on app start
  useEffect(() => {
    const storedData = localStorage.getItem("quick-queue");
    if (storedData) {
      const parsed = JSON.parse(storedData);
      if (parsed.user) setUser(parsed.user);
    }
  }, []);

  // LOGIN
  const login = (data) => {
    localStorage.setItem(
      "quick-queue",
      JSON.stringify({
        user: data.user,
        token: data.token,
      })
    );

    setUser(data.user);

    const roleId = data.user.role;

    if (roleId === 1) {
      router.replace("/admin/dashboard");
    } else if (roleId === 2) {
      router.replace("/organizer/dashboard");
    } else if (roleId === 3) {
      router.replace("/user/dashboard");
    }

    console.log("Login role:", data.user.role);
  };

  // LOGOUT
  const logout = () => {
    // Remove the entire quick-queue object
    localStorage.removeItem("quick-queue");
    setUser(null);
    router.replace("/login"); // replace so back button doesn't go back
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
