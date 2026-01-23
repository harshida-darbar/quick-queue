// quick-queue/frontend/app/components/protectedroute.jsx
"use client";
import { useAuth } from "../context/Authcontext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user: contextUser } = useAuth(); // user from context
  const router = useRouter();
  const [user, setUser] = useState(contextUser);

  useEffect(() => {
    // Try getting user from localStorage if context is not ready
    if (!contextUser) {
      const stored = localStorage.getItem("quick-queue");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) setUser(parsed.user);
      }
    }
  }, [contextUser]);

  useEffect(() => {
    if (!user) {
      router.replace("/login"); // not logged in
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/login"); // role not allowed
    }
  }, [user]);

  if (!user) return null; 

  return children;
}
