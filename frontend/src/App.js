"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, Navigate, Link } from "react-router-dom"
import axios from "axios"

import About from "./components/About"
import Services from "./components/Services"
import Contact from "./components/Contact"
import Login from "./components/Login"
import Register from "./components/register"
import HomeCustomer from "./components/Customer/HomeCustomer"
import HomeConstructor from "./components/Constructor/HomeConstructor"
import HomeAdmin from "./components/Admin/HomeAdmin"
import HomeOperator from "./components/Operator/HomeOperator" // Đảm bảo import không có lỗi
import AccountSettings from "./components/AccountSettings"
import MainBackground from "./components/MainBackground"
import CategoryList from "./components/Admin/CategoryList"
import CategoryForm from "./components/Admin/CategoryForm"
import CategoryUpdate from "./components/Admin/CategoryUpdate"
import OperatorList from "./components/Admin/OperatorList" // ✅ Danh sách Operator
import OperatorForm from "./components/Admin/OperatorForm" // ✅ Tạo Operator
import MobileNavToggle from "./components/MobileNavToggle"
import ChangePassword from "./components/ChangePassword"
import ViewContract from "./components/Customer/ViewContract"
import ViewContractConstructor from "./components/Constructor/ViewContractConstructor"
import Footer from "./components/Footer"

import "./css/App.css"
import "./css/about.css"
import "./css/contact.css"
import "./css/home.css"
import "./css/service.css"
import "./css/banner.css"
import "./css/footer.css"
import "./css/CategoryForm.css"
import "./css/CategoryList.css"
import "./css/CategoryUpdate.css"
import "./css/OperatorList.css" // ✅ Thêm CSS cho quản lý Operator
import "./css/OperatorForm.css" // ✅ Thêm CSS cho form Operator
import "./css/enhanced-main.css"
import "./css/mobile-nav.css"

const App = () => {
  const [categories, setCategories] = useState([]) // Quản lý danh sách danh mục
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState("")
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [coinBalance, setCoinBalance] = useState(null)

  useEffect(() => {
    if (isAuthenticated) {
      const token = localStorage.getItem("accessToken")
      fetchUserProfile(token)
    } else {
      setCoinBalance(null) // Reset coin balance when logged out
    }
  }, [isAuthenticated]) // Depend on `isAuthenticated` to re-run when login/logout occurs

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("role")
    const savedUsername = localStorage.getItem("username")

    console.log("🔍 Kiểm tra localStorage:", { token, role, savedUsername })

    if (token && role) {
      setIsAuthenticated(true)
      setUserRole(role)
      setUsername(savedUsername)
      setIsLoading(false)
      fetchUserProfile(token) // Fetch user profile to get coin balance
    } else {
      setIsLoading(false)
    }
  }, [])
  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/user/profile/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCoinBalance(response.data.data.coin_balance) // Set the coin_balance from the API
    } catch (error) {
      console.error("Error fetching user profile:", error)
    } finally {
      setIsLoading(false)
    }
  }
  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("role")
    localStorage.removeItem("username")
    setIsAuthenticated(false)
    setUserRole("")
    setUsername("")
  }

  const updateCategoryInList = (updatedCategory) => {
    setCategories((prevCategories) => {
      const updatedCategories = prevCategories.map((category) =>
        category.id === updatedCategory.id ? updatedCategory : category,
      )
      // Sắp xếp danh sách theo ID
      return updatedCategories.sort((a, b) => a.id - b.id)
    })
  }

  const getHomeRoute = () => {
    switch (userRole) {
      case "customer":
        return "/customer"
      case "constructor":
        return "/constructor"
      case "admin":
        return "/admin"
      case "operator":
        return "/operator" // ✅ Điều hướng đến HomeOperator
      default:
        return "/login"
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <div className="top-bar">
            <div className="logo">ConstructPro</div>

            {/* Desktop Navigation */}
            <nav className="navigation">
              <ul>
                {isAuthenticated && userRole === "admin" && (
                  <>
                    <li>
                      <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                    </li>
                    <li>
                      <Link to="/admin/categories">Manage Categories</Link>
                    </li>
                    <li>
                      <Link to="/admin/categories/new">Add Category</Link>
                    </li>
                    <li>
                      <Link to="/admin/operators">Manage Users</Link>
                    </li>
                    <li>
                      <Link to="/admin/operators/new">Add Operator</Link>
                    </li>
                  </>
                )}

                {isAuthenticated && userRole === "customer" && (
                  <>
                    <li>
                      <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/about" : "/login"}>About</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/services" : "/login"}>Services</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/contact" : "/login"}>Contact</Link>
                    </li>
                  </>
                )}
                {isAuthenticated && userRole === "constructor" && (
                  <>
                    <li>
                      <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/about" : "/login"}>About</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/services" : "/login"}>Services</Link>
                    </li>
                    <li>
                      <Link to={isAuthenticated ? "/contact" : "/login"}>Contact</Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>

            {/* Mobile Navigation */}
            <MobileNavToggle>
              <nav className="navigation">
                <ul>
                  {isAuthenticated && userRole === "admin" && (
                    <>
                      <li>
                        <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                      </li>
                      <li>
                        <Link to="/admin/categories">Manage Categories</Link>
                      </li>
                      <li>
                        <Link to="/admin/categories/new">Add Category</Link>
                      </li>
                      <li>
                        <Link to="/admin/operators">Manage Users</Link>
                      </li>
                      <li>
                        <Link to="/admin/operators/new">Add Operator</Link>
                      </li>
                    </>
                  )}

                  {isAuthenticated && userRole === "customer" && (
                    <>
                      <li>
                        <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/about" : "/login"}>About</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/services" : "/login"}>Services</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/contact" : "/login"}>Contact</Link>
                      </li>
                    </>
                  )}
                  {isAuthenticated && userRole === "constructor" && (
                    <>
                      <li>
                        <Link to={isAuthenticated ? getHomeRoute() : "/login"}>Home</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/about" : "/login"}>About</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/services" : "/login"}>Services</Link>
                      </li>
                      <li>
                        <Link to={isAuthenticated ? "/contact" : "/login"}>Contact</Link>
                      </li>
                    </>
                  )}
                </ul>
                <div className="mobile-auth-buttons">
                  <AuthButtons
                    isAuthenticated={isAuthenticated}
                    username={username}
                    handleLogout={handleLogout}
                    coinBalance={coinBalance}
                  />
                </div>
              </nav>
            </MobileNavToggle>

            {/* Desktop Auth Buttons */}
            <div className="desktop-auth-buttons">
              <AuthButtons
                isAuthenticated={isAuthenticated}
                username={username}
                handleLogout={handleLogout}
                coinBalance={coinBalance}
              />
            </div>
          </div>
        </header>

        <MainBackground>
          <Routes>
            <Route path="/view-contract/:orderId" element={<ViewContract />} />
            <Route path="/view-contract-constructor/:orderId" element={<ViewContractConstructor />} />
            <Route path="/settings" element={isAuthenticated ? <AccountSettings /> : <Navigate to="/login" />} />
            <Route path="/changepass" element={isAuthenticated ? <ChangePassword /> : <Navigate to="/login" />} />
            <Route
              path="/login"
              element={
                <Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} setUsername={setUsername} />
              }
            />
            <Route path="/signup" element={<Register />} />
            <Route
              path="/customer"
              element={isAuthenticated && userRole === "customer" ? <HomeCustomer /> : <Navigate to="/login" />}
            />
            <Route
              path="/constructor"
              element={isAuthenticated && userRole === "constructor" ? <HomeConstructor /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin"
              element={isAuthenticated && userRole === "admin" ? <HomeAdmin /> : <Navigate to="/login" />}
            />
            <Route
              path="/operator"
              element={isAuthenticated && userRole === "operator" ? <HomeOperator /> : <Navigate to="/login" />}
            />

            <Route path="/about" element={isAuthenticated ? <About /> : <Navigate to="/login" />} />
            <Route path="/services" element={isAuthenticated ? <Services /> : <Navigate to="/login" />} />
            <Route path="/contact" element={isAuthenticated ? <Contact /> : <Navigate to="/login" />} />
            <Route
              path="/admin/categories"
              element={
                isAuthenticated && userRole === "admin" ? (
                  <CategoryList categories={categories} setCategories={setCategories} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin/categories/new"
              element={isAuthenticated && userRole === "admin" ? <CategoryForm /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/categories/edit/:id"
              element={
                isAuthenticated && userRole === "admin" ? (
                  <CategoryUpdate updateCategoryInList={updateCategoryInList} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="/" element={<Navigate to={getHomeRoute()} />} />
            <Route path="/admin" element={<HomeAdmin categories={categories} />} />

            {/* ✅ Quản lý Operator */}
            <Route
              path="/admin/operators"
              element={isAuthenticated && userRole === "admin" ? <OperatorList /> : <Navigate to="/login" />}
            />
            <Route
              path="/admin/operators/new"
              element={isAuthenticated && userRole === "admin" ? <OperatorForm /> : <Navigate to="/login" />}
            />

            <Route
              path="/operator"
              element={isAuthenticated && userRole === "operator" ? <HomeOperator /> : <Navigate to="/login" />}
            />
          </Routes>
        </MainBackground>
        <Footer />
      </div>
    </Router>
  )
}

const AuthButtons = ({ isAuthenticated, username, handleLogout, coinBalance }) => (
  <div className="auth-buttons">
    {isAuthenticated ? (
      <>
        <div className="dropdown">
          <span className="username-display">Welcome, {username || "Guest"}</span>
          <span className="coins-display">🪙 {coinBalance}</span> {/* Display coin balance */}
          {/* Dropdown menu */}
          <div className="dropdown-content">
            <Link to="/settings" className="dropdown-link">
              Account Settings
            </Link>
            <Link to="/changepass" className="dropdown-link">
              Change password
            </Link>
            <Link to="/wallet" className="dropdown-link">
              My Wallet
            </Link>
            <Link to="/help" className="dropdown-link">
              Help & Support
            </Link>
            <Link to="/login" className="dropdown-link" onClick={handleLogout}>
              Log Out
            </Link>
          </div>
        </div>
      </>
    ) : (
      <>
        <Link to="/login" className="login-btn">
          <i className="fas fa-sign-in-alt"></i> Log In
        </Link>
        <Link to="/signup" className="register-btn">
          <i className="fas fa-user-plus"></i> Sign Up
        </Link>
      </>
    )}
  </div>
)

export default App

