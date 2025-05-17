"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import {
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Paper,
} from "@mui/material"
import { motion } from "framer-motion"
import { CloudUpload, Save, ArrowBack } from "@mui/icons-material"
import "../../css/CategoryForm.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL

// Wrap Material UI components with motion
const MotionPaper = motion(Paper)
const MotionBox = motion(Box)
const MotionTypography = motion(Typography)
const MotionButton = motion(Button)

const CategoryForm = () => {
  const [category, setCategory] = useState({
    name: "",
    description: "",
    category: "service",
    icon: null,
  })

  const [previewImage, setPreviewImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { id } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (id) {
      setLoading(true)
      axios
        .get(`${API_BASE_URL}/category/${id}/`)
        .then((response) => {
          setCategory({ ...response.data, category: response.data.category })
          if (response.data.icon) {
            setPreviewImage(
              `${API_BASE_URL.replace("/api/v1", "")}/${response.data.icon.replace(/^\/?media\//, "media/")}?t=${new Date().getTime()}`,
            )
          }
        })
        .catch(() => setError("Failed to load category."))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleChange = (e) => {
    setCategory({ ...category, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCategory({ ...category, icon: file })
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const token = localStorage.getItem("accessToken")
    if (!token) {
      setError("Unauthorized: Please log in.")
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.append("name", category.name)
    formData.append("description", category.description)
    formData.append("category", category.category)
    if (category.icon instanceof File) {
      formData.append("icon", category.icon)
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    }

    const request = id
      ? axios.put(`${API_BASE_URL}/category/${id}/`, formData, { headers })
      : axios.post(`${API_BASE_URL}/category/`, formData, { headers })

    request
      .then(() => {
        setSuccess(true)
        setTimeout(() => navigate("/admin/categories"), 1500)
      })
      .catch(() => setError("Failed to create/update category."))
      .finally(() => setLoading(false))
  }

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
    exit: { opacity: 0, y: -20 },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
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
    <MotionBox
      className="category-form-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionPaper className="category-form-paper">
        <MotionTypography
          variant="h4"
          className="category-title"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {id ? "Update Category" : "Create New Category"}
        </MotionTypography>

        {loading && (
          <MotionBox
            className="loading-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <CircularProgress className="loading-spinner" />
            <Typography className="loading-text">{id ? "Loading category data..." : "Creating category..."}</Typography>
          </MotionBox>
        )}

        {error && (
          <MotionBox
            className="error-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" className="error-alert">
              {error}
            </Alert>
          </MotionBox>
        )}

        {success && (
          <MotionBox
            className="success-container"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="success" className="success-alert">
              Category {id ? "updated" : "created"} successfully! Redirecting...
            </Alert>
          </MotionBox>
        )}

        {!loading && !success && (
          <motion.form
            onSubmit={handleSubmit}
            encType="multipart/form-data"
            className="category-form"
            variants={formVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div variants={itemVariants} className="name-section">
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={category.name}
                onChange={handleChange}
                required
                className="category-input"
                variant="outlined"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="description-section">
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={category.description}
                onChange={handleChange}
                multiline
                rows={3}
                className="category-input"
                variant="outlined"
              />
            </motion.div>

            <motion.div variants={itemVariants} className="type-section">
              <FormControl fullWidth  variant="outlined">
                <InputLabel id="category-label">Type</InputLabel>
                <Select
                  className="category-input"
                  labelId="category-label"
                  id="category-select"
                  name="category"
                  value={category.category}
                  onChange={handleChange}
                  required
                  label="Type"
                >
                  <MenuItem value="service">Service</MenuItem>
                  <MenuItem value="material">Material</MenuItem>
                </Select>
              </FormControl>
            </motion.div>

            <motion.div variants={itemVariants} className="upload-section">
              <Typography variant="subtitle1" className="upload-title">
                Category Icon
              </Typography>

              {previewImage && (
                <MotionBox
                  className="category-preview-container"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <img src={previewImage || "/placeholder.svg"} alt="Preview" className="category-icon-preview" />
                </MotionBox>
              )}

              <MotionButton
                variant="outlined"
                component="label"
                className="category-upload-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <CloudUpload className="upload-icon" />
                {previewImage ? "Change Icon" : "Upload Icon"}
                <input type="file" hidden name="icon" onChange={handleFileChange} accept="image/*" />
              </MotionButton>
            </motion.div>

            <motion.div variants={itemVariants} className="form-actions">
              <MotionButton
                type="button"
                variant="outlined"
                className="category-back-btn"
                onClick={() => navigate("/admin/categories")}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowBack className="button-icon" />
                Back
              </MotionButton>

              <MotionButton
                type="submit"
                variant="contained"
                color="primary"
                className="category-submit-btn"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Save className="button-icon" />
                {id ? "Update Category" : "Create Category"}
              </MotionButton>
            </motion.div>
          </motion.form>
        )}
      </MotionPaper>
    </MotionBox>
  )
}

export default CategoryForm

