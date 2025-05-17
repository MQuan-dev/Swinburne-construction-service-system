"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import "../../css/UserProfile.css"
import { FaStar, FaRegStar, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa"

function UserProfile() {
  const [user, setUser] = useState({
    name: "",
    rating: "0",
    role: "",
    email: "",
    bio: "Loading profile information...",
    phone: "",
    location: "USA",
    avatar: "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg",
    social: { facebook: "#", twitter: "#", instagram: "#" },
  })

  const [settings, setSettings] = useState({
    emailFollow: true,
    emailPostReply: false,
    emailMention: true,
    newProjects: false,
    productUpdates: true,
    newsletter: false,
  })

  const [completedOrders, setCompletedOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const userData = response.data.data

        // Update user state with API data
        setUser({
          name: `${userData.first_name} ${userData.last_name}`,
          rating: userData.average_rating || "0",
          role: userData.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "",
          email: userData.email,
          bio: `Hi, I'm ${userData.first_name} ${userData.last_name}.`,
          phone: userData.phone_number || "Not provided",
          location: "USA", // Default or you can add location to your API
          avatar: "https://img.freepik.com/free-vector/smiling-young-man-illustration_1308-174669.jpg", // Default avatar
          social: { facebook: "#", twitter: "#", instagram: "#" },
          completed_orders_count: userData.completed_orders_count,
          username: userData.username,
          tax_code: userData.tax_code,
          company_name: userData.company_name,
          account_status: userData.account_status,
        })

        setLoading(false)
      } catch (error) {
        console.error("Error fetching user profile:", error)
        setError("Failed to load user profile. Please try again later.")
        setLoading(false)
      }
    }

    const fetchCompletedOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/completed-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        setCompletedOrders(response.data)
        setOrdersLoading(false)
      } catch (error) {
        console.error("Error fetching completed orders:", error)
        setOrdersLoading(false)
      }
    }

    fetchUserProfile()
    fetchCompletedOrders()
  }, [navigate])

  const handleToggle = (setting) => {
    setSettings({ ...settings, [setting]: !settings[setting] })
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const month = date.toLocaleString("en-US", { month: "long" })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  const handleOrderClick = (orderId) => {
    navigate(`/view-contract/${orderId}`)
  }

  if (loading) {
    return <div className="loading-container">Loading profile data...</div>
  }

  if (error) {
    return <div className="error-container">{error}</div>
  }

  return (
    <div className="user-profile-container">
      <div className="sidebar-profile">
        <div className="user-info">
          <img src={user.avatar || "/placeholder.svg"} alt={user.name} className="avatar" />
          <h2>{user.name}</h2>
          <p className="role">{user.role}</p>
          <div className="user-stats">
            <div className="rating-container">
              <span className="star-rating">
                {[...Array(5)].map((_, index) =>
                  index < Math.floor(user.rating) ? <FaStar key={index} /> : <FaRegStar key={index} />,
                )}
              </span>
              <span className="rating-value">{user.rating}</span>
            </div>
          </div>
        </div>
        <div className="settings">
          <h3>Platform Settings</h3>
          <div className="setting-group">
            <h4>ACCOUNT</h4>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.emailFollow}
                onChange={() => handleToggle("emailFollow")}
              />
              Email me when someone follows me
            </label>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.emailPostReply}
                onChange={() => handleToggle("emailPostReply")}
              />
              Email me when someone answers my post
            </label>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.emailMention}
                onChange={() => handleToggle("emailMention")}
              />
              Email me when someone mentions me
            </label>
          </div>
          <div className="setting-group">
            <h4>APPLICATION</h4>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.newProjects}
                onChange={() => handleToggle("newProjects")}
              />
              New launches and projects
            </label>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.productUpdates}
                onChange={() => handleToggle("productUpdates")}
              />
              Monthly product updates
            </label>
            <label>
              <input
                className="check-platform"
                type="checkbox"
                checked={settings.newsletter}
                onChange={() => handleToggle("newsletter")}
              />
              Subscribe to newsletter
            </label>
          </div>
        </div>
      </div>
      <div className="main-content">
        <div className="profile-info">
          <h3>Profile Information</h3>
          <p>{user.bio}</p>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Full Name:</strong> {user.name}
          </p>
          <p>
            <strong>Mobile:</strong> {user.phone}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          {user.tax_code && (
            <p>
              <strong>Tax Code:</strong> {user.tax_code}
            </p>
          )}
          {user.company_name && (
            <p>
              <strong>Company:</strong> {user.company_name}
            </p>
          )}
          <p>
            <strong>Completed Orders:</strong> {user.completed_orders_count}
          </p>
          <p className="social-links">
            <strong>Social:</strong>
            <a href={user.social.facebook} className="social-icon facebook">
              <FaFacebook />
            </a>
            <a href={user.social.twitter} className="social-icon twitter">
              <FaTwitter />
            </a>
            <a href={user.social.instagram} className="social-icon instagram">
              <FaInstagram />
            </a>
          </p>
        </div>

        <div className="orders-completed">
          <h3>Completed Orders</h3>
          {ordersLoading ? (
            <p>Loading completed orders...</p>
          ) : completedOrders.length > 0 ? (
            <ul>
              {completedOrders.map((order) => (
                <li key={order.id} className="order-item" onClick={() => handleOrderClick(order.id)}>
                  <strong>Order #{order.id}</strong> - {formatDate(order.updated_at)}
                  <span className="order-status">COMPLETED</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No completed orders yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile

