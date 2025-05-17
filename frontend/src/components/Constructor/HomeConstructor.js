//D:\SWB\main18-1\new14-3\frontend\src\components\Constructor\HomeConstructor.js
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../css/HomeConstructor.css";
import "../../css/OrderDetails.css";
import UserProfile from './UserProfile';
import Statistics from "./Statistics" 
import Balance from "./Balance" 
import HelpSupport from "./HelpSupport" 

function HomeConstructor() {
  const [sidebarOpen, setSidebarOpen] = useState(false); 
  const [orders, setOrders] = useState([]); // Lưu trữ dữ liệu đơn hàng
  const [loading, setLoading] = useState(true); // Trạng thái tải
  const [error, setError] = useState(''); // Lưu trữ lỗi nếu có
  const [selectedOrder, setSelectedOrder] = useState(null); // Lưu trữ đơn hàng đã chọn để hiển thị chi tiết
  const [showQuotationForm, setShowQuotationForm] = useState(false); // Trạng thái hiển thị form submit quotation
  const [activeSection, setActiveSection] = useState('orders'); // Thêm state activeSection
  const [categories, setCategories] = useState([]);
  const orderListingRef = useRef(null); // Tạo ref cho phần Order Listing
  const orderDetailsRef = useRef(null);
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const handleMenuClick = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };
  const getStatusStep = (status) => {
    const statusMap = {
      pending: 1,
      constructor_selected: 2,
      in_progress: 3,
      completed: 4,
    }
    return statusMap[status.toLowerCase()] || 1
  }
  const filteredOrders = orders.filter(order =>
    order.title.toLowerCase().includes(filter.toLowerCase()) ||
    order.status.toLowerCase().includes(filter.toLowerCase())
  );
  const handleBackButton = () => {
    setSelectedOrder(null);  // Clears the selected order
    // Di chuyển đến phần Order Listing với hiệu ứng mượt mà
    if (orderListingRef.current) {
      orderListingRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };
  const getImageUrl = (icon) => {
    if (icon.startsWith("/media/")) {
      return BASE_URL.replace("/api/v1", "") + icon;
    }
    return BASE_URL + icon;
  };
  useEffect(() => {
      if (selectedOrder && orderDetailsRef.current) {
        orderDetailsRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, [selectedOrder]); 
    
    useEffect(() => {
      // Khi activeSection thay đổi, reset selectedOrder và isOrdersVisible
      setSelectedOrder(null);   // Reset selectedOrder
    }, [activeSection]);
  useEffect(() => {
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/category/`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  fetchCategories();
  }, []);
  const handleSignContract = () => {
    if (!selectedOrder) return;
  
    // Kiểm tra trạng thái đơn hàng
    if (selectedOrder.status === "pending") {
      alert("You cannot sign a contract for a pending order.");
      return;
    }
  
    if (selectedOrder.status === "rejected") {
      alert("You cannot sign a contract for a rejected order.");
      return;
    }
  
    // Nếu đơn hàng có constructor selected, in progress, hoặc completed → Điều hướng đến ViewContract
    if (
      ["accepted", "in_progress", "completed"].includes(selectedOrder.status)
    ) {
      navigate(`/view-contract-constructor/${selectedOrder.id}`);
    }
  };
  function getHeaderTitle(filter) {
    switch (filter) {
      case "pending":
        return "Open Orders";
      case "accepted":
        return "accepted";
      case "rejected":
        return "rejected";
      case "in_progress":
        return "Orders In Progress";
      case "completed":
        return "Completed Orders";
      case "cancelled":
        return "Cancelled Orders";
      default:
        return "All Orders";
    }
  }
  
  const [formData, setFormData] = useState({
    message: '',
    quotation_files: []
  });

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Unauthorized: No token found.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setOrders(response.data);
        setError('');
      } catch (error) {
        setError(error.response?.data?.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleViewDetails = (orderId) => {
    // Tìm đơn hàng theo ID khi người dùng nhấn xem chi tiết
    const order = orders.find((order) => order.id === orderId);
    setSelectedOrder(order); // Cập nhật trạng thái để hiển thị chi tiết đơn hàng
  };

  const handleSubmitQuotation = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("accessToken");
    const orderId = selectedOrder.id; // Assuming we have selected an order
    const formDataToSend = new FormData();
  
    formDataToSend.append('message', formData.message);
  
    // Handle files properly: `quotation_files` is a FileList, so we convert it to an array
    Array.from(formData.quotation_files).forEach((file) => {
      formDataToSend.append('quotation_files', file);
    });
  
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/orders/orders-list/${orderId}/submit_quotation/`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Quotation submitted successfully!');
      setShowQuotationForm(false); // Hide form after submission
    } catch (error) {
      alert('Error submitting quotation: ' + (error.response?.data?.message || "Failed to connect to the API."));
    }
  };
  

  const handleFileChange = (event) => {
    setFormData({ ...formData, quotation_files: event.target.files });
  };

  const handleMessageChange = (event) => {
    setFormData({ ...formData, message: event.target.value });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home">
       {/* Mobile sidebar toggle button */}
       <button 
        className={`sidebar-toggle ${sidebarOpen ? 'active' : ''}`} 
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      {sidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <img src="https://www.iconpacks.net/icons/2/free-user-icon-3296-thumb.png" alt="Logo" />
          <h1>Constructor Portal</h1>
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
      {activeSection === 'profile' && <UserProfile />}
      {activeSection === 'orders' && (
        <section>
        <div className="popular-categories">
            <h2>Popular Categories</h2>
            <div className="category-grid">
              {categories.length > 0 ? (
                categories.map(category => (
                  <div key={category.id} className="category-item">
                    <img 
                      src={getImageUrl(category.icon)} 
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
            <h2>{getHeaderTitle(filter)}</h2>
            <div className="filter-container">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Open </option>
                <option value="accepted">Accepted </option>
                <option value="rejected">Rejected </option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="service-grid">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <div key={order.id} className="service-item">
                    <div className="service-item-image">
                    <img
                      src={
                        order.files.length
                          ? order.files[0].file.startsWith('http')
                            ? order.files[0].file // If the file URL is already complete
                            : `${process.env.REACT_APP_API_BASE_URL}${order.files[0].file}` // If it's a relative URL, prepend the base URL
                          : 'default_image.jpg' // Fallback image if no files are available
                      }
                      alt={order.title}
                    />
                    <span className={`order-status-badge ${order.status.toLowerCase().replace(" ", "-")}`}>
                  {order.status}
                </span>
                </div>
                    <h3>{order.title}</h3>
                    <p>{order.description}</p>
                    <h4 className="category">
                      Category:{' '}
                      <span className={order.category?.category === "material" ? "category-material" : "category-service"}>
                        {order.category?.name || "Unknown"}
                      </span>
                    </h4>
                    <button onClick={() => handleViewDetails(order.id)} className="view-details-btn">
                      View Details
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-orders-found">No orders found</p>
              )}
            </div>
          </div>
        </section>  )}     
        
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
              className={`status-step ${selectedOrder?.status?.toLowerCase() === "pending" || getStatusStep(selectedOrder?.status) > 1 ? "completed" : ""} ${selectedOrder?.status?.toLowerCase() === "pending" ? "active" : ""}`}
            >
              <div className="status-dot">1</div>
              <div className="status-label">Pending</div>
            </div>
            <div
              className={`status-step ${
                selectedOrder?.status?.toLowerCase() === "accepted" ||
                selectedOrder?.status?.toLowerCase() === "rejected" ||
                getStatusStep(selectedOrder?.status) > 2
                  ? "completed"
                  : ""
              } ${
                selectedOrder?.status?.toLowerCase() === "accepted" || selectedOrder?.status?.toLowerCase() === "rejected"
                  ? "active"
                  : ""
              }`}
            >
              <div className="status-dot">2</div>
              <div className="status-label">{selectedOrder?.status?.toLowerCase() === "rejected" ? "Rejected" : "Accepted"}</div>
            </div>
            <div
              className={`status-step ${selectedOrder?.status?.toLowerCase() === "in_progress" || getStatusStep(selectedOrder?.status) > 3 ? "completed" : ""} ${selectedOrder?.status?.toLowerCase() === "in_progress" ? "active" : ""}`}
            >
              <div className="status-dot">3</div>
              <div className="status-label">In Progress</div>
            </div>
            <div className={`status-step ${selectedOrder?.status?.toLowerCase() === "completed" ? "completed active" : ""}`}>
              <div className="status-dot">4</div>
              <div className="status-label">Completed</div>
            </div>
            <div className={`status-step ${selectedOrder?.status?.toLowerCase() === "cancelled" ? "cancelled active" : ""}`}>
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
                                  {fileName}
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  
                </div>
              ))}
            </div>
          ) : (
            <div className="no-quotations">
              <p>No quotations have been submitted for this order yet.</p>
            </div>
          )}
        </div>
          <div className="quotation-form-container">
              <button className="toggle-form-btn" onClick={() => setShowQuotationForm((prev) => !prev)}>
                {showQuotationForm ? "Close Quotation Form" : "Submit Quotation"}
              </button>
            {showQuotationForm && (
              <form className="quotation-form" onSubmit={handleSubmitQuotation} encType="multipart/form-data">
                <label>
                  Message:
                  <textarea
                    value={formData.message}
                    onChange={handleMessageChange}
                    required
                  />
                </label>
                <label>
                  Quotation Files:
                  <input
                    type="file"
                    name="quotation_files"
                    onChange={handleFileChange}
                    multiple
                    required
                  />
                </label>
                <button className="submit-btn" type="submit">Submit Quotation</button>
              </form>
            )}
          </div>
          <div className="order-actions">
          <button onClick={handleBackButton} className="back-button">
            Back
          </button>
          <button onClick={handleSignContract} className="contract-button">
            Sign Contract
          </button>
        </div>
        </section>
      )}
      {activeSection === "statistics" && <Statistics />}

      {activeSection === "balance" && <Balance />}

      {activeSection === "helpSupport" && <HelpSupport />}
      </div>
      
    </div>
  );
}

export default HomeConstructor;
