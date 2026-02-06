// quick-queue/frontend/app/login/page.js

"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import React, { useState } from "react";
import api from "../utils/api";
import { toast } from "react-toastify";
import { useAuth } from "../context/Authcontext";
import { IoEye, IoEyeOff } from "react-icons/io5";
import Link from "next/link";
import PublicRoute from "../components/PublicRoute";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      email: Yup.string()

        .email("Invalid email")
        .required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .matches(/[^a-zA-Z0-9]/, "Must include a special character")
        .required("Password is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);

        const res = await api.post("/auth/login", values);
        login(res.data);
        toast.success("Login Successful");
        resetForm();
      } catch (error) {
        toast.error(error.response?.data?.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-[#c4b0dc] dark:bg-gradient-to-br dark:from-[#2D1B69] dark:to-[#4C1D95] p-4">
        <form
          onSubmit={formik.handleSubmit}
          className="w-full max-w-md bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-8"
        >
          <h1 className="text-3xl font-bold text-center text-[#7132CA] dark:text-purple-200 mb-6">
            Welcome Back
          </h1>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD] dark:text-purple-300">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] dark:border-gray-600 px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none bg-white dark:bg-slate-700 dark:text-white"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
            )}
          </div>

          <div className="mb-6 relative">
            <label className="text-sm font-semibold text-[#725CAD] dark:text-purple-300">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] dark:border-gray-600 px-3 pr-10 focus:ring-2 focus:ring-[#8C00FF] outline-none bg-white dark:bg-slate-700 dark:text-white"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 cursor-pointer text-[#7132CA] dark:text-purple-300"
            >
              {showPassword ? <IoEye size={20} /> : <IoEyeOff size={20} />}
            </span>
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {formik.errors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-11 rounded-xl outline-none 
    bg-gradient-to-r from-[#7132CA] to-[#8C00FF] 
    text-white cursor-pointer font-semibold tracking-wide 
    flex items-center justify-center gap-2
    ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}
  `}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

          <p className="text-center text-sm text-[#725CAD] dark:text-purple-300 mt-5">
            New User?{" "}
            <Link
              href="/signup"
              className="text-[#8C00FF] dark:text-purple-400 font-semibold hover:underline outline-none"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </PublicRoute>
  );
}

export default LoginPage;
