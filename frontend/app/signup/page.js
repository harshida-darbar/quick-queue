// quick-queue/frontend/app/signup/page.js

"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import React, { useState } from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { IoEye, IoEyeOff } from "react-icons/io5";
import Link from "next/link";
import PublicRoute from "../components/PublicRoute";

function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      role: "",
      name: "",
      email: "",
      password: "",
      phone: "",
      city: "",
    },

    validationSchema: Yup.object({
      role: Yup.string().required("Role is required"),
      name: Yup.string().trim().required("Name is required"),
      email: Yup.string().email("Invalid email").required("Email is required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .matches(/[^a-zA-Z0-9]/, "Must include a special character")
        .required("Password is required"),
      phone: Yup.string()
        .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
        .required("Phone number is required"),
      city: Yup.string().trim().required("City is required"),
    }),

    onSubmit: async (values, { resetForm }) => {
      try {
        setLoading(true);
        const payload = {
          ...values,
          role: Number(values.role),
        };

        console.log("Form Submit", payload);

        await api.post("/auth/signup", payload);
        toast.success("Registered Successfully");
        resetForm();
        router.push("/login");
      } catch (error) {
        toast.error(error.response?.data?.message || "Signup failed");
      } finally {
        setLoading(false);
      }
    },
  });
  return (
    <PublicRoute>
      <div className="min-h-screen flex items-center justify-center bg-[#c4b0dc]  p-4">
        <form
          onSubmit={formik.handleSubmit}
          className="w-full max-w-lg bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl p-8"
        >
          <h1 className="text-3xl font-bold text-center text-[#7132CA] mb-6">
            Create Account
          </h1>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD]">Role</label>
            <select
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            >
              <option value="">Select Role</option>
              <option value="3">User</option>
              <option value="2">Organizer</option>
            </select>
            {formik.touched.role && formik.errors.role && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.role}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD]">Name</label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD]">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD]">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formik.values.phone}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              placeholder="1234567890"
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            />
            {formik.touched.phone && formik.errors.phone && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.phone}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="text-sm font-semibold text-[#725CAD]">
              City
            </label>
            <input
              type="text"
              name="city"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            />
            {formik.touched.city && formik.errors.city && (
              <p className="text-red-500 text-sm mt-1">{formik.errors.city}</p>
            )}
          </div>

          <div className="mb-6 relative">
            <label className="text-sm font-semibold text-[#725CAD]">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-11 mt-1 rounded-lg border border-[#BB8ED0] px-3 pr-10 focus:ring-2 focus:ring-[#8C00FF] outline-none"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-10 cursor-pointer text-[#7132CA]"
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
            className={`w-full h-11 rounded-xl bg-gradient-to-r from-[#7132CA] to-[#8C00FF]  cursor-pointer
            text-white font-semibold flex items-center justify-center gap-2
            ${loading ? "opacity-70 cursor-not-allowed" : "hover:opacity-90"}`}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating...
              </>
            ) : (
              "Sign Up"
            )}
          </button>

          <p className="text-center text-sm text-[#725CAD] mt-5">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#8C00FF] font-semibold hover:underline outline-none"
            >
              Login
            </Link>
          </p>
        </form>
      </div>
    </PublicRoute>
  );
}

export default SignupPage;
