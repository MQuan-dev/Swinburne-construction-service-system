import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { TextField, Button, Box, MenuItem, Typography, Alert} from "@mui/material";

import "../css/register.css"; // 📌 Import file CSS

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
    company_name: "",
    tax_code: "",
    role: "CUSTOMER",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      const endpoint =
        formData.role === "CUSTOMER"
          ? `${process.env.REACT_APP_API_BASE_URL}/user/register-customer`
          : `${process.env.REACT_APP_API_BASE_URL}/user/register-constructor`;

      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      if (formData.role === "CONSTRUCTOR") {
        payload.phone_number = formData.phone_number;
        payload.company_name = formData.company_name;
        payload.tax_code = formData.tax_code;
      }

      const response = await axios.post(endpoint, payload);
      setSuccessMessage(response.data.message); // Hiển thị thông báo từ views.py
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    }
  };

  return (
    <Box className="register-container">

      <Typography variant="h4" align="center" gutterBottom>Sign Up</Typography>


      <form onSubmit={handleSubmit} className="register-form">
        {/* Username */}
        <TextField
          className="text-field-register"
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        {/* Email */}
        <TextField
          className="text-field-register"
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        {/* Password */}
        <TextField
          className="text-field-register"
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Role selection */}
        <TextField
          select
          className="text-field-register"
          label="Role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <MenuItem value="CUSTOMER">Customer</MenuItem>
          <MenuItem value="CONSTRUCTOR">Constructor</MenuItem>
        </TextField>

        {/* Các trường chỉ dành cho Constructor */}
        {formData.role === "CONSTRUCTOR" && (
          <>
            <TextField
              className="text-field-register"
              label="Phone Number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              required
            />

            <TextField
              className="text-field-register"
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              required
            />

            <TextField
              className="text-field-register"
              label="Tax Code"
              name="tax_code"
              value={formData.tax_code}
              onChange={handleChange}
              required
            />
          </>
        )}

        {error && <Alert severity="error" className="error-message">{error}</Alert>}
        {successMessage && <Alert severity="success" className="success-message">{successMessage}</Alert>}

        {/* Submit Button */}
        <Button type="submit" variant="contained" color="primary" className="register-button">
          SIGN UP
        </Button>
        
      </form>

      {/* Chuyển hướng đến đăng nhập */}
      <Typography variant="body2" className="redirect-text">
        Already have an account? <Link to="/login" className="redirect-link">Login</Link>
      </Typography>

    </Box>
  );
};

export default Register;
