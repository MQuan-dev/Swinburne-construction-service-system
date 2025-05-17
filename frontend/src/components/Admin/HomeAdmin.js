"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tabs,
  Tab,
  useTheme,
  TablePagination,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
} from "@mui/material"
import Grid from "@mui/material/Grid2"
import {
  AttachMoney,
  MonetizationOn,
  Person,
  Engineering,
  Refresh,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  CalendarToday,
  CalendarMonth,
  DateRange,
  FilterList,
  InsertChart,
  Savings,
} from "@mui/icons-material"
// Add the import for AdminChart at the top of the file with other imports
import AdminChart from "./AdminChart"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL.replace("/api/v1", "")

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    },
  },
}

const HomeAdmin = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const [contractData, setContractData] = useState({
    user_spending: [],
    constructor_income: [],
  })
  const [coinData, setCoinData] = useState([])
  const [loadingContract, setLoadingContract] = useState(true)
  const [loadingCoins, setLoadingCoins] = useState(true)
  const [errorContract, setErrorContract] = useState("")
  const [errorCoins, setErrorCoins] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [coinActiveTab, setCoinActiveTab] = useState(0)
  const [page, setPage] = useState(0)
  const [coinPage, setCoinPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 3 : 5)
  const [coinRowsPerPage, setCoinRowsPerPage] = useState(isMobile ? 3 : 5)
  const [summaryData, setSummaryData] = useState({
    totalUserSpending: 0,
    totalConstructorIncome: 0,
    totalIncomeCoin: 0,
    customerCoinsDeduction: 0,
    customerCoinsRefund: 0,
    constructorCoinsDeduction: 0,
    constructorCoinsRefund: 0,
  })

  // Add state for transaction type filter
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("ALL")

  // Thêm state cho Income và Order Count
  const [incomePeriod, setIncomePeriod] = useState("day")
  const [orderCountPeriod, setOrderCountPeriod] = useState("day")
  const [incomeData, setIncomeData] = useState([])
  const [orderCountData, setOrderCountData] = useState([])
  const [loadingIncome, setLoadingIncome] = useState(false)
  const [loadingOrderCount, setLoadingOrderCount] = useState(false)
  const [errorIncome, setErrorIncome] = useState("")
  const [errorOrderCount, setErrorOrderCount] = useState("")

  // Thêm state để lưu trữ thông tin role của người dùng
  const [userRoles, setUserRoles] = useState({})

  // Add state for view control
  const [currentView, setCurrentView] = useState("dashboard") // "dashboard" or "chart"

  // Fetch contract money history
  useEffect(() => {
    fetchContractData()
  }, [])

  // Fetch coin history
  useEffect(() => {
    fetchCoinData()
  }, [])

  // Fetch income data when period changes
  useEffect(() => {
    fetchIncomeData(incomePeriod)
  }, [incomePeriod])

  // Fetch order count data when period changes
  useEffect(() => {
    fetchOrderCountData(orderCountPeriod)
  }, [orderCountPeriod])

  // Calculate totals when data is loaded
  useEffect(() => {
    if (!loadingContract && !loadingCoins) {
      const totalUserSpending = contractData.user_spending.reduce(
        (sum, item) => sum + Number.parseFloat(item.total_spent),
        0,
      )

      const totalConstructorIncome = contractData.constructor_income.reduce(
        (sum, item) => sum + Number.parseFloat(item.total_income),
        0,
      )

      setSummaryData((prev) => ({
        ...prev,
        totalUserSpending,
        totalConstructorIncome,
      }))
    }
  }, [loadingContract, loadingCoins, contractData, coinData])

  // Calculate coins spent by role when user roles are loaded
  useEffect(() => {
    if (Object.keys(userRoles).length > 0 && !loadingCoins) {
      let customerDeductions = 0
      let customerRefunds = 0
      let constructorDeductions = 0
      let constructorRefunds = 0

      coinData.forEach((item) => {
        const role = userRoles[item.user]
        const amount = Number.parseFloat(item.amount)
        const transactionType = item.transaction_type.toLowerCase()

        if (role === "customer") {
          if (transactionType === "deduction") {
            customerDeductions += amount
          } else if (transactionType === "refund") {
            customerRefunds += amount
          }
        } else if (role === "constructor") {
          if (transactionType === "deduction") {
            constructorDeductions += amount
          } else if (transactionType === "refund") {
            constructorRefunds += amount
          }
        }
      })

      // Calculate total income coin
      const totalIncomeCoin = customerDeductions - customerRefunds + (constructorDeductions - constructorRefunds)

      setSummaryData((prev) => ({
        ...prev,
        customerCoinsDeduction: customerDeductions,
        customerCoinsRefund: customerRefunds,
        constructorCoinsDeduction: constructorDeductions,
        constructorCoinsRefund: constructorRefunds,
        totalIncomeCoin: totalIncomeCoin,
      }))
    }
  }, [userRoles, coinData, loadingCoins])

  const fetchContractData = () => {
    setLoadingContract(true)
    axios
      .get(`${API_BASE_URL}/api/v1/orders/contract-money-history/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        if (response.data.role === "admin") {
          setContractData({
            user_spending: response.data.user_spending || [],
            constructor_income: response.data.constructor_income || [],
          })
        }
      })
      .catch(() => setErrorContract("❌ Failed to load contract money history."))
      .finally(() => setLoadingContract(false))
  }

  // Fetch user role information
  const fetchUserRole = async (userId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/user/users/${userId}/profile/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      return response.data.profile.role
    } catch (error) {
      console.error(`Failed to fetch role for user ${userId}:`, error)
      return "unknown"
    }
  }

  const fetchCoinData = () => {
    setLoadingCoins(true)
    axios
      .get(`${API_BASE_URL}/api/v1/orders/coin-history/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        setCoinData(response.data || [])
      })
      .catch(() => setErrorCoins("❌ Failed to load coin history."))
      .finally(() => setLoadingCoins(false))
  }

  // Fetch user roles when coin data changes
  useEffect(() => {
    const fetchRoles = async () => {
      if (!loadingCoins && coinData.length > 0) {
        const uniqueUserIds = [...new Set(coinData.map((item) => item.user))]
        const roles = {}

        for (const userId of uniqueUserIds) {
          roles[userId] = await fetchUserRole(userId)
        }

        setUserRoles(roles)
      }
    }

    fetchRoles()
  }, [coinData, loadingCoins])

  // Fetch income data
  const fetchIncomeData = (period) => {
    setLoadingIncome(true)
    setErrorIncome("")
    axios
      .get(`${API_BASE_URL}/api/v1/orders/income/`, {
        params: { period },
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        // Handle different response formats based on period
        if (period === "day") {
          setIncomeData([response.data]) // Wrap single object in array for consistent handling
        } else {
          setIncomeData(response.data || [])
        }
      })
      .catch((error) => {
        setErrorIncome(`❌ Failed to load income data: ${error.response?.data?.error || error.message}`)
      })
      .finally(() => setLoadingIncome(false))
  }

  // Fetch order count data
  const fetchOrderCountData = (period) => {
    setLoadingOrderCount(true)
    setErrorOrderCount("")
    axios
      .get(`${API_BASE_URL}/api/v1/orders/order-count/`, {
        params: { period },
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        // Handle different response formats based on period
        if (period === "day") {
          setOrderCountData([response.data]) // Wrap single object in array for consistent handling
        } else {
          setOrderCountData(response.data || [])
        }
      })
      .catch((error) => {
        setErrorOrderCount(`❌ Failed to load order count data: ${error.response?.data?.error || error.message}`)
      })
      .finally(() => setLoadingOrderCount(false))
  }

  const handleRefresh = () => {
    fetchContractData()
    fetchCoinData()
    fetchIncomeData(incomePeriod)
    fetchOrderCountData(orderCountPeriod)
  }

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue)
    setPage(0)
  }

  const handleCoinChangeTab = (event, newValue) => {
    setCoinActiveTab(newValue)
    setCoinPage(0)
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleCoinChangePage = (event, newPage) => {
    setCoinPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleCoinChangeRowsPerPage = (event) => {
    setCoinRowsPerPage(Number.parseInt(event.target.value, 10))
    setCoinPage(0)
  }

  const handleIncomePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setIncomePeriod(newPeriod)
    }
  }

  const handleOrderCountPeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setOrderCountPeriod(newPeriod)
    }
  }

  const handleTransactionTypeFilterChange = (event) => {
    setTransactionTypeFilter(event.target.value)
    setCoinPage(0) // Reset to first page when filter changes
  }

  // View control handlers
  const handleViewChart = () => {
    setCurrentView("chart")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
  }

  // Render summary cards
  const renderSummaryCards = () => {
    const cards = [
      {
        title: "Total Contract Money",
        value: `$${summaryData.totalUserSpending.toFixed(2)}`,
        icon: <AttachMoney />,
        color: theme.palette.primary.main,
        bgColor: theme.palette.primary.lightest || theme.palette.primary.light,
      },
      {
        title: "Total Income Coin",
        value: summaryData.totalIncomeCoin.toFixed(2),
        icon: <Savings />,
        color: theme.palette.purple?.main || "#9c27b0",
        bgColor: theme.palette.purple?.lightest || "#f3e5f5",
      },
      {
        title: "Customer Coins Spent",
        value: summaryData.customerCoinsDeduction.toFixed(2),
        icon: <TrendingDown />,
        color: theme.palette.warning.main,
        bgColor: theme.palette.warning.lightest || theme.palette.warning.light,
      },
      {
        title: "Customer Coins Refund",
        value: summaryData.customerCoinsRefund.toFixed(2),
        icon: <TrendingUp />,
        color: theme.palette.info.main,
        bgColor: theme.palette.info.lightest || theme.palette.info.light,
      },
      {
        title: "Constructor Coins Spent",
        value: summaryData.constructorCoinsDeduction.toFixed(2),
        icon: <TrendingDown />,
        color: theme.palette.error.main,
        bgColor: theme.palette.error.lightest || theme.palette.error.light,
      },
      {
        title: "Constructor Coins Refund",
        value: summaryData.constructorCoinsRefund.toFixed(2),
        icon: <TrendingUp />,
        color: theme.palette.secondary.main,
        bgColor: theme.palette.secondary.lightest || theme.palette.secondary.light,
      },
    ]

    return (
      <Grid container spacing={isMobile ? 2 : 3} disableEqualOverflow>
        {cards.map((card, index) => (
          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={index}>
            <motion.div variants={itemVariants} initial="hidden" animate="visible" transition={{ delay: index * 0.1 }}>
              <Card
                elevation={2}
                sx={{
                  height: "100%",
                  borderRadius: 2,
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 6,
                  },
                  overflow: "hidden",
                  minHeight: isMobile ? 120 : 140,
                }}
              >
                <Box sx={{ p: 0.5, bgcolor: card.bgColor }} />
                <CardContent
                  sx={{
                    p: isMobile ? 1.5 : 2.5,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
                    <Typography
                      variant={isMobile ? "caption" : "subtitle2"}
                      color="text.secondary"
                      sx={{
                        fontSize: isMobile ? "0.7rem" : undefined,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {card.title}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        mt: 1,
                      }}
                    >
                      <Typography
                        variant={isMobile ? "h6" : "h5"}
                        fontWeight="bold"
                        sx={{
                          fontSize: (theme) => {
                            // Dynamically adjust font size based on value length
                            const valueLength = card.value.toString().length
                            if (valueLength > 10) return isMobile ? "0.75rem" : "1.1rem"
                            if (valueLength > 8) return isMobile ? "0.85rem" : "1.25rem"
                            if (valueLength > 6) return isMobile ? "0.9rem" : "1.35rem"
                            return isMobile ? "1rem" : "1.5rem"
                          },
                          lineHeight: 1.2,
                          whiteSpace: "nowrap",
                          overflow: "visible", // Change from "hidden" to "visible"
                          maxWidth: "calc(100% - 50px)", // Leave space for the avatar
                        }}
                      >
                        {card.value}
                      </Typography>
                      <Avatar
                        sx={{
                          bgcolor: card.color,
                          width: isMobile ? 36 : 48,
                          height: isMobile ? 36 : 48,
                          boxShadow: 2,
                          flexShrink: 0,
                          ml: 1,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>
    )
  }

  // Render income panel
  const renderIncomePanel = () => {
    const periodLabels = {
      day: "Today",
      month: "This Month",
      year: "This Year",
    }

    const periodIcons = {
      day: <CalendarToday fontSize="small" />,
      month: <CalendarMonth fontSize="small" />,
      year: <DateRange fontSize="small" />,
    }

    // Function to format date for display
    const formatDate = (dateStr) => {
      if (!dateStr) return ""
      const date = new Date(dateStr)
      if (incomePeriod === "year") {
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short" })
      }
      return date.toLocaleDateString()
    }

    // Calculate total income across all entries
    const totalIncome = incomeData.reduce((sum, item) => sum + (item.total_income || 0), 0)

    return (
      <Card
        elevation={2}
        sx={{
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <AttachMoney color="primary" />
              <Typography variant={isMobile ? "subtitle1" : "h6"}>Income Overview</Typography>
            </Stack>
          }
          action={
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={isMobile ? 0.5 : 1}
              alignItems={isMobile ? "flex-end" : "center"}
            >
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<InsertChart sx={{ fontSize: isMobile ? "0.9rem" : undefined }} />}
                onClick={handleViewChart}
                sx={{
                  mr: isMobile ? 0.5 : 1,
                  px: isMobile ? 1 : 2,
                  py: isMobile ? 0.5 : 1,
                  fontSize: isMobile ? "0.65rem" : undefined,
                  minWidth: 0,
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "Chart" : "View Chart"}
              </Button>
              <ToggleButtonGroup
                value={incomePeriod}
                exclusive
                onChange={handleIncomePeriodChange}
                aria-label="income period"
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    px: isMobile ? 0.75 : 2,
                    py: isMobile ? 0.25 : 1,
                    fontSize: isMobile ? "0.65rem" : "0.7rem",
                  },
                }}
              >
                <ToggleButton value="day" aria-label="day">
                  {isMobile ? periodIcons.day : "Day"}
                </ToggleButton>
                <ToggleButton value="month" aria-label="month">
                  {isMobile ? periodIcons.month : "Month"}
                </ToggleButton>
                <ToggleButton value="year" aria-label="year">
                  {isMobile ? periodIcons.year : "Year"}
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Refresh data">
                <IconButton onClick={() => fetchIncomeData(incomePeriod)} disabled={loadingIncome} size="small">
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{
            px: isMobile ? 1.5 : 3,
            py: isMobile ? 1 : 2,
            "& .MuiCardHeader-action": {
              mt: isMobile ? 0 : undefined,
              mr: isMobile ? 0 : undefined,
            },
          }}
        />
        <Divider />

        {loadingIncome ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: isMobile ? 2 : 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <CircularProgress size={isMobile ? 30 : 40} />
            </motion.div>
          </Box>
        ) : errorIncome ? (
          <Alert severity="error" sx={{ m: isMobile ? 1 : 2, fontSize: isMobile ? "0.75rem" : undefined }}>
            {errorIncome}
          </Alert>
        ) : (
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={isMobile ? 1 : 2}>
              <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary" textAlign="center">
                Total Income for {periodLabels[incomePeriod]}: ${totalIncome.toFixed(2)}
              </Typography>

              {/* Display data in a table */}
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Income ($)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incomeData.length > 0 ? (
                      incomeData.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{formatDate(incomePeriod === "year" ? item.month : item.date)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                              <TrendingUp fontSize="small" color="success" />${(item.total_income || 0).toFixed(2)}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No income data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        )}
      </Card>
    )
  }

  // Render order count panel
  const renderOrderCountPanel = () => {
    const periodLabels = {
      day: "Today",
      month: "This Month",
      year: "This Year",
    }

    const periodIcons = {
      day: <CalendarToday fontSize="small" />,
      month: <CalendarMonth fontSize="small" />,
      year: <DateRange fontSize="small" />,
    }

    // Function to format date for display
    const formatDate = (dateStr) => {
      if (!dateStr) return ""
      const date = new Date(dateStr)
      if (orderCountPeriod === "year") {
        return date.toLocaleDateString(undefined, { year: "numeric", month: "short" })
      }
      return date.toLocaleDateString()
    }

    // Calculate total orders across all entries
    const totalOrders = orderCountData.reduce((sum, item) => sum + (item.total_orders || 0), 0)

    return (
      <Card
        elevation={2}
        sx={{
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <ShoppingCart color="info" />
              <Typography variant={isMobile ? "subtitle1" : "h6"}>Order Statistics</Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <ToggleButtonGroup
                value={orderCountPeriod}
                exclusive
                onChange={handleOrderCountPeriodChange}
                aria-label="order count period"
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    px: isMobile ? 1 : 2,
                    py: isMobile ? 0.5 : 1,
                    fontSize: isMobile ? "0.7rem" : undefined,
                  },
                }}
              >
                <ToggleButton value="day" aria-label="day">
                  {isMobile ? periodIcons.day : "Day"}
                </ToggleButton>
                <ToggleButton value="month" aria-label="month">
                  {isMobile ? periodIcons.month : "Month"}
                </ToggleButton>
                <ToggleButton value="year" aria-label="year">
                  {isMobile ? periodIcons.year : "Year"}
                </ToggleButton>
              </ToggleButtonGroup>
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => fetchOrderCountData(orderCountPeriod)}
                  disabled={loadingOrderCount}
                  size={isMobile ? "small" : "medium"}
                >
                  <Refresh fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{
            px: isMobile ? 1.5 : 3,
            py: isMobile ? 1 : 2,
            "& .MuiCardHeader-action": {
              mt: isMobile ? 0 : undefined,
              mr: isMobile ? 0 : undefined,
            },
          }}
        />
        <Divider />

        {loadingOrderCount ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: isMobile ? 2 : 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <CircularProgress size={isMobile ? 30 : 40} />
            </motion.div>
          </Box>
        ) : errorOrderCount ? (
          <Alert severity="error" sx={{ m: isMobile ? 1 : 2, fontSize: isMobile ? "0.75rem" : undefined }}>
            {errorOrderCount}
          </Alert>
        ) : (
          <CardContent sx={{ p: isMobile ? 2 : 3 }}>
            <Stack spacing={isMobile ? 1 : 2}>
              <Typography variant={isMobile ? "body2" : "subtitle1"} color="text.secondary" textAlign="center">
                Total Orders for {periodLabels[orderCountPeriod]}: {totalOrders}
              </Typography>

              {/* Display data in a table */}
              <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Orders</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderCountData.length > 0 ? (
                      orderCountData.map((item, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{formatDate(orderCountPeriod === "year" ? item.month : item.date)}</TableCell>
                          <TableCell align="right">
                            <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1}>
                              <ShoppingCart fontSize="small" color="info" />
                              {item.total_orders || 0}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          No order data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </CardContent>
        )}
      </Card>
    )
  }

  // Render contract money panel
  const renderContractMoneyPanel = () => {
    const userSpendingData = contractData.user_spending.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

    const constructorIncomeData = contractData.constructor_income.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    )

    // Mobile card view for user spending
    const renderMobileUserSpendingCards = () => (
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {userSpendingData.length > 0 ? (
          userSpendingData.map((row, index) => (
            <motion.div
              key={row.user}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? "background.paper" : "action.hover",
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 24,
                        height: 24,
                      }}
                    >
                      <Person sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium" fontSize="0.8rem">
                      User ID: {row.user}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingDown sx={{ fontSize: 16 }} color="error" />
                    <Typography variant="body2" fontSize="0.8rem">
                      Spent: ${row.total_spent.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </motion.div>
          ))
        ) : (
          <Typography variant="body2" sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}>
            No user spending data available
          </Typography>
        )}
      </Box>
    )

    // Mobile card view for constructor income
    const renderMobileConstructorIncomeCards = () => (
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {constructorIncomeData.length > 0 ? (
          constructorIncomeData.map((row, index) => (
            <motion.div
              key={row.constructor}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? "background.paper" : "action.hover",
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.success.main,
                        width: 24,
                        height: 24,
                      }}
                    >
                      <Engineering sx={{ fontSize: 14 }} />
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium" fontSize="0.8rem">
                      Constructor ID: {row.constructor}
                    </Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingUp sx={{ fontSize: 16 }} color="success" />
                    <Typography variant="body2" fontSize="0.8rem">
                      Earned: ${row.total_income.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </motion.div>
          ))
        ) : (
          <Typography variant="body2" sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}>
            No constructor income data available
          </Typography>
        )}
      </Box>
    )

    return (
      <Card
        elevation={2}
        sx={{
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <AttachMoney color="primary" />
              <Typography variant={isMobile ? "subtitle1" : "h6"}>Total Contract Money</Typography>
            </Stack>
          }
          action={
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={loadingContract} size={isMobile ? "small" : "medium"}>
                <Refresh fontSize={isMobile ? "small" : "medium"} />
              </IconButton>
            </Tooltip>
          }
          sx={{
            px: isMobile ? 1.5 : 3,
            py: isMobile ? 1 : 2,
            "& .MuiCardHeader-action": {
              mt: isMobile ? 0 : undefined,
              mr: isMobile ? 0 : undefined,
            },
          }}
        />
        <Divider />

        {loadingContract ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: isMobile ? 2 : 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <CircularProgress size={isMobile ? 30 : 40} />
            </motion.div>
          </Box>
        ) : errorContract ? (
          <Alert severity="error" sx={{ m: isMobile ? 1 : 2, fontSize: isMobile ? "0.75rem" : undefined }}>
            {errorContract}
          </Alert>
        ) : (
          <Box>
            <Tabs
              value={activeTab}
              onChange={handleChangeTab}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Person fontSize={isMobile ? "small" : "medium"} />
                    {!isMobile && <Typography>User Spending</Typography>}
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Engineering fontSize={isMobile ? "small" : "medium"} />
                    {!isMobile && <Typography>Constructor Income</Typography>}
                  </Stack>
                }
              />
            </Tabs>

            <Box role="tabpanel" hidden={activeTab !== 0} p={0}>
              {activeTab === 0 && (
                <>
                  {renderMobileUserSpendingCards()}
                  <TableContainer
                    component={Box}
                    sx={{
                      display: { xs: "none", sm: "block" },
                      maxHeight: isMobile ? 300 : "none",
                    }}
                  >
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>User ID</TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            Total Contract Money Spent ($)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userSpendingData.length > 0 ? (
                          userSpendingData.map((row, index) => (
                            <motion.tr
                              key={row.user}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              component={TableRow}
                              sx={{
                                "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
                                "&:hover": { backgroundColor: theme.palette.action.selected },
                              }}
                            >
                              <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <Avatar
                                    sx={{
                                      width: isMobile ? 24 : 28,
                                      height: isMobile ? 24 : 28,
                                      bgcolor: theme.palette.primary.main,
                                      mr: isMobile ? 1 : 2,
                                    }}
                                  >
                                    <Person fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                    {row.user}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1.5}>
                                  <TrendingDown fontSize="small" color="error" />
                                  <Typography sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                    ${row.total_spent.toFixed(2)}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No user spending data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={contractData.user_spending.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={<Box sx={{ display: { xs: "none", sm: "block" } }}>Rows:</Box>}
                    sx={{
                      ".MuiTablePagination-toolbar": {
                        minHeight: isMobile ? 40 : 52,
                        pl: isMobile ? 1 : 2,
                      },
                      ".MuiTablePagination-displayedRows": {
                        fontSize: isMobile ? "0.75rem" : undefined,
                      },
                      ".MuiTablePagination-selectRoot": {
                        mr: isMobile ? 0.5 : 2,
                      },
                    }}
                  />
                </>
              )}
            </Box>

            <Box role="tabpanel" hidden={activeTab !== 1} p={0}>
              {activeTab === 1 && (
                <>
                  {renderMobileConstructorIncomeCards()}
                  <TableContainer
                    component={Box}
                    sx={{
                      display: { xs: "none", sm: "block" },
                      maxHeight: isMobile ? 300 : "none",
                    }}
                  >
                    <Table size={isMobile ? "small" : "medium"}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Constructor ID</TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            Total Contract Money Earned ($)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {constructorIncomeData.length > 0 ? (
                          constructorIncomeData.map((row, index) => (
                            <motion.tr
                              key={row.constructor}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              component={TableRow}
                              sx={{
                                "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
                                "&:hover": { backgroundColor: theme.palette.action.selected },
                              }}
                            >
                              <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center" }}>
                                  <Avatar
                                    sx={{
                                      width: isMobile ? 24 : 28,
                                      height: isMobile ? 24 : 28,
                                      bgcolor: theme.palette.success.main,
                                      mr: isMobile ? 1 : 2,
                                    }}
                                  >
                                    <Engineering fontSize="small" />
                                  </Avatar>
                                  <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                    {row.constructor}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                                <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1.5}>
                                  <TrendingUp fontSize="small" color="success" />
                                  <Typography sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                    ${row.total_income.toFixed(2)}
                                  </Typography>
                                </Stack>
                              </TableCell>
                            </motion.tr>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} align="center">
                              No constructor income data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={contractData.constructor_income.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={<Box sx={{ display: { xs: "none", sm: "block" } }}>Rows:</Box>}
                    sx={{
                      ".MuiTablePagination-toolbar": {
                        minHeight: isMobile ? 40 : 52,
                        pl: isMobile ? 1 : 2,
                      },
                      ".MuiTablePagination-displayedRows": {
                        fontSize: isMobile ? "0.75rem" : undefined,
                      },
                      ".MuiTablePagination-selectRoot": {
                        mr: isMobile ? 0.5 : 2,
                      },
                    }}
                  />
                </>
              )}
            </Box>
          </Box>
        )}
      </Card>
    )
  }

  // Render coin history panel
  const renderCoinHistoryPanel = () => {
    // Filter coin data by role
    const customerCoinData = coinData.filter((item) => userRoles[item.user] === "customer")
    const constructorCoinData = coinData.filter((item) => userRoles[item.user] === "constructor")

    // Apply transaction type filter
    const filterCoinData = (data) => {
      if (transactionTypeFilter === "ALL") {
        return data
      }
      return data.filter((item) => item.transaction_type.toLowerCase() === transactionTypeFilter.toLowerCase())
    }

    const filteredCustomerCoinData = filterCoinData(customerCoinData)
    const filteredConstructorCoinData = filterCoinData(constructorCoinData)

    // Get paginated data based on active tab
    const paginatedCoinData =
      coinActiveTab === 0
        ? filteredCustomerCoinData.slice(coinPage * coinRowsPerPage, coinPage * coinRowsPerPage + coinRowsPerPage)
        : filteredConstructorCoinData.slice(coinPage * coinRowsPerPage, coinPage * coinRowsPerPage + coinRowsPerPage)

    // Get total count based on active tab
    const totalCount = coinActiveTab === 0 ? filteredCustomerCoinData.length : filteredConstructorCoinData.length

    // Mobile card view for coin history
    const renderMobileCoinHistoryCards = () => (
      <Box sx={{ display: { xs: "block", sm: "none" } }}>
        {paginatedCoinData.length > 0 ? (
          paginatedCoinData.map((row, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: index % 2 === 0 ? "background.paper" : "action.hover",
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar
                      sx={{
                        bgcolor: coinActiveTab === 0 ? theme.palette.warning.main : theme.palette.info.main,
                        width: 24,
                        height: 24,
                      }}
                    >
                      {coinActiveTab === 0 ? <Person sx={{ fontSize: 14 }} /> : <Engineering sx={{ fontSize: 14 }} />}
                    </Avatar>
                    <Stack>
                      <Typography variant="body2" fontWeight="medium" fontSize="0.8rem">
                        User ID: {row.user}
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          px: 1,
                          py: 0.25,
                          borderRadius: 1,
                          fontSize: "0.65rem",
                          fontWeight: "medium",
                          bgcolor: theme.palette.info.lightest || theme.palette.info.light,
                          color: theme.palette.info.dark,
                          display: "inline-block",
                          mt: 0.5,
                        }}
                      >
                        Role: {userRoles[row.user] || "loading..."}
                      </Box>
                    </Stack>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontSize="0.8rem">
                      Order ID: {row.order || "N/A"}
                    </Typography>
                  </Stack>
                  <Box>
                    <Box
                      component="span"
                      sx={{
                        px: isMobile ? 1 : 1.5,
                        py: isMobile ? 0.5 : 0.75,
                        borderRadius: 1.5,
                        fontSize: isMobile ? "0.65rem" : "0.75rem",
                        fontWeight: "medium",
                        bgcolor: theme.palette.success.lightest || theme.palette.success.light,
                        color: theme.palette.success.dark,
                      }}
                    >
                      {row.transaction_type}
                    </Box>
                  </Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <TrendingDown sx={{ fontSize: 16 }} color="success" />
                    <Typography variant="body2" fontSize="0.8rem">
                      Amount: {Number.parseFloat(row.amount).toFixed(2)}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
                    {new Date(row.timestamp).toLocaleDateString()}
                  </Typography>
                </Stack>
              </Paper>
            </motion.div>
          ))
        ) : (
          <Typography variant="body2" sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}>
            No coin transaction data available
          </Typography>
        )}
      </Box>
    )

    return (
      <Card
        elevation={2}
        sx={{
          height: "100%",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <CardHeader
          title={
            <Stack direction="row" alignItems="center" spacing={1}>
              <MonetizationOn color="warning" />
              <Typography variant={isMobile ? "subtitle1" : "h6"}>Total Spent Coins</Typography>
            </Stack>
          }
          action={
            <Stack direction="row" spacing={1} alignItems="center">
              <FormControl
                size="small"
                sx={{
                  minWidth: isMobile ? 100 : 150,
                  "& .MuiInputBase-root": {
                    fontSize: isMobile ? "0.75rem" : undefined,
                  },
                }}
              >
                <InputLabel id="transaction-type-filter-label">
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <FilterList fontSize="small" />
                    <Typography variant="caption">Type</Typography>
                  </Stack>
                </InputLabel>
                <Select
                  labelId="transaction-type-filter-label"
                  value={transactionTypeFilter}
                  onChange={handleTransactionTypeFilterChange}
                  label={
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <FilterList fontSize="small" />
                      <Typography variant="caption">Type</Typography>
                    </Stack>
                  }
                >
                  <MenuItem value="ALL">All Types</MenuItem>
                  <MenuItem value="deduction">Deduction</MenuItem>
                  <MenuItem value="refund">Refund</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title="Refresh data">
                <IconButton onClick={handleRefresh} disabled={loadingCoins} size={isMobile ? "small" : "medium"}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          }
          sx={{
            px: isMobile ? 1.5 : 3,
            py: isMobile ? 1 : 2,
            "& .MuiCardHeader-action": {
              mt: isMobile ? 0 : undefined,
              mr: isMobile ? 0 : undefined,
            },
          }}
        />
        <Divider />

        {loadingCoins ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: isMobile ? 2 : 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <CircularProgress size={isMobile ? 30 : 40} />
            </motion.div>
          </Box>
        ) : errorCoins ? (
          <Alert severity="error" sx={{ m: isMobile ? 1 : 2, fontSize: isMobile ? "0.75rem" : undefined }}>
            {errorCoins}
          </Alert>
        ) : (
          <Box>
            <Tabs
              value={coinActiveTab}
              onChange={handleCoinChangeTab}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Person fontSize={isMobile ? "small" : "medium"} />
                    {!isMobile && <Typography>Customer Coins</Typography>}
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Engineering fontSize={isMobile ? "small" : "medium"} />
                    {!isMobile && <Typography>Constructor Coins</Typography>}
                  </Stack>
                }
              />
            </Tabs>

            <Box p={0}>
              {transactionTypeFilter !== "ALL" && (
                <Box sx={{ px: 2, py: 1, display: "flex", alignItems: "center" }}>
                  <Typography variant="body2" color="text.secondary" mr={1}>
                    Filtered by:
                  </Typography>
                  <Chip
                    label={transactionTypeFilter}
                    size="small"
                    color="success"
                    onDelete={() => setTransactionTypeFilter("ALL")}
                  />
                </Box>
              )}

              {renderMobileCoinHistoryCards()}
              <TableContainer
                component={Box}
                sx={{
                  display: { xs: "none", sm: "block" },
                  maxHeight: isMobile ? 300 : "none",
                }}
              >
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>User ID</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Role</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Order ID</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Transaction Type</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Amount</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Description</TableCell>
                      <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCoinData.length > 0 ? (
                      paginatedCoinData.map((row, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          component={TableRow}
                          sx={{
                            "&:nth-of-type(odd)": { backgroundColor: theme.palette.action.hover },
                            "&:hover": { backgroundColor: theme.palette.action.selected },
                          }}
                        >
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar
                                sx={{
                                  width: isMobile ? 24 : 28,
                                  height: isMobile ? 24 : 28,
                                  bgcolor: coinActiveTab === 0 ? theme.palette.warning.main : theme.palette.info.main,
                                  mr: isMobile ? 1 : 2,
                                }}
                              >
                                {coinActiveTab === 0 ? <Person fontSize="small" /> : <Engineering fontSize="small" />}
                              </Avatar>
                              <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                {row.user}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                              {userRoles[row.user] || "loading..."}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            <Typography variant="body2" sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                              {row.order || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            <Box
                              component="span"
                              sx={{
                                px: isMobile ? 1 : 1.5,
                                py: isMobile ? 0.5 : 0.75,
                                borderRadius: 1.5,
                                fontSize: isMobile ? "0.65rem" : "0.75rem",
                                fontWeight: "medium",
                                bgcolor: theme.palette.success.lightest || theme.palette.success.light,
                                color: theme.palette.success.dark,
                              }}
                            >
                              {row.transaction_type}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: isMobile ? 1 : 2, px: isMobile ? 1 : 2 }}>
                            <Stack direction="row" alignItems="center" spacing={isMobile ? 0.5 : 1.5}>
                              <TrendingDown fontSize="small" color="success" />
                              <Typography sx={{ fontSize: isMobile ? "0.75rem" : undefined }}>
                                {Number.parseFloat(row.amount).toFixed(2)}
                              </Typography>
                            </Stack>
                          </TableCell>
                          <TableCell
                            sx={{
                              py: isMobile ? 1 : 2,
                              px: isMobile ? 1 : 2,
                              fontSize: isMobile ? "0.75rem" : undefined,
                            }}
                          >
                            {row.description}
                          </TableCell>
                          <TableCell
                            sx={{
                              py: isMobile ? 1 : 2,
                              px: isMobile ? 1 : 2,
                              fontSize: isMobile ? "0.75rem" : undefined,
                            }}
                          >
                            {new Date(row.timestamp).toLocaleString()}
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No coin transaction data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={totalCount}
                page={coinPage}
                onPageChange={handleCoinChangePage}
                rowsPerPage={coinRowsPerPage}
                onRowsPerPageChange={handleCoinChangeRowsPerPage}
                labelRowsPerPage={<Box sx={{ display: { xs: "none", sm: "block" } }}>Rows:</Box>}
                sx={{
                  ".MuiTablePagination-toolbar": {
                    minHeight: isMobile ? 40 : 52,
                    pl: isMobile ? 1 : 2,
                  },
                  ".MuiTablePagination-displayedRows": {
                    fontSize: isMobile ? "0.75rem" : undefined,
                  },
                  ".MuiTablePagination-selectRoot": {
                    mr: isMobile ? 0.5 : 2,
                  },
                }}
              />
            </Box>
          </Box>
        )}
      </Card>
    )
  }

  // Render the appropriate view based on currentView state
  return currentView === "dashboard" ? (
    <Container maxWidth="xl" sx={{ px: isMobile ? 1 : 3 }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Box sx={{ py: isMobile ? 2 : 4 }}>
          <motion.div variants={itemVariants}>
            <Stack
              direction={isMobile ? "column" : "row"}
              justifyContent="space-between"
              alignItems={isMobile ? "flex-start" : "center"}
              mb={isMobile ? 2 : 4}
              sx={{ position: "relative" }}
            >
              <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" sx={{ mb: isMobile ? 1 : 0 }}>
                Admin Dashboard
              </Typography>
              <Tooltip title="Refresh all data">
                <IconButton
                  onClick={handleRefresh}
                  disabled={loadingContract || loadingCoins || loadingIncome || loadingOrderCount}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: "white",
                    width: isMobile ? 40 : 48,
                    height: isMobile ? 40 : 48,
                    "&:hover": { bgcolor: theme.palette.primary.dark },
                    boxShadow: 2,
                    position: isMobile ? "absolute" : "static",
                    top: isMobile ? 0 : "auto",
                    right: isMobile ? 0 : "auto",
                  }}
                >
                  <Refresh fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Tooltip>
            </Stack>
          </motion.div>

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Income and Order Count Panels */}
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: isMobile ? 2 : 3 }} disableEqualOverflow>
            {/* Income Panel */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div variants={itemVariants}>{renderIncomePanel()}</motion.div>
            </Grid>

            {/* Order Count Panel */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div variants={itemVariants}>{renderOrderCountPanel()}</motion.div>
            </Grid>
          </Grid>

          {/* Main Content */}
          <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: isMobile ? 2 : 3 }} disableEqualOverflow>
            {/* Contract Money Panel */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div variants={itemVariants}>{renderContractMoneyPanel()}</motion.div>
            </Grid>

            {/* Coin History Panel */}
            <Grid size={{ xs: 12, md: 6 }}>
              <motion.div variants={itemVariants}>{renderCoinHistoryPanel()}</motion.div>
            </Grid>
          </Grid>
        </Box>
      </motion.div>
    </Container>
  ) : (
    <AdminChart onBackToDashboard={handleBackToDashboard} />
  )
}

export default HomeAdmin

