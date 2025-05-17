import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Button,
  TextField,
  Typography,
  CardContent,
  Alert,
  Stack,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import "../css/login.css"; // 📌 Import file CSS

const Login = ({ setIsAuthenticated, setUserRole, setUsername }) => {
  const [localUsername, setLocalUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const navigate = useNavigate();
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, {
        username: localUsername,
        password,
      });

      const { access, role } = response.data;

      // ✅ Lưu thông tin đăng nhập vào localStorage
      localStorage.setItem("accessToken", access);
      localStorage.setItem("role", role);
      localStorage.setItem("username", localUsername);

      // ✅ Cập nhật state
      setIsAuthenticated(true);
      setUserRole(role);
      setUsername(localUsername);

      // ✅ Điều hướng dựa trên role
      if (role === "customer") navigate("/customer");
      else if (role === "constructor") navigate("/constructor");
      else if (role === "admin") navigate("/admin");
      else if (role === "operator") navigate("/operator");

    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    setResetError("");
    setResetSuccess("");
    try {
      const response = await axios.post(`${API_BASE_URL}/user/reset-password/`, { email });
      setResetSuccess("Password reset link has been sent to your email.");
      setEmail("");
    } catch (err) {
      setResetError(err.response?.data?.error || "Failed to reset password. Please try again.");
    }
  };

  return (
    <Box className="login-container">
        <CardContent>
          <Typography variant="h4" className="login-title">Login</Typography>
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                className="text-field"
                label="Username"
                variant="outlined"
                fullWidth
                value={localUsername}
                onChange={(e) => setLocalUsername(e.target.value)}
                required
              />
              <TextField
                className="text-field"
                label="Password"
                type="password"
                variant="outlined"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <Alert severity="error" className="error-message-login">{error}</Alert>}
              <Button type="submit" variant="contained" className="login-button">
                LOGIN
              </Button>
            </Stack>
          </form>
          <Typography variant="body2" className="redirect-text">
            Need an account?{" "}
            <Link to="/signup" className="redirect-link">
              Sign up
            </Link>
          </Typography>
          <Typography variant="body2" className="redirect-text">
            Forgot your password?{" "}
            <Button
              onClick={() => setOpenResetDialog(true)}
              className="forgot-password-link"
            >
              Reset it
            </Button>
          </Typography>
        </CardContent>

      {/* Reset Password Dialog */}
      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Enter your email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {resetError && <Alert severity="error">{resetError}</Alert>}
          {resetSuccess && <Alert severity="success">{resetSuccess}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleResetPassword} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
