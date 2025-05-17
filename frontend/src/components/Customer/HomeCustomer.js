"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"

import axios from "axios"
import "../../css/HomeCustomer.css"
import "../../css/OrderDetails.css"
import CreateOrder from "./CreateOrder"
import UserProfile from "./UserProfile"
import Statistics from "./Statistics"
import Balance from "./Balance"
import HelpSupport from "./HelpSupport"

function HomeCustomer() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const BASE_URL = process.env.REACT_APP_API_BASE_URL
  // Toggle sidebar function
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }
  const getImageUrl = (icon) => {
    if (icon.startsWith("/media/")) {
      return BASE_URL.replace("/api/v1", "") + icon
    }
    return BASE_URL + icon
  }
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/category/`)
        setCategories(response.data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])
  const [currentPage, setCurrentPage] = useState(1) // Trang hiện tại
  const ordersPerPage = 6 // Số đơn hàng mỗi trang
  const paginate = (pageNumber) => setCurrentPage(pageNumber)
  const [currentOrders, setCurrentOrders] = useState([])
  const orderListingRef = useRef(null) // Tạo ref cho phần Order Listing
  const orderDetailsRef = useRef(null)
  const [activeSection, setActiveSection] = useState("orders") // Thêm state activeSection
  const [orders, setOrders] = useState([]) // Lưu trữ dữ liệu đơn hàng
  const [loading, setLoading] = useState(true) // Trạng thái tải
  const [error, setError] = useState("") // Lưu trữ lỗi nếu có
  const [selectedOrder, setSelectedOrder] = useState(null) // Để lưu thông tin chi tiết đơn hàng
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  useEffect(() => {
    const indexOfLastOrder = currentPage * ordersPerPage
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
    setCurrentOrders(orders.slice(indexOfFirstOrder, indexOfLastOrder))
  }, [orders, currentPage]) // Khi orders hoặc currentPage thay đổi, tính lại currentOrders
  const getStatusStep = (status) => {
    const statusMap = {
      pending: 1,
      constructor_selected: 2,
      in_progress: 3,
      completed: 4,
      cancelled: 5,
    }
    return statusMap[status.toLowerCase()] || 1
  }

  const handleSignContract = () => {
    if (!selectedOrder) return

    // Kiểm tra trạng thái đơn hàng
    if (selectedOrder.status === "pending") {
      alert("You cannot sign a contract for a pending order.")
      return
    }

    // Nếu đơn hàng có constructor selected, in progress, hoặc completed → Điều hướng đến ViewContract
    if (["constructor_selected", "in_progress", "completed"].includes(selectedOrder.status)) {
      navigate(`/view-contract/${selectedOrder.id}`)
    }
  }

  const handleMenuClick = (section) => {
    setActiveSection(section)
    setSidebarOpen(false)
  }
  useEffect(() => {
    if (selectedOrder && orderDetailsRef.current) {
      orderDetailsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }, [selectedOrder])

  useEffect(() => {
    // Khi activeSection thay đổi, reset selectedOrder và isOrdersVisible
    setSelectedOrder(null) // Reset selectedOrder
  }, [activeSection])
  // Fetch orders function
  const fetchOrders = async () => {
    const token = localStorage.getItem("accessToken")

    if (!token) {
      setError("Unauthorized: No token found.")
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setOrders(response.data)
      setError("")
    } catch (error) {
      setError(error.response?.data?.message || "Failed to fetch data.")
    } finally {
      setLoading(false)
    }
  }

  // Call fetchOrders when the component mounts
  useEffect(() => {
    fetchOrders()
  }, [])

  // Loading and error handling
  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  // Xử lý khi người dùng nhấn "View Details"
  const handleViewDetails = (orderId) => {
    const order = orders.find((order) => order.id === orderId)
    setSelectedOrder(order) // Lưu thông tin chi tiết đơn hàng để hiển thị
  }
  const handleBackButton = () => {
    setSelectedOrder(null) // Clears the selected order
    // Di chuyển đến phần Order Listing với hiệu ứng mượt mà
    if (orderListingRef.current) {
      orderListingRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  //Chọn Quotation
  const handleSelectQuotation = async (orderId, quotationId) => {
    const token = localStorage.getItem("accessToken")
    const url = `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/quotations/${quotationId}/select/`

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log("Quotation selected:", response.data)
      setSuccessMessage("Quotation selected successfully!")
      setShowSuccessModal(true)
      fetchOrders()
    } catch (error) {
      console.error("Error selecting quotation:", error)
      alert("Error selecting quotation.")
    }
  }

  const handleCancelOrder = (orderId) => {
    setShowCancelModal(true)
  }

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return

    const token = localStorage.getItem("accessToken")
    const url = `${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${selectedOrder.id}/cancel/`

    try {
      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      )
      console.log("Order cancelled:", response.data)
      setSuccessMessage("Order cancelled successfully!")
      setShowCancelModal(false) // Close the confirmation modal
      setShowSuccessModal(true) // Show the success modal

      // Auto close success modal after 3 seconds and navigate back to orders list
      setTimeout(() => {
        setShowSuccessModal(false)
        fetchOrders()
        setSelectedOrder(null) // Close the order details view
      }, 3000)
    } catch (error) {
      console.error("Error cancelling order:", error)
      alert("Error cancelling order. " + (error.response?.data?.message || ""))
      setShowCancelModal(false) // Close the modal on error too
    }
  }

  return (
    <div className="home">
      {/* Mobile sidebar toggle button */}
      <button
        className={`sidebar-toggle ${sidebarOpen ? "active" : ""}`}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="Logo" />
          <h1>Customer Portal</h1>
        </div>
        <h2>Menu</h2>
        <ul>
          <li className={activeSection === "profile" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("profile")
              }}
            >
              View Profile
            </a>
          </li>
          <li className={activeSection === "orders" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("orders")
              }}
            >
              Order Created
            </a>
          </li>
          <li className={activeSection === "createOrder" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("createOrder")
              }}
            >
              Create Order
            </a>
          </li>
          <li className={activeSection === "statistics" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("statistics")
              }}
            >
              View Statistics
            </a>
          </li>
          <li className={activeSection === "balance" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("balance")
              }}
            >
              Balance
            </a>
          </li>
          <li className={activeSection === "helpSupport" ? "active" : ""}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handleMenuClick("helpSupport")
              }}
            >
              Help & Support
            </a>
          </li>
        </ul>
        <div className="sidebar-footer">&copy; 2025 Construction Portal</div>
      </div>
      <div className="content">
        {activeSection === "profile" && <UserProfile />}
        {activeSection === "orders" && (
          <section>
            <div className="popular-categories">
              <h2>Popular Categories</h2>
              <div className="category-grid">
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <div key={category.id} className="category-item">
                      <img
                        src={getImageUrl(category.icon) || "/placeholder.svg"}
                        alt={category.name}
                        width="50"
                        height="50"
                      />
                      <p>{category.name}</p>
                    </div>
                  ))
                ) : (
                  <p>Loading categories...</p>
                )}
              </div>
            </div>
            <div ref={orderListingRef} className="service-listings">
              <h2>Order Created</h2>
              <div className="service-grid">
                {currentOrders.length > 0 ? (
                  currentOrders.map((order) => (
                    <div key={order.id} className="service-item">
                      <div className="service-item-image">
                        <img
                          src={
                            order.files.length
                              ? order.files[0].file.startsWith("http")
                                ? order.files[0].file // If the file URL is already complete
                                : `${process.env.REACT_APP_API_BASE_URL}${order.files[0].file}` // If it's a relative URL, prepend the base URL
                              : "default_image.jpg" // Fallback image if no files are available
                          }
                          alt={order.title}
                        />
                        <span className={`order-status-badge ${order.status.toLowerCase().replace(" ", "-")}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="service-item-content">
                        <h3>{order.title}</h3>
                        <p>{order.description}</p>
                        <h4 className="category">
                          Category:{" "}
                          <span
                            className={
                              order.category?.category === "material" ? "category-material" : "category-service"
                            }
                          >
                            {order.category?.name || "Unknown"}
                          </span>
                        </h4>
                        <button onClick={() => handleViewDetails(order.id)} className="view-details-btn">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-orders">No orders found</div>
                )}
              </div>
            </div>
            <div className="pagination">
              {Array.from({ length: Math.ceil(orders.length / ordersPerPage) }, (_, index) => (
                <button
                  key={index + 1}
                  onClick={() => paginate(index + 1)}
                  className={`pagination-button ${currentPage === index + 1 ? "active" : ""}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Hiển thị chi tiết đơn hàng nếu có đơn hàng đã chọn */}
        {selectedOrder && (
          <section ref={orderDetailsRef} className="order-details">
            <h2>Order Details</h2>
            <div className="order-details-header">
              <div className="order-details-title">
                <h3>{selectedOrder.title}</h3>
                <span className={`order-status ${selectedOrder.status.toLowerCase().replace("_", "-")}`}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="status-timeline">
              <div
                className={`status-step ${selectedOrder.status.toLowerCase() === "pending" || getStatusStep(selectedOrder.status) > 1 ? "completed" : ""} ${selectedOrder.status.toLowerCase() === "pending" ? "active" : ""}`}
              >
                <div className="status-dot">1</div>
                <div className="status-label">Pending</div>
              </div>
              <div
                className={`status-step ${selectedOrder.status.toLowerCase() === "constructor_selected" || getStatusStep(selectedOrder.status) > 2 ? "completed" : ""} ${selectedOrder.status.toLowerCase() === "constructor_selected" ? "active" : ""}`}
              >
                <div className="status-dot">2</div>
                <div className="status-label">Constructor Selected</div>
              </div>
              <div
                className={`status-step ${selectedOrder.status.toLowerCase() === "in_progress" || getStatusStep(selectedOrder.status) > 3 ? "completed" : ""} ${selectedOrder.status.toLowerCase() === "in_progress" ? "active" : ""}`}
              >
                <div className="status-dot">3</div>
                <div className="status-label">In Progress</div>
              </div>
              <div
                className={`status-step ${selectedOrder.status.toLowerCase() === "completed" ? "completed active" : ""}`}
              >
                <div className="status-dot">4</div>
                <div className="status-label">Completed</div>
              </div>
              <div
                className={`status-step ${selectedOrder.status.toLowerCase() === "cancelled" ? "cancelled active" : ""}`}
              >
                <div className="status-dot">5</div>
                <div className="status-label">Cancelled</div>
              </div>
            </div>

            <div className="order-details-description">
              <p>{selectedOrder.description}</p>
            </div>

            <div className="order-details-meta">
              <div className="order-details-meta-item">
                <h4>Connection Fee</h4>
                <p>${selectedOrder.connection_fee}</p>
              </div>
              <div className="order-details-meta-item">
                <h4>Created At</h4>
                <p>
                  {new Date(selectedOrder.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="order-details-meta-item">
                <h4>Expires At</h4>
                <p>
                  {new Date(selectedOrder.expired_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {selectedOrder.files && selectedOrder.files.length > 0 && (
              <div className="order-details-files">
                <h4>Order Files</h4>
                <div className="order-files-grid">
                  {selectedOrder.files.map((file, index) => {
                    const fileUrl = file.file.startsWith("http")
                      ? file.file
                      : `${process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")}${file.file}`

                    const fileExtension = file.file.split(".").pop().toLowerCase()

                    return (
                      <div key={index} className="order-file-item">
                        {fileExtension === "jpg" ||
                        fileExtension === "jpeg" ||
                        fileExtension === "png" ||
                        fileExtension === "gif" ? (
                          <img src={fileUrl || "/placeholder.svg"} alt={`Order file ${index + 1}`} />
                        ) : (
                          <a href={fileUrl} download className="quotation-file-link">
                            File {index + 1}
                          </a>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="quotations-section">
              <h4>Quotations</h4>
              {selectedOrder.quotations && selectedOrder.quotations.length > 0 ? (
                <div className="quotation-details-wrapper">
                  {selectedOrder.quotations.map((quotation, index) => (
                    <div className="quotation-details" key={index}>
                      <h4>Quotation #{quotation.id || index + 1}</h4>
                      <p className="constructor">From: {quotation.constructor_username}</p>
                      <p className={`status ${quotation.status.toLowerCase()}`}>Status: {quotation.status}</p>

                      <div className="quotation-body">
                        <p className="message">{quotation.message}</p>
                        <p className="warranty">Warranty: {quotation.warranty_days} days</p>
                      </div>

                      {quotation.files && quotation.files.length > 0 && (
                        <div className="quotation-files">
                          <h5>Attached Files:</h5>
                          <div className="file-grid">
                            {quotation.files.map((file, idx) => {
                              const fileUrl = file.file.startsWith("http")
                                ? file.file
                                : `${process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")}${file.file}`

                              const fileName = file.file.split("/").pop()
                              const fileExtension = file.file.split(".").pop().toLowerCase()

                              return (
                                <div key={idx}>
                                  {fileExtension === "jpg" ||
                                  fileExtension === "jpeg" ||
                                  fileExtension === "png" ||
                                  fileExtension === "gif" ? (
                                    <img
                                      src={fileUrl || "/placeholder.svg"}
                                      alt={`Quotation file ${idx + 1}`}
                                      className="quotation-image"
                                    />
                                  ) : (
                                    <a href={fileUrl} download className="quotation-file-link">
                                      Download {fileName}
                                    </a>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleSelectQuotation(selectedOrder.id, quotation.id)}
                        className="select-quotation-btn"
                        disabled={quotation.status === "ACCEPTED"}
                      >
                        {quotation.status === "ACCEPTED" ? "Selected" : "Select Quotation"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-quotations">
                  <p>No quotations have been submitted for this order yet.</p>
                </div>
              )}
            </div>

            <div className="order-actions">
              <button onClick={handleBackButton} className="back-button">
                Back
              </button>
              {selectedOrder.status !== "cancelled" && selectedOrder.status !== "completed" && (
                <button onClick={() => handleCancelOrder(selectedOrder.id)} className="cancel-button">
                  Cancel Order
                </button>
              )}
              <button onClick={handleSignContract} className="contract-button">
                Sign Contract
              </button>
            </div>
          </section>
        )}

        {activeSection === "createOrder" && <CreateOrder categories={categories} fetchOrders={fetchOrders} />}
        {activeSection === "statistics" && <Statistics />}

        {activeSection === "balance" && <Balance />}

        {activeSection === "helpSupport" && <HelpSupport />}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Confirm Cancellation</h3>
              <p className="modal-message">Are you sure you want to cancel this order? This action cannot be undone.</p>
              <div className="modal-actions">
                <button onClick={() => setShowCancelModal(false)} className="modal-button modal-button-secondary">
                  No, Keep Order
                </button>
                <button onClick={confirmCancelOrder} className="modal-button modal-button-danger">
                  Yes, Cancel Order
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-content modal-success">
              <div className="success-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 className="modal-title success-title">Success</h3>
              <p className="modal-message">{successMessage}</p>
              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowSuccessModal(false)
                    if (successMessage.includes("cancelled")) {
                      setSelectedOrder(null)
                    }
                  }}
                  className="modal-button modal-button-success"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HomeCustomer

