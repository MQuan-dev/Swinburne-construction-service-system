"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
} from "@mui/material"
import { Search, PersonRemove, Warning, CheckCircle, Person, AttachMoney, Add } from "@mui/icons-material"
import { motion, AnimatePresence } from "framer-motion"
import "../../css/OperatorList.css"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000/api/v1"

// Wrap Material UI components with motion
const MotionCard = motion(Card)
const MotionTableRow = motion(TableRow)
const MotionAlert = motion(Alert)

const OperatorList = () => {
  // Tab state
  const [tabValue, setTabValue] = useState(0)

  // Operators state
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState({
    operators: true,
    constructors: true,
    users: true,
  })
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(null)

  // Users state
  const [constructorUsers, setConstructorUsers] = useState([])
  const [regularUsers, setRegularUsers] = useState([])
  const [addCoinSuccess, setAddCoinSuccess] = useState("")
  const [addCoinLoading, setAddCoinLoading] = useState(null)

  // Add coin dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [coinAmount, setCoinAmount] = useState("")

  useEffect(() => {
    if (tabValue === 0) {
      fetchOperators()
    } else if (tabValue === 1) {
      fetchConstructorUsers()
    } else if (tabValue === 2) {
      fetchRegularUsers()
    }
  }, [tabValue])

  const fetchOperators = () => {
    setLoading((prev) => ({ ...prev, operators: true }))
    axios
      .get(`${API_BASE_URL}/user/operators`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        setOperators(response.data)
        setError("")
      })
      .catch(() => {
        setError("❌ Failed to fetch operators. Please check your connection and try again.")
      })
      .finally(() => setLoading((prev) => ({ ...prev, operators: false })))
  }

  const fetchConstructorUsers = () => {
    setLoading((prev) => ({ ...prev, constructors: true }))
    axios
      .get(`${API_BASE_URL}/user/users/constructor/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        setConstructorUsers(response.data.users || [])
        setError("")
      })
      .catch(() => {
        setError("❌ Failed to fetch constructor users. Please check your connection and try again.")
      })
      .finally(() => setLoading((prev) => ({ ...prev, constructors: false })))
  }

  const fetchRegularUsers = () => {
    setLoading((prev) => ({ ...prev, users: true }))
    axios
      .get(`${API_BASE_URL}/user/users/customer/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        setRegularUsers(response.data.users || [])
        setError("")
      })
      .catch(() => {
        setError("❌ Failed to fetch regular users. Please check your connection and try again.")
      })
      .finally(() => setLoading((prev) => ({ ...prev, users: false })))
  }

  const handleDelete = (id) => {
    if (!window.confirm("⚠ Are you sure you want to delete this operator?")) return

    setDeleteLoading(id)
    axios
      .delete(`${API_BASE_URL}/user/operators/${id}/delete`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then(() => {
        setOperators((prev) => prev.filter((op) => op.id !== id))
        setDeleteSuccess("Operator deleted successfully!")
        setTimeout(() => setDeleteSuccess(""), 3000)
      })
      .catch(() => {
        setError("❌ Failed to delete operator. Please try again.")
      })
      .finally(() => setDeleteLoading(null))
  }

  const handleOpenAddCoinDialog = (user) => {
    setSelectedUser(user)
    setDialogOpen(true)
    setCoinAmount("")
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setSelectedUser(null)
  }

  const handleAddCoin = () => {
    if (!selectedUser || !coinAmount || isNaN(Number(coinAmount))) {
      setError("Please enter a valid coin amount")
      return
    }

    setAddCoinLoading(selectedUser.id)
    axios
      .post(
        `${API_BASE_URL}/user/add-coin/${selectedUser.id}/`,
        { amount: Number(coinAmount) },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        },
      )
      .then(() => {
        setAddCoinSuccess(`Successfully added ${coinAmount} coins to user ${selectedUser.name}!`)
        setTimeout(() => setAddCoinSuccess(""), 3000)
        handleCloseDialog()
      })
      .catch((error) => {
        console.error("Error adding coins:", error)
        setError("❌ Failed to add coins. Please try again.")
      })
      .finally(() => setAddCoinLoading(null))
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
    setSearchTerm("")
    setError("")
  }

  // Filter operators by search term
  const filteredOperators = operators.filter(
    (op) =>
      op.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Filter users by search term
  const filteredConstructorUsers = constructorUsers.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredRegularUsers = regularUsers.filter((user) =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
    exit: {
      opacity: 0,
      x: -100,
      transition: {
        duration: 0.3,
      },
    },
  }

  return (
    <motion.div
      className="operator-list-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MotionCard
        className="operator-card-list"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <CardContent className="card-content-list">
          <motion.div
            className="header-container"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Typography variant="h4" className="operator-title">
              <Person className="title-icon" />
              Manage Users
            </Typography>
          </motion.div>

          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="user management tabs" className="user-tabs">
              <Tab label="Operators" />
              <Tab label="Constructor Users" />
              <Tab label="Regular Users" />
            </Tabs>
          </Box>

          <AnimatePresence>
            {error && (
              <MotionAlert
                severity="error"
                className="operator-alert error-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert-content">
                  <Warning className="alert-icon" />
                  {error}
                </div>
              </MotionAlert>
            )}

            {deleteSuccess && (
              <MotionAlert
                severity="success"
                className="operator-alert success-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert-content">
                  <CheckCircle className="alert-icon" />
                  {deleteSuccess}
                </div>
              </MotionAlert>
            )}

            {addCoinSuccess && (
              <MotionAlert
                severity="success"
                className="operator-alert success-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="alert-content">
                  <CheckCircle className="alert-icon" />
                  {addCoinSuccess}
                </div>
              </MotionAlert>
            )}
          </AnimatePresence>

          <motion.div
            className="search-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <TextField
              label={tabValue === 0 ? "Search Operator" : "Search User"}
              variant="outlined"
              fullWidth
              className="operator-search"
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="search-icon" />
                  </InputAdornment>
                ),
              }}
              placeholder={tabValue === 0 ? "Search by username or email" : "Search by name"}
            />
          </motion.div>

          {/* Operators Tab */}
          {tabValue === 0 &&
            (loading.operators ? (
              <motion.div
                className="loading-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CircularProgress className="loading-spinner" />
                <Typography className="loading-text">Loading operators...</Typography>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="table-wrapper">
                <TableContainer component={Paper} className="operator-table-container">
                  <Table className="operator-table">
                    <TableHead>
                      <TableRow className="table-header-row">
                        <TableCell className="table-header-cell">ID</TableCell>
                        <TableCell className="table-header-cell">Username</TableCell>
                        <TableCell className="table-header-cell">Email</TableCell>
                        <TableCell className="table-header-cell actions-cell">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {filteredOperators.length > 0 ? (
                          filteredOperators.map((operator) => (
                            <MotionTableRow
                              key={operator.id}
                              className="table-row"
                              variants={itemVariants}
                              exit="exit"
                              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
                            >
                              <TableCell className="table-cell id-cell">{operator.id}</TableCell>
                              <TableCell className="table-cell username-cell">{operator.username}</TableCell>
                              <TableCell className="table-cell email-cell">{operator.email}</TableCell>
                              <TableCell className="table-cell actions-cell">
                                <Tooltip title="Delete Operator" arrow>
                                  <span>
                                    <IconButton
                                      color="error"
                                      className="delete-button"
                                      onClick={() => handleDelete(operator.id)}
                                      disabled={deleteLoading === operator.id}
                                    >
                                      {deleteLoading === operator.id ? (
                                        <CircularProgress size={24} className="delete-loading" />
                                      ) : (
                                        <PersonRemove />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </MotionTableRow>
                          ))
                        ) : (
                          <MotionTableRow variants={itemVariants} className="empty-row">
                            <TableCell colSpan={4} className="no-operators">
                              {searchTerm ? "No operators match your search" : "No operators available"}
                            </TableCell>
                          </MotionTableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </TableContainer>
              </motion.div>
            ))}

          {/* Constructor Users Tab */}
          {tabValue === 1 &&
            (loading.constructors ? (
              <motion.div
                className="loading-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CircularProgress className="loading-spinner" />
                <Typography className="loading-text">Loading constructor users...</Typography>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="table-wrapper">
                <TableContainer component={Paper} className="operator-table-container">
                  <Table className="operator-table">
                    <TableHead>
                      <TableRow className="table-header-row">
                        <TableCell className="table-header-cell">ID</TableCell>
                        <TableCell className="table-header-cell">Name</TableCell>
                        <TableCell className="table-header-cell actions-cell">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {filteredConstructorUsers.length > 0 ? (
                          filteredConstructorUsers.map((user) => (
                            <MotionTableRow
                              key={user.id}
                              className="table-row"
                              variants={itemVariants}
                              exit="exit"
                              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
                            >
                              <TableCell className="table-cell id-cell">{user.id}</TableCell>
                              <TableCell className="table-cell name-cell">{user.name}</TableCell>
                              <TableCell className="table-cell actions-cell">
                                <Tooltip title="Add Coins" arrow>
                                  <span>
                                    <IconButton
                                      color="primary"
                                      className="add-coin-button"
                                      onClick={() => handleOpenAddCoinDialog(user)}
                                      disabled={addCoinLoading === user.id}
                                    >
                                      {addCoinLoading === user.id ? (
                                        <CircularProgress size={24} className="add-coin-loading" />
                                      ) : (
                                        <AttachMoney />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </MotionTableRow>
                          ))
                        ) : (
                          <MotionTableRow variants={itemVariants} className="empty-row">
                            <TableCell colSpan={3} className="no-operators">
                              {searchTerm ? "No constructor users match your search" : "No constructor users available"}
                            </TableCell>
                          </MotionTableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </TableContainer>
              </motion.div>
            ))}

          {/* Regular Users Tab */}
          {tabValue === 2 &&
            (loading.users ? (
              <motion.div
                className="loading-container"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CircularProgress className="loading-spinner" />
                <Typography className="loading-text">Loading regular users...</Typography>
              </motion.div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="table-wrapper">
                <TableContainer component={Paper} className="operator-table-container">
                  <Table className="operator-table">
                    <TableHead>
                      <TableRow className="table-header-row">
                        <TableCell className="table-header-cell">ID</TableCell>
                        <TableCell className="table-header-cell">Name</TableCell>
                        <TableCell className="table-header-cell actions-cell">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <AnimatePresence>
                        {filteredRegularUsers.length > 0 ? (
                          filteredRegularUsers.map((user) => (
                            <MotionTableRow
                              key={user.id}
                              className="table-row"
                              variants={itemVariants}
                              exit="exit"
                              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.04)" }}
                            >
                              <TableCell className="table-cell id-cell">{user.id}</TableCell>
                              <TableCell className="table-cell name-cell">{user.name}</TableCell>
                              <TableCell className="table-cell actions-cell">
                                <Tooltip title="Add Coins" arrow>
                                  <span>
                                    <IconButton
                                      color="primary"
                                      className="add-coin-button"
                                      onClick={() => handleOpenAddCoinDialog(user)}
                                      disabled={addCoinLoading === user.id}
                                    >
                                      {addCoinLoading === user.id ? (
                                        <CircularProgress size={24} className="add-coin-loading" />
                                      ) : (
                                        <AttachMoney />
                                      )}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </MotionTableRow>
                          ))
                        ) : (
                          <MotionTableRow variants={itemVariants} className="empty-row">
                            <TableCell colSpan={3} className="no-operators">
                              {searchTerm ? "No regular users match your search" : "No regular users available"}
                            </TableCell>
                          </MotionTableRow>
                        )}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </TableContainer>
              </motion.div>
            ))}
        </CardContent>
      </MotionCard>

      {/* Add Coin Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} className="add-coin-dialog">
        <DialogTitle className="dialog-title">Add Coins to User</DialogTitle>
        <DialogContent className="dialog-content">
          <Typography variant="body1" className="dialog-user-info">
            User: <strong>{selectedUser?.name}</strong> (ID: {selectedUser?.id})
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Coin Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value)}
            className="coin-amount-input"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AttachMoney className="coin-icon" />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={handleCloseDialog} color="inherit" className="cancel-button">
            Cancel
          </Button>
          <Button
            onClick={handleAddCoin}
            color="primary"
            variant="contained"
            className="add-button"
            disabled={!coinAmount || isNaN(Number(coinAmount)) || addCoinLoading}
          >
            {addCoinLoading ? (
              <>
                <CircularProgress size={20} className="button-loading" />
                Adding...
              </>
            ) : (
              <>
                <Add className="button-icon" />
                Add Coins
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  )
}

export default OperatorList

