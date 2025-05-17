
import { useState, useRef } from "react"
import axios from "axios"
import "../../css/HomeCustomer.css"
import { motion, AnimatePresence } from "framer-motion"

const CreateOrder = ({ categories, fetchOrders }) => {
  const [formData, setFormData] = useState({
    category_id: "",
    title: "",
    description: "",
    order_files: null,
  })
  const [errors, setErrors] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMessage, setModalMessage] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileName, setFileName] = useState("")
  const fileInputRef = useRef(null)

  const validateForm = () => {
    const newErrors = {}
    if (!formData.category_id) newErrors.category_id = "Please select a category."
    if (!formData.title.trim()) newErrors.title = "Title is required."
    if (!formData.description.trim()) newErrors.description = "Description is required."
    if (!formData.order_files) newErrors.order_files = "Please upload a file."
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (event) => {
    const { name, value } = event.target
    setFormData({ ...formData, [name]: value })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null })
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      setFormData({ ...formData, order_files: file })
      setFileName(file.name)
      if (errors.order_files) {
        setErrors({ ...errors, order_files: null })
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleOpenModal = (event) => {
    event.preventDefault()
    if (validateForm()) {
      setModalMessage("Confirm submission will minus your coins based on category?")
      setIsModalOpen(true)
    }
  }

  const showPopupWithEffect = () => {
    setShowPopup(true)
    setTimeout(() => {
      setShowPopup(false)
    }, 3000)
  }

  const handleConfirm = async () => {
    setIsModalOpen(false)
    setIsSubmitting(true)

    const token = localStorage.getItem("accessToken")
    const API_URL = `${process.env.REACT_APP_API_BASE_URL}/orders/create-order/`
    const formDataToSend = new FormData()
    formDataToSend.append("category_id", formData.category_id)
    formDataToSend.append("title", formData.title)
    formDataToSend.append("description", formData.description)
    if (formData.order_files) {
      formDataToSend.append("order_files", formData.order_files)
    }

    try {
      await axios.post(API_URL, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      })
      setIsSubmitting(false)
      showPopupWithEffect()
      setFormData({ category_id: "", title: "", description: "", order_files: null })
      setFileName("")
      fetchOrders()
    } catch (error) {
      setIsSubmitting(false)
      alert("Error creating order: " + (error.response?.data?.message || "Failed to connect to the API."))
    }
  }

  return (
    <motion.section
      className="create-order-form"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="popup success-popup"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="popup-icon">✓</div>
            <div className="popup-message">Order created successfully!</div>
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="form-title">Create New Order</h2>

      <form className="animated-form">
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <div className={`input-container ${errors.category_id ? "error-input" : ""}`}>
            <select
              id="category"
              name="category_id"
              value={formData.category_id || ""}
              onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}
              className={errors.category_id ? "error-border" : ""}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <span className="focus-border"></span>
          </div>
          {errors.category_id && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.category_id}
            </motion.p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="title">Title</label>
          <div className={`input-container ${errors.title ? "error-input" : ""}`}>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? "error-border" : ""}
            />
            <span className="focus-border"></span>
          </div>
          {errors.title && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.title}
            </motion.p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <div className={`input-container ${errors.description ? "error-input" : ""}`}>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? "error-border" : ""}
            />
            <span className="focus-border"></span>
          </div>
          {errors.description && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.description}
            </motion.p>
          )}
        </div>

        <div className="form-group">
          <label>Order File</label>
          <div className={`file-upload-container ${errors.order_files ? "error-input" : ""}`}>
            <input
              type="file"
              id="order_files"
              name="order_files"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="file-input"
            />
            <button type="button" className="file-upload-btn" onClick={triggerFileInput}>
              Choose File
            </button>
            <span className="file-name">{fileName || "No file chosen"}</span>
          </div>
          {errors.order_files && (
            <motion.p
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {errors.order_files}
            </motion.p>
          )}
        </div>

        <motion.button
          onClick={handleOpenModal}
          className="submit-btn"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Submitting...</span>
            </div>
          ) : (
            "Submit Order"
          )}
        </motion.button>
      </form>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="modal-header">
                <h3>Confirm Order</h3>
              </div>
              <div className="modal-body">
                <p>{modalMessage}</p>
              </div>
              <div className="modal-buttons">
                <motion.button
                  onClick={handleConfirm}
                  className="confirm-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Confirm
                </motion.button>
                <motion.button
                  onClick={() => setIsModalOpen(false)}
                  className="cancel-btn"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  )
}

export default CreateOrder

