"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "../css/ChangePassword.css"

const ChangePassword = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [formErrors, setFormErrors] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  })

  const validateForm = () => {
    let isValid = true
    const errors = {
      old_password: "",
      new_password: "",
      confirm_password: "",
    }

    // Validate current password
    if (!formData.old_password) {
      errors.old_password = "Current password is required"
      isValid = false
    }

    // Validate new password
    if (!formData.new_password) {
      errors.new_password = "New password is required"
      isValid = false
    } else if (formData.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters long"
      isValid = false
    }

    // Validate confirm password
    if (!formData.confirm_password) {
      errors.confirm_password = "Please confirm your new password"
      isValid = false
    } else if (formData.new_password !== formData.confirm_password) {
      errors.confirm_password = "Passwords do not match"
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Reset states
    setError(null)
    setSuccess(false)

    // Validate form
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        navigate("/login")
        return
      }

      // Prepare the request payload with the correct field names
      const requestData = {
        old_password: formData.old_password,
        new_password: formData.new_password,
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/change-password/`, {

        method: "PUT", // Changed from POST to PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to change password")
      }

      // Clear form
      setFormData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      })

      setSuccess(true)
      setShowModal(true)
    } catch (err) {
      setError(err.message)
      console.error("Error changing password:", err)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    if (success) {
      // Redirect to settings page after successful password change
      navigate("/settings")
    }
  }

  return (
    <div className="change-password-container">
      <h1>Change Password</h1>
      <div className="password-form-container">
        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="old_password">Current Password</label>
            <input
              type="password"
              id="old_password"
              name="old_password"
              value={formData.old_password}
              onChange={handleChange}
              className={formErrors.old_password ? "error" : ""}
            />
            {formErrors.old_password && <div className="error-message">{formErrors.old_password}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="new_password">New Password</label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={formData.new_password}
              onChange={handleChange}
              className={formErrors.new_password ? "error" : ""}
            />
            {formErrors.new_password && <div className="error-message">{formErrors.new_password}</div>}
            <div className="password-requirements">
              <p>Password must:</p>
              <ul>
                <li className={formData.new_password.length >= 8 ? "met" : ""}>Be at least 8 characters long</li>
                <li className={/[A-Z]/.test(formData.new_password) ? "met" : ""}>
                  Include at least one uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.new_password) ? "met" : ""}>Include at least one number</li>
                <li className={/[^A-Za-z0-9]/.test(formData.new_password) ? "met" : ""}>
                  Include at least one special character
                </li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm New Password</label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              className={formErrors.confirm_password ? "error" : ""}
            />
            {formErrors.confirm_password && <div className="error-message">{formErrors.confirm_password}</div>}
          </div>

          {error && <div className="error-alert">{error}</div>}

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Changing Password..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === "modal-overlay") closeModal()
          }}
        >
          <div className="success-modal">
            <div className="modal-header">
              <div className="modal-icon-container">
                <div className="modal-icon-circle">
                  <div className="modal-icon">✓</div>
                </div>
              </div>
              <button className="modal-close-x" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-content">
              <h2>Password Changed</h2>
              <p>Your password has been successfully updated.</p>
              <p className="security-note">
                For security reasons, you may need to log in again with your new password on your next visit.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-close-btn" onClick={closeModal}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChangePassword

