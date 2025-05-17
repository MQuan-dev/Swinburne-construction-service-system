"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { motion, AnimatePresence } from "framer-motion"
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Card,
  CardContent,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  Grid,
  DialogContentText,
  DialogActions,
} from "@mui/material"
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material"

// CSS import
import "../../css/HomeOperator.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")

// Animation variants
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

const HomeOperator = () => {
  const theme = useTheme()
  const [orders, setOrders] = useState([])
  const [contracts, setContracts] = useState({})
  const [pendingConstructors, setPendingConstructors] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingConstructors, setLoadingConstructors] = useState(true)
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [approving, setApproving] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [openContractDialog, setOpenContractDialog] = useState(false)
  const [openCancelDialog, setOpenCancelDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [activeSection, setActiveSection] = useState("constructors") // Default to constructors as shown in screenshot
  const [refreshKey, setRefreshKey] = useState(0)

  // Function to refresh data
  const refreshData = () => {
    setRefreshKey((prev) => prev + 1)
    setLoadingOrders(true)
    setLoadingConstructors(true)
  }

  // Fetch orders list
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/orders/orders-list/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => setOrders(response.data || []))
      .catch(() => console.error("❌ Failed to fetch orders."))
      .finally(() => setLoadingOrders(false))
  }, [refreshKey])

  // Fetch pending constructors list
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/v1/user/pending-constructors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => setPendingConstructors(response.data || []))
      .catch(() => console.error("❌ Failed to fetch pending constructors."))
      .finally(() => setLoadingConstructors(false))
  }, [refreshKey])

  // Approve Contract
  const handleApproveContract = async (orderId) => {
    setApproving(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/orders/orders-list/${orderId}/contracts/approve/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )

      // Show notification from API
      alert(response.data.message || "Contract Approved!")

      // Get order status from API
      const updatedOrderStatus = response.data.order_status

      // Update UI with new status from API
      setOrders((prevOrders) =>
        prevOrders.map((order) => (order.id === orderId ? { ...order, status: updatedOrderStatus } : order)),
      )

      // Refresh contracts data
      if (selectedOrderId === orderId) {
        handleViewContract(orderId)
      }
    } catch (error) {
      console.error("❌ Failed to approve contract:", error)

      // Show specific error from API
      if (error.response) {
        alert(error.response.data.error || "❌ Failed to approve contract.")
      } else {
        alert("❌ Network error. Please try again.")
      }
    } finally {
      setApproving(false)
    }
  }

  // Cancel Contract
  const handleCancelContract = async () => {
    if (!selectedOrderId) return

    setCancelling(true)
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/orders/orders-list/${selectedOrderId}/contracts/cancel/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )

      // Show notification from API
      alert(response.data.message || "Contracts cancelled successfully. Both parties must resubmit their contracts.")

      // Close the cancel confirmation dialog
      setOpenCancelDialog(false)

      // Refresh contracts data
      handleViewContract(selectedOrderId)

      // Refresh orders list to update status
      refreshData()
    } catch (error) {
      console.error("❌ Failed to cancel contracts:", error)

      // Show specific error from API
      if (error.response) {
        alert(error.response.data.error || "❌ Failed to cancel contracts.")
      } else {
        alert("❌ Network error. Please try again.")
      }
    } finally {
      setCancelling(false)
    }
  }

  // Open Cancel Dialog
  const openCancelConfirmation = (orderId) => {
    setSelectedOrderId(orderId)
    setOpenCancelDialog(true)
  }

  // Approve Constructor
  const handleApproveConstructor = async (id) => {
    if (!window.confirm("Are you sure you want to approve this constructor?")) return
    try {
      await axios.patch(
        `${API_BASE_URL}/api/v1/user/approve-constructor/${id}/`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        },
      )
      setPendingConstructors((prev) => prev.filter((constructor) => constructor.id !== id))
    } catch (error) {
      console.error("❌ Failed to approve constructor:", error)
      alert("❌ Failed to approve constructor.")
    }
  }

  // View Contracts
  const handleViewContract = async (orderId) => {
    setLoadingContracts(true)
    setSelectedOrderId(orderId)
    setOpenContractDialog(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/orders/orders-list/${orderId}/contracts/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      setContracts((prev) => ({
        ...prev,
        [orderId]: response.data,
      }))
    } catch (error) {
      console.error("❌ Failed to fetch contracts:", error)
      alert("❌ Failed to fetch contracts.")
    } finally {
      setLoadingContracts(false)
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "constructor_selected":
        return theme.palette.warning.main
      case "in_progress":
        return theme.palette.info.main
      case "completed":
        return theme.palette.success.main
      case "cancelled":
        return theme.palette.error.main
      default:
        return theme.palette.grey[500]
    }
  }

  // Check if both contracts exist and can be cancelled
  const canCancelContracts = (orderId) => {
    if (!contracts[orderId]) return false

    const userContract = contracts[orderId]?.user_contract
    const constructorContract = contracts[orderId]?.constructor_contract

    // Only show cancel button if both contracts exist and neither is approved
    return (
      userContract &&
      constructorContract &&
      userContract.status !== "approved" &&
      constructorContract.status !== "approved"
    )
  }

  // Sidebar menu component
  const SidebarMenu = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card
        variant="outlined"
        sx={{
          height: "100%",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box
            className="drawer-header"
            sx={{
              padding: "16px",
              background: "#1976d2", // Match the blue color from the screenshot
              color: "white",
            }}
          >
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: "bold" }}
              className="operator-dashboard-title"
            >
              Operator Dashboard
            </Typography>
          </Box>
          <Divider />
          <List sx={{ py: 1 }}>
            <ListItem disablePadding>
              <ListItemButton
                selected={activeSection === "orders"}
                onClick={() => setActiveSection("orders")}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <AssignmentIcon sx={{ mr: 2 }} />
                <ListItemText primary="Manage Orders" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                selected={activeSection === "constructors"}
                onClick={() => setActiveSection("constructors")}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  "&.Mui-selected": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  },
                }}
              >
                <PersonIcon sx={{ mr: 2 }} />
                <ListItemText primary="Pending Constructors" />
              </ListItemButton>
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        minHeight: "100vh",
        background: alpha(theme.palette.background.default, 0.8),
      }}
      className="home-container"
    >
      <Grid container spacing={2}>
        {/* Sidebar */}
        <Grid item xs={12} md={3} lg={2}>
          <SidebarMenu />
        </Grid>

        {/* Main content */}
        <Grid item xs={12} md={9} lg={10}>
          <motion.div key={activeSection} initial="hidden" animate="visible" variants={fadeIn}>
            {/* Header with title and refresh button */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                pb: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                }}
              >
                {activeSection === "orders" ? "Manage Orders" : "Pending Constructors"}
              </Typography>

              <Tooltip title="Refresh data">
                <IconButton
                  onClick={refreshData}
                  color="primary"
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Orders section */}
            <AnimatePresence mode="wait">
              {activeSection === "orders" && (
                <motion.div key="orders" initial="hidden" animate="visible" exit="hidden" variants={fadeIn}>
                  <Card
                    sx={{
                      overflow: "hidden",
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    <TableContainer component={Paper} elevation={0} className="mobile-card-view">
                      <Table>
                        <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Constructor</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadingOrders ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                <CircularProgress size={40} />
                              </TableCell>
                            </TableRow>
                          ) : orders.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} align="center" className="empty-message" sx={{ py: 5 }}>
                                <Typography variant="body1" color="textSecondary">
                                  No orders found
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            orders.map((order, index) => (
                              <TableRow
                                key={order.id}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                  },
                                }}
                              >
                                <TableCell data-label="ID">{order.id}</TableCell>
                                <TableCell data-label="Title" sx={{ fontWeight: 500 }}>
                                  {order.title}
                                </TableCell>
                                <TableCell data-label="Status">
                                  <Chip
                                    label={order.status.replace(/_/g, " ")}
                                    size="small"
                                    sx={{
                                      backgroundColor: alpha(getStatusColor(order.status), 0.1),
                                      color: getStatusColor(order.status),
                                      fontWeight: 500,
                                      textTransform: "capitalize",
                                    }}
                                  />
                                </TableCell>
                                <TableCell data-label="User">
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        mr: 1,
                                        bgcolor: theme.palette.primary.main,
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {(order.user_username || "NA").charAt(0).toUpperCase()}
                                    </Avatar>
                                    {order.user_username || "N/A"}
                                  </Box>
                                </TableCell>
                                <TableCell data-label="Constructor">
                                  <Box sx={{ display: "flex", alignItems: "center" }}>
                                    <Avatar
                                      sx={{
                                        width: 24,
                                        height: 24,
                                        mr: 1,
                                        bgcolor: theme.palette.secondary.main,
                                        fontSize: "0.8rem",
                                      }}
                                    >
                                      {(order.constructor_username || "NA").charAt(0).toUpperCase()}
                                    </Avatar>
                                    {order.constructor_username || "N/A"}
                                  </Box>
                                </TableCell>
                                <TableCell data-label="Actions">
                                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                    {order.status === "constructor_selected" && (
                                      <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleApproveContract(order.id)}
                                        disabled={approving}
                                        className="action-button"
                                        startIcon={<CheckCircleIcon />}
                                        sx={{
                                          borderRadius: "8px",
                                          textTransform: "none",
                                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        }}
                                      >
                                        {approving ? "Approving..." : "Confirm Contract"}
                                      </Button>
                                    )}
                                    <Button
                                      variant="outlined"
                                      color="primary"
                                      onClick={() => handleViewContract(order.id)}
                                      className="action-button"
                                      startIcon={<VisibilityIcon />}
                                      sx={{
                                        borderRadius: "8px",
                                        textTransform: "none",
                                      }}
                                    >
                                      View Contracts
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </motion.div>
              )}

              {/* Constructors section */}
              {activeSection === "constructors" && (
                <motion.div key="constructors" initial="hidden" animate="visible" exit="hidden" variants={fadeIn}>
                  <Card
                    sx={{
                      overflow: "hidden",
                      borderRadius: 2,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    }}
                  >
                    <TableContainer component={Paper} elevation={0} className="mobile-card-view">
                      <Table>
                        <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Username</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Tax Code</TableCell>
                            <TableCell sx={{ fontWeight: "bold" }}>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {loadingConstructors ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                                <CircularProgress size={40} />
                              </TableCell>
                            </TableRow>
                          ) : pendingConstructors.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} align="center" className="empty-message" sx={{ py: 5 }}>
                                <Typography variant="body1" color="textSecondary">
                                  No pending constructors found
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            pendingConstructors.map((constructor, index) => (
                              <TableRow
                                key={constructor.id}
                                sx={{
                                  "&:hover": {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.04),
                                  },
                                }}
                              >
                                <TableCell data-label="ID">{constructor.id}</TableCell>
                                <TableCell data-label="Username" sx={{ fontWeight: 500 }}>
                                  {constructor.username}
                                </TableCell>
                                <TableCell data-label="Email">{constructor.email}</TableCell>
                                <TableCell data-label="Tax Code">{constructor.tax_code}</TableCell>
                                <TableCell data-label="Actions">
                                  <Button
                                    variant="contained"
                                    color="success"
                                    onClick={() => handleApproveConstructor(constructor.id)}
                                    className="action-button"
                                    startIcon={<CheckCircleIcon />}
                                    sx={{
                                      borderRadius: "8px",
                                      textTransform: "none",
                                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    }}
                                  >
                                    Approve
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Grid>
      </Grid>

      {/* Contract Dialog */}
      <Dialog
        open={openContractDialog}
        onClose={() => setOpenContractDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: "100%",
            maxWidth: "1000px", // Make it much wider
            margin: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <Box sx={{ width: "100%" }}>
          {/* Blue header */}
          <Box
            sx={{
              backgroundColor: "#1976d2",
              color: "white",
              py: 2,
              textAlign: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            Contracts for Order #{selectedOrderId}
          </Box>

          {/* Content area with white background */}
          <Box sx={{ p: 4, bgcolor: "white" }}>
            {loadingContracts ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : contracts[selectedOrderId] ? (
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={4} justifyContent="center">
                  {["user_contract", "constructor_contract"].map((type) => {
                    const contract = contracts[selectedOrderId]?.[type]
                    if (!contract) return null
                    return (
                      <Grid item xs={12} sm={6} key={type}>
                        <Card
                          variant="outlined"
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            boxShadow: "none",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Box sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                            <Typography
                              color="primary"
                              sx={{
                                mb: 3,
                                textAlign: "center",
                                fontWeight: 500,
                                fontSize: "1.25rem",
                              }}
                            >
                              {type === "user_contract" ? "User Contract" : "Constructor Contract"}
                            </Typography>

                            <Box sx={{ mb: 3 }}>
                              <Box sx={{ display: "flex", mb: 2 }}>
                                <Typography sx={{ width: "80px", color: "text.secondary" }}>Status:</Typography>
                                <Typography
                                  sx={{
                                    color:
                                      contract.status === "approved"
                                        ? "#4caf50"
                                        : contract.status === "cancelled"
                                          ? "#f44336"
                                          : "text.primary",
                                    fontWeight: 600,
                                  }}
                                >
                                  {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                                </Typography>
                              </Box>

                              <Box sx={{ display: "flex", mb: 2 }}>
                                <Typography sx={{ width: "80px", color: "text.secondary" }}>Money:</Typography>
                                <Typography>${contract.contract_money}</Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  flexDirection: "column",
                                  alignItems: "flex-end",
                                  mb: 2,
                                }}
                              >
                                <Typography sx={{ color: "text.secondary" }}>
                                  {new Date(contract.uploaded_date).toLocaleDateString()}
                                </Typography>
                                <Typography sx={{ color: "text.secondary" }}>
                                  Uploaded:{" "}
                                  {new Date(contract.uploaded_date).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                    hour12: true,
                                  })}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ mt: "auto", display: "flex", justifyContent: "center" }}>
                              <Button
                                variant="contained"
                                href={`${API_BASE_URL}${contract.contract_file}`}
                                target="_blank"
                                startIcon={<VisibilityIcon />}
                                sx={{
                                  borderRadius: "4px",
                                  textTransform: "none",
                                  py: 1.5,
                                  px: 3,
                                  width: "auto",
                                  minWidth: "140px",
                                  backgroundColor: "#1976d2",
                                }}
                              >
                                View Contract
                              </Button>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>

                {/* Action buttons */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 4, gap: 2 }}>
                  {canCancelContracts(selectedOrderId) && (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => openCancelConfirmation(selectedOrderId)}
                      startIcon={<CancelIcon />}
                      sx={{
                        borderRadius: "4px",
                        py: 1,
                        px: 3,
                        backgroundColor: "#f44336",
                      }}
                    >
                      Cancel Contracts
                    </Button>
                  )}
                </Box>
              </Box>
            ) : (
              <Typography align="center" sx={{ py: 4, color: "text.secondary" }}>
                No contracts available for this order.
              </Typography>
            )}

            {/* Close button */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                onClick={() => setOpenContractDialog(false)}
                variant="contained"
                sx={{
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  minWidth: "120px",
                  py: 1,
                  px: 4,
                  backgroundColor: "#1976d2",
                  fontWeight: "bold",
                }}
              >
                CLOSE
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: "100%",
            maxWidth: "500px",
            margin: "16px",
          },
        }}
      >
        <Box
          sx={{
            backgroundColor: "#f44336",
            color: "white",
            py: 2,
            textAlign: "center",
            fontSize: "1.25rem",
            fontWeight: "bold",
          }}
        >
          Cancel Contracts
        </Box>
        <Box sx={{ p: 3 }}>
          <DialogContentText>
            Are you sure you want to cancel both the user and constructor contracts for Order #{selectedOrderId}?
            <br />
            <br />
            When cancelled, both the customer and constructor must resubmit their contracts. Only when the contracts are
            later approved can the order proceed to the next step.
          </DialogContentText>
          <DialogActions sx={{ mt: 3, justifyContent: "center", gap: 2 }}>
            <Button
              onClick={() => setOpenCancelDialog(false)}
              variant="outlined"
              sx={{ borderRadius: "4px", minWidth: "100px" }}
            >
              No, Keep Contracts
            </Button>
            <Button
              onClick={handleCancelContract}
              variant="contained"
              color="error"
              disabled={cancelling}
              sx={{
                borderRadius: "4px",
                minWidth: "100px",
                backgroundColor: "#f44336",
              }}
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel Contracts"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  )
}

export default HomeOperator

