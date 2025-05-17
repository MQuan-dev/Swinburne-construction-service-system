import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import axios from "axios"
import "../../css/ViewContract.css"
import UserProfileModal from "../UserProfileModal"

function ViewContract() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [contractFile, setContractFile] = useState(null)
  const [contracts, setContracts] = useState(null)
  const [contractMoney, setContractMoney] = useState("")
  const [loading, setLoading] = useState(true)
  const [fileName, setFileName] = useState("")
  const [isFinished, setIsFinished] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  // New state for user profile modal
  const [userProfile, setUserProfile] = useState(null)
  const [showUserProfileModal, setShowUserProfileModal] = useState(false)
  // Function to handle clicking on a username
  const handleUsernameClick = (userId) => {
    fetchUserProfile(userId)
  }

  // Function to close the user profile modal
  const closeUserProfileModal = () => {
    setShowUserProfileModal(false)
  }
  // Function to fetch user profile
  const fetchUserProfile = async (userId) => {
    if (!userId) return


    setUserProfile(null)

    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        console.error("No authentication token found. Please log in.")
        return
      }

      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/users/${userId}/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setUserProfile(response.data.profile)
      setShowUserProfileModal(true)
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setErrorMessage("Failed to load user profile.")
      setShowErrorModal(true)
    }
  }
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault()
    setIsFeedbackSubmitting(true)

    try {
      const token = localStorage.getItem("accessToken")
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/constructor-feedback/`,
        {
          rating: feedbackRating,
          feedback: feedbackText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setFeedbackSubmitted(true)
      setTimeout(() => {
      setShowFeedbackModal(false)
      setFeedbackSubmitted(false)
      }, 2000)
    } catch (error) {
      console.error("Error submitting feedback:", error)
      let errorMessage = "Failed to submit feedback."

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error
      }
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setIsFeedbackSubmitting(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("accessToken")
        if (!token) {
          console.error("No authentication token found. Please log in.")
          return
        }

        const [orderResponse, contractsResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/contracts/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        setOrder(orderResponse.data)
        setContracts(contractsResponse.data)

        // Check if the order is already marked as finished
        if (orderResponse.data.status === "completed") {
          setIsFinished(true)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [orderId])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    setContractFile(file)
    setFileName(file ? file.name : "")
  }

  const handleMoneyChange = (event) => {
    setContractMoney(event.target.value)
  }

  const handleSubmitContract = async () => {
    if (!contractFile || !contractMoney) {
      alert("Please upload a contract file and specify the contract amount.")
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("contract_file", contractFile)
      formData.append("contract_money", contractMoney)

      const token = localStorage.getItem("accessToken")
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/contracts/constructor/upload/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      )

      // Refresh contracts data
      const contractsResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/contracts/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      setContracts(contractsResponse.data)
      setContractFile(null)
      setContractMoney("")
      setFileName("")
      setShowConfirmation(true)
      setShowUploadSuccessModal(true)
    } catch (error) {
      console.error("Error uploading contract:", error)
      let errorMessage = "Failed to upload contract."

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error
      }
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const openConfirmModal = () => {
    setShowConfirmModal(true)
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false)
  }

  const handleMarkAsFinished = async () => {
    // Instead of using window.confirm, show our custom modal
    openConfirmModal()
  }

  const confirmMarkAsFinished = async () => {
    try {
      setLoading(true)
      closeConfirmModal() // Close the confirmation modal

      const token = localStorage.getItem("accessToken")

      // This is a placeholder API endpoint - replace with your actual endpoint
      await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/confirm-completion/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setIsFinished(true)

      // Refresh order data to get updated status
      const orderResponse = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setOrder(orderResponse.data)
      setShowSuccessModal(true)
    } catch (error) {
      console.error("Error marking contract as finished:", error)
      // Extract the specific error message from the response if available
      let errorMessage = "Failed to mark contract as finished."

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error
      }

      // Show the error in a modal instead of an alert
      setErrorMessage(errorMessage)
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const closeSuccessModal = () => {
    setShowSuccessModal(false)
  }

  const closeErrorModal = () => {
    setShowErrorModal(false)
  }

  const closeUploadSuccessModal = () => {
    setShowUploadSuccessModal(false)
  }

  if (loading && !order) {
    return (
      <div className="loading">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <p>Loading contract details...</p>
      </div>
    )
  }

  return (
    <div className="contract-container">
      <h1 className="contract-title">Order Details</h1>

      {isFinished && (
        <div className="confirmation-banner success">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>This contract has been marked as finished!</p>
          <button onClick={() => setShowFeedbackModal(true)} className="feedback-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Send Feedback
          </button>
        </div>
      )}

      {showConfirmation && (
        <div className="confirmation-banner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>Contract uploaded successfully!</p>
        </div>
      )}
      {/* User Profile Modal */}
            {showUserProfileModal && <UserProfileModal profile={userProfile} onClose={closeUserProfileModal} />}
            {/* Feedback Modal */}
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="feedback-modal">
            <div className="feedback-modal-content">
              <h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Your Feedback
              </h2>

              {feedbackSubmitted ? (
                <div className="feedback-success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p>Thank you for your feedback!</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit}>
                  <div className="form-group">
                    <label htmlFor="rating" className="form-label">
                      Rating
                    </label>
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className={`star-button ${feedbackRating >= star ? "active" : ""}`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill={feedbackRating >= star ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="feedback" className="form-label">
                      Your Feedback
                    </label>
                    <textarea
                      id="feedback"
                      rows="4"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Please share your experience with this contract..."
                      className="form-control"
                    ></textarea>
                  </div>

                  <div className="confirm-buttons">
                    <button type="button" onClick={() => setShowFeedbackModal(false)} className="button secondary">
                      Cancel
                    </button>
                    <button type="submit" className="button success" disabled={isFeedbackSubmitting}>
                      {isFeedbackSubmitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-content">
              <div className="confirm-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Confirm Action</h2>
              <p>Are you sure you want to mark this contract as finished?</p>
              <div className="confirm-buttons">
                <button onClick={closeConfirmModal} className="button secondary">
                  Cancel
                </button>
                <button onClick={confirmMarkAsFinished} className="button success">
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-modal-content">
              <div className="success-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Contract Completed!</h2>
              <p>The contract has been successfully marked as finished.</p>
              <p>Thank you for using our service!</p>
              <button onClick={closeSuccessModal} className="button success">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="error-modal">
            <div className="error-modal-content">
              <div className="error-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Unable to Complete</h2>
              <p>{errorMessage}</p>
              <button onClick={closeErrorModal} className="button danger">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Success Modal */}
      {showUploadSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-modal-content">
              <div className="success-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2>Contract Uploaded!</h2>
              <p>Your contract has been successfully uploaded.</p>
              <button onClick={closeUploadSuccessModal} className="button success">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="contract-layout">
        {/* Left column - Order information */}
        <div className="contract-column">
          <div className="card order-summary">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Order Summary
            </h2>
            <p>
              <span>Order ID:</span> {order.id}
            </p>
            <p>
              <span>Title:</span> {order.title}
            </p>
            <p>
              <span>Status:</span> <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
            </p>
            <p>
              <span>Customer: </span>
              <span className="clickable-username" onClick={() => handleUsernameClick(order.user)}>
                {order.user_username} (Click to view detail)
              </span>
            </p>
            <p>
              <span>Constructor: </span>
              <span className="clickable-username">
                {order.constructor_username}
              </span>
            </p>
          </div>

          <div className="card category-info">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Category
            </h2>
            <p>
              <span>Name:</span> {order.category.name}
            </p>
            <p>
              <span>Type:</span> {order.category.category}
            </p>
            <p>
              <span>Description:</span> {order.category.description}
            </p>
          </div>

          <div className="card dates">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Important Dates
            </h2>
            <p>
              <span>Created:</span> {new Date(order.created_at).toLocaleString()}
            </p>
            <p>
              <span>Updated:</span> {new Date(order.updated_at).toLocaleString()}
            </p>
            <p>
              <span>Expires:</span> {new Date(order.expired_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Middle column - Description and Files */}
        <div className="contract-column">
          <div className="card description">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
              Description
            </h2>
            <p>{order.description}</p>
          </div>

          <div className="card files">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                <polyline points="13 2 13 9 20 9" />
              </svg>
              Files
            </h2>
            <div className="files-grid">
              {order.files.length > 0 ? (
                order.files.map((file, index) => (
                  <img
                    key={index}
                    className="img-contract"
                    src={file.file.startsWith("http") ? file.file : `${process.env.REACT_APP_API_BASE_URL}${file.file}`}
                    alt={`Order file ${index + 1}`}
                  />
                ))
              ) : (
                <p>No files available</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column - Quotations */}
        <div className="contract-column">
          <div className="card quotations">
            <h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              Accepted Quotations
            </h2>
            <div className="quotations-grid">
              {order.quotations
                .filter((quotation) => quotation.status === "accepted")
                .map((quotation) => (
                  <div key={quotation.id} className="quotation-card">
                    <p>
                      <span>Constructor ID:</span> {quotation.constructor}
                    </p>
                    <p>
                      <span>Message:</span> {quotation.message}
                    </p>
                    <p>
                      <span>Status:</span> <span className={`status ${quotation.status}`}>{quotation.status}</span>
                    </p>
                    <p>
                      <span>Warranty Days:</span> {quotation.warranty_days}
                    </p>
                    <p>
                      <span>Created:</span> {new Date(quotation.created_at).toLocaleString()}
                    </p>
                    {quotation.files.map((file, index) => (
                      <a key={index} href={file.file} target="_blank" rel="noopener noreferrer" className="file-link">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Quotation File {index + 1}
                      </a>
                    ))}
                  </div>
                ))}
              {order.quotations.filter((quotation) => quotation.status === "accepted").length === 0 && (
                <p className="no-contract">No accepted quotations found</p>
              )}
            </div>
          </div>

          {contracts && (
            <div className="card contracts">
              <h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 11.08V8l-6-6H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h6" />
                  <path d="M14 3v5h5M18 21v-6M15 18h6" />
                </svg>
                Contracts
              </h2>
              <div className="contract-section">
                <h3>User Contract</h3>
                {contracts.user_contract ? (
                  <>
                    <p>
                      <span>Amount:</span> ${contracts.user_contract.contract_money}
                    </p>
                    <p>
                      <span>Status:</span>{" "}
                      <span className={`status ${contracts.user_contract.status.toLowerCase()}`}>
                        {contracts.user_contract.status}
                      </span>
                    </p>
                    <p>
                      <span>Uploaded Date:</span> {new Date(contracts.user_contract.uploaded_date).toLocaleString()}
                    </p>
                    <a
                      href={`${process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")}${contracts.user_contract.contract_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      View User Contract
                    </a>
                  </>
                ) : (
                  <p className="no-contract">No user contract found</p>
                )}
              </div>
              <div className="contract-section">
                <h3>Constructor Contract</h3>
                {contracts.constructor_contract ? (
                  <>
                    <p>
                      <span>Amount:</span> ${contracts.constructor_contract.contract_money}
                    </p>
                    <p>
                      <span>Status:</span>{" "}
                      <span className={`status ${contracts.constructor_contract.status.toLowerCase()}`}>
                        {contracts.constructor_contract.status}
                      </span>
                    </p>
                    <p>
                      <span>Uploaded Date:</span>{" "}
                      {new Date(contracts.constructor_contract.uploaded_date).toLocaleString()}
                    </p>
                    <a
                      href={`${process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")}${contracts.constructor_contract.contract_file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="file-link"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      View Constructor Contract
                    </a>
                  </>
                ) : (
                  <p className="no-contract">No constructor contract found</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom section - Upload Contract */}
      <div className="contract-bottom">
        <div className="card upload-section">
          <h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload Contract
          </h2>
          <div className="upload-form">
            <div className="form-group">
              <label className="form-label">Contract Amount</label>
              <input
                type="text"
                className="form-control contract-amount-input"
                placeholder="Enter contract money"
                value={contractMoney}
                onChange={handleMoneyChange}
              />
            </div>

            <div className="file-input-wrapper">
              <label className="file-input-label">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                Choose Contract File
                <input type="file" className="file-input" onChange={handleFileUpload} />
              </label>
              {fileName && <div className="file-name">Selected file: {fileName}</div>}
            </div>

            <div className="button-group">
              <button onClick={handleSubmitContract} className="button">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Contract
              </button>

              {!isFinished && (
                <button onClick={handleMarkAsFinished} className="button success">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Mark as Finished
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewContract

