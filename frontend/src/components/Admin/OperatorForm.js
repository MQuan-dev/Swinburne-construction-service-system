"use client"

import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import {
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from "@mui/material"
import { Person, Email, Lock, Visibility, VisibilityOff, PersonAdd, ArrowBack, Error } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import "../../css/OperatorForm.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

// Wrap Material UI components with motion
const MotionCard = motion(Card)
const MotionTypography = motion(Typography)

const OperatorForm = () => {
  const [formData, setFormData] = useState({ username: "", email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    axios
      .post(`${API_BASE_URL}/user/register-operator`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then(() => navigate("/admin/operators"))
      .catch((error) => {
        console.error("Error creating operator:", error)
        setError("Failed to create operator. Please check your input and try again.")
      })
      .finally(() => setLoading(false))
  }

  const toggleShowPassword = () => {
    setShowPassword(!showPassword)
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  }

  return (
    <motion.div
      className="operator-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionCard
        className="operator-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <CardContent className="card-content-form">
          <div className="form-header">
            <MotionTypography
              variant="h4"
              className="operator-form-title"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <PersonAdd className="title-icon" />
              Create Operator
            </MotionTypography>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                className="error-container"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="error" className="operator-error" icon={<Error className="error-icon" />}>
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.form
            onSubmit={handleSubmit}
            className="operator-form"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <TextField
                label="Username"
                name="username"
                variant="outlined"
                fullWidth
                required
                className="operator-form-input"
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person className="input-icon" />
                      </InputAdornment>
                    ),
                  },
                }}
                placeholder="Enter operator username"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <TextField
                label="Email"
                name="email"
                type="email"
                variant="outlined"
                fullWidth
                required
                className="operator-form-input"
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email className="input-icon" />
                      </InputAdornment>
                    ),
                  },
                }}
                placeholder="Enter operator email"
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                required
                className="operator-form-input"
                onChange={handleChange}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock className="input-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={toggleShowPassword}
                          edge="end"
                          className="password-toggle"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                placeholder="Enter secure password"
              />
            </motion.div>

            <div className="button-container">
              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  className="operator-submit-btn"
                  disabled={loading}
                  startIcon={loading ? null : <PersonAdd />}
                >
                  {loading ? <CircularProgress size={24} className="loading-spinner" /> : "Create Operator"}
                </Button>
              </motion.div>

              <motion.div variants={itemVariants}>
                <Button
                  variant="outlined"
                  fullWidth
                  className="operator-back-btn"
                  onClick={() => navigate("/admin/operators")}
                  startIcon={<ArrowBack />}
                >
                  Back to Operators
                </Button>
              </motion.div>
            </div>
          </motion.form>
        </CardContent>
      </MotionCard>
    </motion.div>
  )
}

export default OperatorForm

