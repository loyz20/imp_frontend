import React from "react";
import { Routes, Route } from "react-router-dom";
import { Login } from "../pages/auth";
import GuestGuard from "../middlewares/GuestGuard";

export default function AuthRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestGuard><Login /></GuestGuard>} />
    </Routes>
  );
}
