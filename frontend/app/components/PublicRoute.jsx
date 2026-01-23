"use client";
import { useAuth } from "../context/Authcontext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicRoute({ children }) {
  const { user: contextUser } = useAuth(); // from context
  const router = useRouter();
  const [user, setUser] = useState(contextUser);

  // Check localStorage if context is not yet initialized
  useEffect(() => {
    if (!contextUser) {
      const stored = localStorage.getItem("quick-queue");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) setUser(parsed.user);
      }
    }
  }, [contextUser]);

  // Redirect if logged in
  useEffect(() => {
    if (!user) return; // not logged in, allow access

    if (user.role === 1) router.replace("/admin/dashboard");
    else if (user.role === 2) router.replace("/organizer/dashboard");
    else if (user.role === 3) router.replace("/user/dashboard");
  }, [user]);

  // Prevent rendering login/signup if user is logged in
  if (user) return null;

  return children;
}
