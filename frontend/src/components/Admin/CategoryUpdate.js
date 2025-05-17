"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import { CloudUpload, Save, ArrowBack, Info } from "@mui/icons-material"
import "../../css/CategoryUpdate.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/v1"

const CategoryUpdate = ({ updateCategoryInList, updateQuotationInList }) => {
  // Category state
  const [category, setCategory] = useState({
    name: "",
    description: "",
    type: "service",
    icon: null,
  })
  const [previewImage, setPreviewImage] = useState(null)

  // Quotation state
  const [quotation, setQuotation] = useState({
    id: 0,
    category: 0,
    user_fee: "0.00",
    constructor_fee: "0.00",
    user_refund: "0.00",
    constructor_refund: "0.00",
  })

  // Shared state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState("category") // "category" or "quotation"

  const { id } = useParams()
  const navigate = useNavigate()

  // Fetch category data
  useEffect(() => {
    if (id && activeTab === "category") {
      setLoading(true)
      axios
        .get(`${API_BASE_URL}/category/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        .then((response) => {
          setCategory(response.data)

          if (response.data.icon) {
            const cleanIconPath = response.data.icon.replace(/^\/?media\//, "media/")
            setPreviewImage(`${API_BASE_URL.replace("/api/v1", "")}/${cleanIconPath}?t=${new Date().getTime()}`)
          }
        })
        .catch((error) => {
          console.error("Error fetching category:", error)
          setError("Failed to load category. Please try again.")
        })
        .finally(() => setLoading(false))
    }
  }, [id, activeTab])

  // Fetch quotation data
  useEffect(() => {
    if (id && activeTab === "quotation") {
      setLoading(true)
      axios
        .get(`${API_BASE_URL}/orders/our-quotation/${id}/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        })
        .then((response) => {
          setQuotation(response.data)
        })
        .catch((error) => {
          console.error("Error fetching quotation:", error)
          setError("Failed to load quotation. Please try again.")
        })
        .finally(() => setLoading(false))
    }
  }, [id, activeTab])

  // Category handlers
  const handleCategoryChange = (e) => {
    setCategory({ ...category, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCategory({ ...category, icon: file })
      setPreviewImage(URL.createObjectURL(file))
    }
  }

  const handleCategorySubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const token = localStorage.getItem("accessToken")

    const formData = new FormData()
    formData.append("name", category.name)
    formData.append("description", category.description)
    formData.append("type", category.type)
    if (category.icon instanceof File) {
      formData.append("icon", category.icon)
    }

    axios
      .put(`${API_BASE_URL}/category/${id}/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        setSuccess(true)
        updateCategoryInList(response.data)

        if (response.data.icon) {
          const cleanIconPath = response.data.icon.replace(/^\/?media\//, "media/")
          setPreviewImage(`${API_BASE_URL.replace("/api/v1", "")}/${cleanIconPath}?t=${new Date().getTime()}`)
        }

        setTimeout(() => {
          setSuccess(false)
          navigate("/admin/categories")
        }, 2000)
      })
      .catch((error) => {
        console.error("Error updating category:", error)
        setError("Failed to update category. Please check your input.")
      })
      .finally(() => setLoading(false))
  }

  // Quotation handlers
  const handleQuotationChange = (e) => {
    setQuotation({ ...quotation, [e.target.name]: e.target.value })
  }

  const handleQuotationSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const token = localStorage.getItem("accessToken")

    axios
      .put(`${API_BASE_URL}/orders/our-quotation/${id}/`, quotation, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setSuccess(true)
        if (updateQuotationInList) {
          updateQuotationInList(response.data)
        }

        setTimeout(() => {
          setSuccess(false)
          navigate("/admin/categories")
        }, 2000)
      })
      .catch((error) => {
        console.error("Error updating quotation:", error)
        setError("Failed to update quotation. Please check your input.")
      })
      .finally(() => setLoading(false))
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
    exit: { opacity: 0, y: 20 },
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

  const tabVariants = {
    active: {
      borderBottom: "3px solid #007bff",
      color: "#007bff",
      fontWeight: "bold",
    },
    inactive: {
      borderBottom: "3px solid transparent",
      color: "#555",
      fontWeight: "normal",
    },
  }

  return (
    <motion.div
      className="update-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="update-card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <motion.div
          className="card-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="h2-category-update">{activeTab === "category" ? "Update Category" : "Update Quotation"}</h2>
        </motion.div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <motion.div
            className="tab"
            animate={activeTab === "category" ? "active" : "inactive"}
            variants={tabVariants}
            onClick={() => {
              setActiveTab("category")
              setError("")
              setSuccess(false)
            }}
          >
            Category
          </motion.div>
          <motion.div
            className="tab"
            animate={activeTab === "quotation" ? "active" : "inactive"}
            variants={tabVariants}
            onClick={() => {
              setActiveTab("quotation")
              setError("")
              setSuccess(false)
            }}
          >
            Quotation
          </motion.div>
        </div>

        <AnimatePresence>
          {loading ? (
            <motion.div
              className="loading-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loader"></div>
              <p>Loading {activeTab} data...</p>
            </motion.div>
          ) : activeTab === "category" ? (
            <motion.form
              onSubmit={handleCategorySubmit}
              encType="multipart/form-data"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Info className="message-icon" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Info className="message-icon" />
                    Category updated successfully! Redirecting...
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="id" className="label-category-update">
                  ID (read-only):
                </label>
                <input type="text" id="id" value={id} readOnly className="input-category-update readonly-input" />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="name" className="label-category-update">
                  Name:
                </label>
                <input
                  className="input-category-update"
                  type="text"
                  id="name"
                  name="name"
                  value={category.name}
                  onChange={handleCategoryChange}
                  required
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="description" className="label-category-update">
                  Description:
                </label>
                <textarea
                  className="textarea-category-update"
                  id="description"
                  name="description"
                  value={category.description}
                  onChange={handleCategoryChange}
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="type" className="label-category-update">
                  Type:
                </label>
                <select
                  className="select-category-update"
                  id="type"
                  name="type"
                  value={category.type}
                  onChange={handleCategoryChange}
                  required
                >
                  <option value="service">Service</option>
                  <option value="material">Material</option>
                </select>
              </motion.div>

              <motion.div className="form-group-category-update icon-preview-group" variants={itemVariants}>
                <label className="label-category-update">Current Icon:</label>
                <div className="icon-preview-container">
                  {previewImage ? (
                    <motion.div
                      className="preview-wrapper"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <img src={previewImage || "/placeholder.svg"} alt="Preview" className="category-preview" />
                    </motion.div>
                  ) : (
                    <div className="no-preview">
                      <p>No icon available</p>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div className="form-group-category-update upload-group" variants={itemVariants}>
                <label htmlFor="icon" className="label-category-update">
                  Upload New Icon:
                </label>
                <div className="file-input-container">
                  <motion.label
                    htmlFor="icon"
                    className="custom-file-upload"
                    whileHover={{ scale: 1.02, backgroundColor: "#f0f7ff" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <CloudUpload className="upload-icon" />
                    <span>Choose File</span>
                  </motion.label>
                  <input type="file" id="icon" accept="image/*" onChange={handleFileChange} className="file-input" />
                  <span className="file-name">
                    {category.icon instanceof File ? category.icon.name : "No file chosen"}
                  </span>
                </div>
              </motion.div>

              <div className="button-container">
                <motion.button
                  type="submit"
                  className="update-button-form"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, backgroundColor: "#0056b3" }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading || success}
                >
                  <Save className="button-icon" />
                  {loading ? "Updating..." : "Update Category"}
                </motion.button>

                <motion.button
                  type="button"
                  className="back-button-update-category"
                  onClick={() => navigate("/admin/categories")}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowBack className="button-icon" />
                  Back to Categories
                </motion.button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              onSubmit={handleQuotationSubmit}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AnimatePresence>
                {error && (
                  <motion.div
                    className="error-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Info className="message-icon" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    className="success-message"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Info className="message-icon" />
                    Quotation updated successfully! Redirecting...
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="quotation-id" className="label-category-update">
                  ID (read-only):
                </label>
                <input
                  type="text"
                  id="quotation-id"
                  value={quotation.id || id}
                  readOnly
                  className="input-category-update readonly-input"
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="quotation-category" className="label-category-update">
                  Category (read-only):
                </label>
                <input
                  type="text"
                  id="quotation-category"
                  value={quotation.category}
                  readOnly
                  className="input-category-update readonly-input"
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="user_fee" className="label-category-update">
                  User Fee:
                </label>
                <input
                  className="input-category-update"
                  type="number"
                  step="0.01"
                  id="user_fee"
                  name="user_fee"
                  value={quotation.user_fee}
                  onChange={handleQuotationChange}
                  required
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="constructor_fee" className="label-category-update">
                  Constructor Fee:
                </label>
                <input
                  className="input-category-update"
                  type="number"
                  step="0.01"
                  id="constructor_fee"
                  name="constructor_fee"
                  value={quotation.constructor_fee}
                  onChange={handleQuotationChange}
                  required
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="user_refund" className="label-category-update">
                  User Refund:
                </label>
                <input
                  className="input-category-update"
                  type="number"
                  step="0.01"
                  id="user_refund"
                  name="user_refund"
                  value={quotation.user_refund}
                  onChange={handleQuotationChange}
                  required
                />
              </motion.div>

              <motion.div className="form-group-category-update" variants={itemVariants}>
                <label htmlFor="constructor_refund" className="label-category-update">
                  Constructor Refund:
                </label>
                <input
                  className="input-category-update"
                  type="number"
                  step="0.01"
                  id="constructor_refund"
                  name="constructor_refund"
                  value={quotation.constructor_refund}
                  onChange={handleQuotationChange}
                  required
                />
              </motion.div>

              <div className="button-container">
                <motion.button
                  type="submit"
                  className="update-button-form"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, backgroundColor: "#0056b3" }}
                  whileTap={{ scale: 0.95 }}
                  disabled={loading || success}
                >
                  <Save className="button-icon" />
                  {loading ? "Updating..." : "Update Quotation"}
                </motion.button>

                <motion.button
                  type="button"
                  className="back-button-update-category"
                  onClick={() => navigate("/admin/categories")}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ArrowBack className="button-icon" />
                  Back to Quotations
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default CategoryUpdate

