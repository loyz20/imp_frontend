import React from "react";
import { Routes, Route } from "react-router-dom";
import { Login, Register, ForgotPassword } from "../pages/auth";
import GuestGuard from "../middlewares/GuestGuard";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
      <Route path="/register" element={<GuestGuard><Register /></GuestGuard>} />
      <Route path="/forgot-password" element={<GuestGuard><ForgotPassword /></GuestGuard>} />
    </Routes>
  );
}
