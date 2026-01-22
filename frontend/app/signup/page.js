"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import React from "react";
import api from "../utils/api";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function SignupPage() {
    const router = useRouter();

  const formik = useFormik({
    initialValues: {
      role: "",
      name: "",
      email: "",
      password: "",
    },

    validationSchema: Yup.object({
      role: Yup.string().required("Role is required"),
      name: Yup.string().trim().required("Name is required"),
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
        console.log("Form Submit", values);
        await api.post("/auth/signup",values);
        toast.success("Registered Successfull.");
        resetForm();
        router.push('/login');
      } catch (error) {
        toast.error(error);
      }
    },
  });

  return (
    <div className="bg-white p-6">
      <form onSubmit={formik.handleSubmit}>
        <div className="max-w-xl mx-auto bg-gray-50 p-10 rounded">
          <h1 className="text-center text-2xl font-bold text-emerald-700">
            Create User
          </h1>

          <div className="mt-4">
            <label className="text-emerald-700 font-semibold">Role</label>
            <select
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-10 border border-emerald-500 outline-none p-2"
            >
              <option value="">Select Role</option>
              <option value="user">User</option>
              <option value="organizer">Organizer</option>
            </select>
            {formik.touched.role && formik.errors.role && (
              <p className="text-red-500 text-sm">{formik.errors.role}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-emerald-700 font-semibold">Name</label>
            <input
              type="text"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-10 border border-emerald-500 outline-none p-2"
            />
            {formik.touched.name && formik.errors.name && (
              <p className="text-red-500 text-sm">{formik.errors.name}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-emerald-700 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-10 border border-emerald-500 outline-none p-2"
            />
            {formik.touched.email && formik.errors.email && (
              <p className="text-red-500 text-sm">{formik.errors.email}</p>
            )}
          </div>

          <div className="mt-4">
            <label className="text-emerald-700 font-semibold">Password</label>
            <input
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="w-full h-10 border border-emerald-500 outline-none p-2"
            />
            {formik.touched.password && formik.errors.password && (
              <p className="text-red-500 text-sm">{formik.errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full h-10 bg-emerald-700 text-white font-semibold mt-6 rounded"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}

export default SignupPage;
