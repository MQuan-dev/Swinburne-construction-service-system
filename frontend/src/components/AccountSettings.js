"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import "../css/AccountSettings.css"

const AccountSettings = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    company_name: "",
    tax_code: "",
  })
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/profile/`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user profile")
        }

        const data = await response.json()
        setUserProfile(data.data)
        setFormData({
          username: data.data.username || "",
          first_name: data.data.first_name || "",
          last_name: data.data.last_name || "",
          email: data.data.email || "",
          phone_number: data.data.phone_number || "",
          company_name: data.data.company_name || "",
          tax_code: data.data.tax_code || "",
        })
      } catch (err) {
        setError(err.message)
        console.error("Error fetching user profile:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [navigate])

  // Auto-close the modal after 5 seconds
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [showModal])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setUpdateSuccess(false)

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        navigate("/login")
        return
      }

      // Only include fields that need to be updated
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        company_name: formData.company_name,
        tax_code: formData.tax_code,
      }

      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/user/profile/update/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      const updatedData = await response.json()
      setUserProfile(updatedData.data)

      // Update form data with the response
      setFormData({
        ...formData,
        first_name: updatedData.data.first_name || "",
        last_name: updatedData.data.last_name || "",
        phone_number: updatedData.data.phone_number || "",
        company_name: updatedData.data.company_name || "",
        tax_code: updatedData.data.tax_code || "",
      })

      setUpdateSuccess(true)
      setShowModal(true)
    } catch (err) {
      setError(err.message)
      console.error("Error updating profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  if (loading && !userProfile) {
    return <div className="loading-container">Loading user profile...</div>
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>
  }

  return (
    <div className="account-settings-container">
      <h1>Account Settings</h1>

      {userProfile && (
        <div className="account-info-summary">
          <div className="account-status">
            <span className={`status-badge ${userProfile.account_status}`}>
              {userProfile.account_status.toUpperCase()}
            </span>
          </div>
          <div className="coin-balance">
            <span className="coin-icon">🪙</span>
            <span className="balance-amount">{userProfile.coin_balance}</span>
          </div>
          <div className="account-type">
            <span className="role-badge">{userProfile.role.toUpperCase()}</span>
          </div>
          <div className="member-since">Member since: {new Date(userProfile.date_joined).toLocaleDateString()}</div>
          {userProfile.average_rating && (
            <div className="user-rating">
              <span className="rating-label">Rating: </span>
              <span className="rating-value">⭐ {userProfile.average_rating}</span>
            </div>
          )}
          {userProfile.completed_orders_count > 0 && (
            <div className="completed-orders">
              <span className="orders-label">Completed Orders: </span>
              <span className="orders-value">{userProfile.completed_orders_count}</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="account-settings-form">
        <div className="form-section">
          <h2>Personal Information</h2>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled
            />
            <small>Username cannot be changed</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input type="text" id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} disabled />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone_number">Phone Number</label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Business Information</h2>
          <div className="form-group">
            <label htmlFor="company_name">Company Name</label>
            <input
              type="text"
              id="company_name"
              name="company_name"
              value={formData.company_name || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tax_code">Tax Code</label>
            <input type="text" id="tax_code" name="tax_code" value={formData.tax_code || ""} onChange={handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

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
              <h2>Profile Updated</h2>
              <p>Your account information has been successfully updated.</p>
              <div className="modal-details">
                <div className="modal-detail-item">
                  <span className="detail-label">Name:</span>
                  <span className="detail-value">
                    {formData.first_name} {formData.last_name}
                  </span>
                </div>
                {formData.phone_number && (
                  <div className="modal-detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{formData.phone_number}</span>
                  </div>
                )}
                {formData.tax_code && (
                  <div className="modal-detail-item">
                    <span className="detail-label">Tax Code:</span>
                    <span className="detail-value">{formData.tax_code}</span>
                  </div>
                )}
                {formData.company_name && (
                  <div className="modal-detail-item">
                    <span className="detail-label">Company:</span>
                    <span className="detail-value">{formData.company_name}</span>
                  </div>
                )}
              </div>
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

export default AccountSettings

