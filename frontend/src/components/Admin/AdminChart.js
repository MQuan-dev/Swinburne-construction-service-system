"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import axios from "axios"
import {
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  Box,
  Divider,
  Stack,
  Typography,
  IconButton,
  useTheme,
  useMediaQuery,
  Container,
  ButtonGroup,
  Button,
  Tabs,
  Tab,
  Paper,
} from "@mui/material"
import {
  AttachMoney,
  CalendarMonth,
  DateRange,
  Refresh,
  ArrowBack,
  TrendingDown,
  AccountBalance,
} from "@mui/icons-material"
import { motion } from "framer-motion"
import * as d3 from "d3"

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL?.replace("/api/v1", "") || ""

const AdminChart = ({ onBackToDashboard }) => {
  const theme = useTheme()
  const isIPhone14ProMax = useMediaQuery("(min-width: 390px) and (max-width: 430px) and (min-height: 800px)")
  const isMobile = useMediaQuery("(max-width:600px)")
  const [period, setPeriod] = useState("month") // Default to month
  const [incomeData, setIncomeData] = useState([])
  const [outcomeData, setOutcomeData] = useState([])
  const [remainData, setRemainData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingOutcome, setLoadingOutcome] = useState(false)
  const [loadingRemain, setLoadingRemain] = useState(false)
  const [error, setError] = useState("")
  const [outcomeError, setOutcomeError] = useState("")
  const [remainError, setRemainError] = useState("")
  const [activeTab, setActiveTab] = useState(0) // 0: Income, 1: Outcome Coin, 2: Remain Coin

  // Refs for D3 chart
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)
  const chartContainerRef = useRef(null)

  // Chart dimensions
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
    margin: {
      top: isIPhone14ProMax ? 20 : isMobile ? 30 : 40,
      right: isIPhone14ProMax ? 10 : isMobile ? 15 : 30,
      bottom: isIPhone14ProMax ? 50 : isMobile ? 60 : 50,
      left: isIPhone14ProMax ? 35 : isMobile ? 40 : 60,
    },
  })

  // Memoize formatDate to prevent it from changing on every render
  const formatDate = useCallback(
    (dateStr) => {
      if (!dateStr) return ""
      const date = new Date(dateStr)
      if (period === "year") {
        // For year period, we get YYYY-MM format
        return date.toLocaleDateString(undefined, { month: "short" })
      } else if (period === "month") {
        // For month period, we get YYYY-MM-DD format
        return isIPhone14ProMax
          ? `${date.getDate()}/${date.getMonth() + 1}`
          : date.toLocaleDateString(undefined, { day: "numeric", month: "short" })
      }
      return date.toLocaleDateString()
    },
    [period, isIPhone14ProMax],
  )

  // Generic chart drawing function - now only draws line charts
  const drawChart = useCallback(
    (data, valuePrefix, mainColor, lightColor, tooltip) => {
      // Calculate chart dimensions
      const { width, height, margin } = dimensions
      const innerWidth = width - margin.left - margin.right
      const innerHeight = height - margin.top - margin.bottom

      // Create scales
      const xScale = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([0, innerWidth])
        .padding(0.3)

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) * 1.1 || 10]) // Add 10% padding at the top, fallback to 10 if no data
        .range([innerHeight, 0])

      // Create chart group
      const g = d3
        .select(svgRef.current)
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`)

      // Add X axis
      g.append("g")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", `rotate(${isIPhone14ProMax ? -30 : -45})`)
        .style("text-anchor", "end")
        .attr("dx", isIPhone14ProMax ? "-.5em" : "-.8em")
        .attr("dy", isIPhone14ProMax ? ".1em" : ".15em")
        .style("font-size", isIPhone14ProMax ? "6px" : isMobile ? "7px" : "10px")

      // Add Y axis
      g.append("g")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(isIPhone14ProMax ? 3 : isMobile ? 4 : 5)
            .tickFormat((d) => `${valuePrefix}${d}`),
        )
        .selectAll("text")
        .style("font-size", isIPhone14ProMax ? "6px" : isMobile ? "7px" : "10px")

      // Add Y axis label
      const yAxisLabel = activeTab === 0 ? "Income ($)" : activeTab === 1 ? "Outcome Coins" : "Remain Coins"
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + (isIPhone14ProMax ? 15 : 0))
        .attr("x", 0 - innerHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", isIPhone14ProMax ? "8px" : isMobile ? "10px" : "12px")
        .style("fill", theme.palette.text.secondary)
        .text(yAxisLabel)

      // Add grid lines
      g.append("g")
        .attr("class", "grid")
        .call(
          d3
            .axisLeft(yScale)
            .ticks(isIPhone14ProMax ? 3 : 5)
            .tickSize(-innerWidth)
            .tickFormat(""),
        )
        .selectAll("line")
        .style("stroke", theme.palette.divider)
        .style("stroke-opacity", 0.5)

      // Create tooltip functions
      const showTooltip = (event, d) => {
        const valueLabel = activeTab === 0 ? "Income" : activeTab === 1 ? "Outcome" : "Remain"
        const valuePrefix = activeTab === 0 ? "$" : ""

        // Get the position of the data point instead of using cursor position
        const pointX = xScale(d.label) + xScale.bandwidth() / 2 + margin.left
        const pointY = yScale(d.value) + margin.top

        // Position tooltip above the point
        const tooltipX = pointX
        const tooltipY = pointY - 10 // Position slightly above the point

        tooltip
          .style("opacity", 1)
          .style("left", `${tooltipX}px`)
          .style("top", `${tooltipY}px`)
          .style("transform", "translate(-50%, -100%)") // Center horizontally and position above
          .html(`
<div style="background: ${theme.palette.background.paper}; padding: ${isIPhone14ProMax ? 4 : isMobile ? 6 : 8}px; border: 1px solid ${theme.palette.divider}; border-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-size: ${isIPhone14ProMax ? "0.65rem" : isMobile ? "0.7rem" : "0.8rem"}">
  <div style="margin-bottom: 4px; font-weight: 500;">${d.label}</div>
  <div style="font-weight: bold; color: ${activeTab === 0 ? theme.palette.primary.main : activeTab === 1 ? theme.palette.error.main : theme.palette.success.main}">
    ${valueLabel}: ${valuePrefix}${d.value.toFixed(2)}
  </div>
</div>
`)
      }

      const hideTooltip = () => {
        tooltip.style("opacity", 0)
      }

      // Line chart - update for mobile
      // Create line generator
      const line = d3
        .line()
        .x((d) => xScale(d.label) + xScale.bandwidth() / 2)
        .y((d) => yScale(d.value))
        .curve(d3.curveMonotoneX)

      // Add area fill
      const area = d3
        .area()
        .x((d) => xScale(d.label) + xScale.bandwidth() / 2)
        .y0(innerHeight)
        .y1((d) => yScale(d.value))
        .curve(d3.curveMonotoneX)

      // Create gradient
      const gradient = g
        .append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%")

      gradient.append("stop").attr("offset", "0%").attr("stop-color", lightColor).attr("stop-opacity", 0.8)

      gradient.append("stop").attr("offset", "100%").attr("stop-color", lightColor).attr("stop-opacity", 0)

      // Add area
      g.append("path").datum(data).attr("fill", "url(#area-gradient)").attr("d", area)

      // Add line
      g.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", mainColor)
        .attr("stroke-width", isIPhone14ProMax ? 1 : isMobile ? 1.5 : 2)
        .attr("d", line)

      // Add points - smaller on mobile
      g.selectAll(".dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", (d) => xScale(d.label) + xScale.bandwidth() / 2)
        .attr("cy", (d) => yScale(d.value))
        .attr("r", isIPhone14ProMax ? 2 : isMobile ? 3 : 4)
        .attr("fill", "white")
        .attr("stroke", mainColor)
        .attr("stroke-width", isIPhone14ProMax ? 1 : isMobile ? 1.5 : 2)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", isIPhone14ProMax ? 3 : isMobile ? 4 : 6)
            .attr("fill", mainColor)
          showTooltip(event, d)
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", isIPhone14ProMax ? 2 : isMobile ? 3 : 4)
            .attr("fill", "white")
          hideTooltip()
        })
        .on("touchstart", (event, d) => {
          // Prevent scrolling when touching chart elements on mobile
          event.preventDefault()
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", isIPhone14ProMax ? 3 : isMobile ? 4 : 6)
            .attr("fill", mainColor)
          showTooltip(event, d)
        })
        .on("touchend", (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr("r", isIPhone14ProMax ? 2 : isMobile ? 3 : 4)
            .attr("fill", "white")
          hideTooltip()
        })

      // Add invisible overlay for better touch/mouse interaction
      g.append("rect")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .attr("fill", "transparent")
        .on("mousemove", (event) => {
          // Find closest point to mouse position
          const [mouseX] = d3.pointer(event)
          const xBand = xScale.step()
          const index = Math.floor(mouseX / xBand)
          if (index >= 0 && index < data.length) {
            const d = data[index]
            const closestPoint = g.selectAll(".dot").filter((pd) => pd.label === d.label)
            closestPoint.dispatch("mouseover", { bubbles: true })
          }
        })
        .on("mouseout", () => {
          g.selectAll(".dot").dispatch("mouseout", { bubbles: true })
        })
        .on("touchmove", (event) => {
          event.preventDefault()
          const [touchX] = d3.pointer(event)
          const xBand = xScale.step()
          const index = Math.floor(touchX / xBand)
          if (index >= 0 && index < data.length) {
            const d = data[index]
            const closestPoint = g.selectAll(".dot").filter((pd) => pd.label === d.label)
            closestPoint.dispatch("touchstart", { bubbles: true })
          }
        })
    },
    [dimensions, isIPhone14ProMax, isMobile, theme.palette, activeTab],
  )

  // Fetch data when period changes
  useEffect(() => {
    fetchIncomeData(period)
    fetchOutcomeData(period)
    fetchRemainData(period)
  }, [period])

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width } = chartContainerRef.current.getBoundingClientRect()
        setDimensions((prev) => ({
          ...prev,
          width: width,
          height: isIPhone14ProMax ? 220 : isMobile ? 280 : 350,
          margin: {
            top: isIPhone14ProMax ? 20 : isMobile ? 30 : 40,
            right: isIPhone14ProMax ? 10 : isMobile ? 15 : 30,
            bottom: isIPhone14ProMax ? 50 : isMobile ? 60 : 50,
            left: isIPhone14ProMax ? 35 : isMobile ? 40 : 60,
          },
        }))
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => {
      window.removeEventListener("resize", updateDimensions)
    }
  }, [isMobile, isIPhone14ProMax])

  // Draw the income chart using D3
  const drawIncomeChart = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)

    // Clear previous chart
    svg.selectAll("*").remove()

    // Prepare data
    const data = incomeData.map((item) => ({
      date: period === "year" ? new Date(item.month) : new Date(item.date),
      value: item.total_income || 0,
      label: formatDate(period === "year" ? item.month : item.date),
    }))

    // Sort data by date
    data.sort((a, b) => a.date - b.date)

    drawChart(data, "$", theme.palette.primary.main, theme.palette.primary.light, tooltip)
  }, [incomeData, period, theme.palette, drawChart, formatDate])

  // Draw outcome chart
  const drawOutcomeChart = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)

    // Clear previous chart
    svg.selectAll("*").remove()

    // Prepare data
    const data = outcomeData.map((item) => ({
      date: period === "year" ? new Date(item.month) : new Date(item.date),
      value: item.total_outcome || 0,
      label: formatDate(period === "year" ? item.month : item.date),
    }))

    // Sort data by date
    data.sort((a, b) => a.date - b.date)

    drawChart(data, "", theme.palette.error.main, theme.palette.error.light, tooltip)
  }, [outcomeData, period, theme.palette, drawChart, formatDate])

  // Draw remain chart
  const drawRemainChart = useCallback(() => {
    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)

    // Clear previous chart
    svg.selectAll("*").remove()

    // Prepare data
    const data = remainData.map((item) => ({
      date: period === "year" ? new Date(item.month) : new Date(item.date),
      value: item.total_remain || 0,
      label: formatDate(period === "year" ? item.month : item.date),
    }))

    // Sort data by date
    data.sort((a, b) => a.date - b.date)

    drawChart(data, "", theme.palette.success.main, theme.palette.success.light, tooltip)
  }, [remainData, period, theme.palette, drawChart, formatDate])

  // Draw chart when data, dimensions, or active tab changes
  useEffect(() => {
    if (dimensions.width > 0) {
      if (activeTab === 0 && !loading && incomeData.length > 0) {
        drawIncomeChart()
      } else if (activeTab === 1 && !loadingOutcome && outcomeData.length > 0) {
        drawOutcomeChart()
      } else if (activeTab === 2 && !loadingRemain && remainData.length > 0) {
        drawRemainChart()
      }
    }
  }, [
    incomeData,
    outcomeData,
    remainData,
    dimensions,
    activeTab,
    loading,
    loadingOutcome,
    loadingRemain,
    drawIncomeChart,
    drawOutcomeChart,
    drawRemainChart,
  ])

  const fetchIncomeData = (selectedPeriod) => {
    setLoading(true)
    setError("")
    axios
      .get(`${API_BASE_URL}/api/v1/orders/income/`, {
        params: { period: selectedPeriod },
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        // Handle different response formats based on period
        if (selectedPeriod === "day") {
          setIncomeData([response.data]) // Wrap single object in array for consistent handling
        } else {
          setIncomeData(response.data || [])
        }
      })
      .catch((error) => {
        setError(`❌ Failed to load income data: ${error.response?.data?.error || error.message}`)
      })
      .finally(() => setLoading(false))
  }

  const fetchOutcomeData = (selectedPeriod) => {
    setLoadingOutcome(true)
    setOutcomeError("")
    axios
      .get(`${API_BASE_URL}/api/v1/orders/outcome/`, {
        params: { period: selectedPeriod },
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        // Handle different response formats based on period
        if (selectedPeriod === "day") {
          setOutcomeData([response.data]) // Wrap single object in array for consistent handling
        } else {
          setOutcomeData(response.data || [])
        }
      })
      .catch((error) => {
        setOutcomeError(`❌ Failed to load outcome data: ${error.response?.data?.error || error.message}`)
      })
      .finally(() => setLoadingOutcome(false))
  }

  const fetchRemainData = (selectedPeriod) => {
    setLoadingRemain(true)
    setRemainError("")
    axios
      .get(`${API_BASE_URL}/api/v1/orders/remain/`, {
        params: { period: selectedPeriod },
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      })
      .then((response) => {
        // Handle different response formats based on period
        if (selectedPeriod === "day") {
          setRemainData([response.data]) // Wrap single object in array for consistent handling
        } else {
          setRemainData(response.data || [])
        }
      })
      .catch((error) => {
        setRemainError(`❌ Failed to load remain data: ${error.response?.data?.error || error.message}`)
      })
      .finally(() => setLoadingRemain(false))
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
  }

  // Calculate totals
  const totalIncome = incomeData.reduce((sum, item) => sum + (item.total_income || 0), 0)
  const totalOutcome = outcomeData.reduce((sum, item) => sum + (item.total_outcome || 0), 0)
  const totalRemain = remainData.reduce((sum, item) => sum + (item.total_remain || 0), 0)

  const periodLabels = {
    month: "This Month",
    year: "This Year",
  }

  const periodIcons = {
    month: <CalendarMonth fontSize="small" />,
    year: <DateRange fontSize="small" />,
  }

  const chartHeight = isIPhone14ProMax ? 220 : isMobile ? 280 : 350

  // Get current total value based on active tab
  const getCurrentTotal = () => {
    switch (activeTab) {
      case 0:
        return `$${totalIncome.toFixed(2)}`
      case 1:
        return totalOutcome.toFixed(2)
      case 2:
        return totalRemain.toFixed(2)
      default:
        return "0.00"
    }
  }

  // Get current title based on active tab
  const getCurrentTitle = () => {
    switch (activeTab) {
      case 0:
        return "Income Chart"
      case 1:
        return "Outcome Coin Chart"
      case 2:
        return "Remain Coin Chart"
      default:
        return "Chart"
    }
  }

  // Get current icon based on active tab
  const getCurrentIcon = () => {
    switch (activeTab) {
      case 0:
        return <AttachMoney color="primary" fontSize={isIPhone14ProMax ? "small" : isMobile ? "small" : "medium"} />
      case 1:
        return <TrendingDown color="error" fontSize={isIPhone14ProMax ? "small" : isMobile ? "small" : "medium"} />
      case 2:
        return <AccountBalance color="success" fontSize={isIPhone14ProMax ? "small" : isMobile ? "small" : "medium"} />
      default:
        return <AttachMoney color="primary" fontSize={isIPhone14ProMax ? "small" : isMobile ? "small" : "medium"} />
    }
  }

  // Get current period label based on active tab
  const getCurrentPeriodLabel = () => {
    switch (activeTab) {
      case 0:
        return `Total Income for ${periodLabels[period]}`
      case 1:
        return `Total Outcome Coins for ${periodLabels[period]}`
      case 2:
        return `Total Remain Coins for ${periodLabels[period]}`
      default:
        return `Total for ${periodLabels[period]}`
    }
  }

  // Check if there's an error based on active tab
  const hasError = () => {
    switch (activeTab) {
      case 0:
        return error
      case 1:
        return outcomeError
      case 2:
        return remainError
      default:
        return ""
    }
  }

  // Check if loading based on active tab
  const isLoading = () => {
    switch (activeTab) {
      case 0:
        return loading
      case 1:
        return loadingOutcome
      case 2:
        return loadingRemain
      default:
        return false
    }
  }

  // Check if there's data based on active tab
  const hasData = () => {
    switch (activeTab) {
      case 0:
        return incomeData.length > 0
      case 1:
        return outcomeData.length > 0
      case 2:
        return remainData.length > 0
      default:
        return false
    }
  }

  // Handle refresh based on active tab
  const handleRefresh = () => {
    switch (activeTab) {
      case 0:
        fetchIncomeData(period)
        break
      case 1:
        fetchOutcomeData(period)
        break
      case 2:
        fetchRemainData(period)
        break
      default:
        break
    }
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: isIPhone14ProMax ? 0 : isMobile ? 0.5 : 3,
        overflowX: "hidden",
        mt: isIPhone14ProMax ? 0 : undefined,
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Box sx={{ py: isIPhone14ProMax ? 1 : isMobile ? 2 : 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={isIPhone14ProMax ? 0.5 : isMobile ? 1 : 4}
          >
            <Typography
              variant={isMobile ? "h6" : "h4"}
              fontWeight="bold"
              sx={{ fontSize: isIPhone14ProMax ? "1rem" : isMobile ? "1.1rem" : undefined }}
            >
              Analytics Dashboard
            </Typography>
            <IconButton
              onClick={onBackToDashboard}
              sx={{
                bgcolor: theme.palette.primary.main,
                color: "white",
                width: isIPhone14ProMax ? 32 : isMobile ? 36 : 48,
                height: isIPhone14ProMax ? 32 : isMobile ? 36 : 48,
                "&:hover": { bgcolor: theme.palette.primary.dark },
              }}
            >
              <ArrowBack fontSize={isIPhone14ProMax ? "small" : isMobile ? "small" : "medium"} />
            </IconButton>
          </Stack>

          {/* Chart Selection Tabs */}
          <Paper
            elevation={2}
            sx={{
              mb: 2,
              borderRadius: isIPhone14ProMax ? 0.5 : isMobile ? 1 : 2,
              overflow: "hidden",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                minHeight: isIPhone14ProMax ? 36 : isMobile ? 40 : 48,
                "& .MuiTab-root": {
                  minHeight: isIPhone14ProMax ? 36 : isMobile ? 40 : 48,
                  fontSize: isIPhone14ProMax ? "0.65rem" : isMobile ? "0.7rem" : undefined,
                },
              }}
            >
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AttachMoney fontSize="small" />
                    <span>Income</span>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <TrendingDown fontSize="small" />
                    <span>Outcome</span>
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <AccountBalance fontSize="small" />
                    <span>Remain</span>
                  </Stack>
                }
              />
            </Tabs>
          </Paper>

          <Card
            elevation={2}
            sx={{
              height: "100%",
              borderRadius: isIPhone14ProMax ? 0.5 : isMobile ? 1 : 2,
              overflow: "hidden",
              mx: isIPhone14ProMax ? 0 : isMobile ? 0.5 : 0,
            }}
          >
            <CardHeader
              title={
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {getCurrentIcon()}
                  <Typography
                    variant={isIPhone14ProMax ? "body1" : isMobile ? "subtitle2" : "h6"}
                    sx={{ fontSize: isIPhone14ProMax ? "0.85rem" : isMobile ? "0.9rem" : undefined }}
                  >
                    {getCurrentTitle()}
                  </Typography>
                </Stack>
              }
              action={
                <Stack direction="row" spacing={isIPhone14ProMax ? 0.5 : 1} alignItems="center">
                  <ButtonGroup
                    variant="outlined"
                    size="small"
                    sx={{
                      "& .MuiButtonGroup-grouped": {
                        px: isIPhone14ProMax ? 0.5 : 1,
                        py: isIPhone14ProMax ? 0.25 : 0.5,
                        minWidth: isIPhone14ProMax ? 30 : 40,
                        fontSize: isIPhone14ProMax ? "0.6rem" : "0.7rem",
                      },
                    }}
                  >
                    <Button onClick={() => setPeriod("month")} variant={period === "month" ? "contained" : "outlined"}>
                      {periodIcons.month}
                    </Button>
                    <Button onClick={() => setPeriod("year")} variant={period === "year" ? "contained" : "outlined"}>
                      {periodIcons.year}
                    </Button>
                  </ButtonGroup>

                  <IconButton
                    onClick={handleRefresh}
                    disabled={isLoading()}
                    size="small"
                    sx={{
                      width: isIPhone14ProMax ? 24 : 32,
                      height: isIPhone14ProMax ? 24 : 32,
                    }}
                  >
                    <Refresh fontSize="small" />
                  </IconButton>
                </Stack>
              }
              sx={{
                px: isIPhone14ProMax ? 0.75 : isMobile ? 1 : 3,
                py: isIPhone14ProMax ? 0.5 : isMobile ? 0.75 : 2,
                "& .MuiCardHeader-action": {
                  mt: 0,
                  mr: 0,
                },
                "& .MuiCardHeader-content": {
                  minWidth: 0,
                },
              }}
            />
            <Divider />

            {isLoading() ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  p: isIPhone14ProMax ? 0.5 : isMobile ? 1 : 4,
                  height: isIPhone14ProMax ? 200 : isMobile ? 280 : 400,
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <CircularProgress size={isIPhone14ProMax ? 20 : isMobile ? 24 : 40} />
                </motion.div>
              </Box>
            ) : hasError() ? (
              <Alert
                severity="error"
                sx={{
                  m: isIPhone14ProMax ? 0.25 : isMobile ? 0.5 : 2,
                  fontSize: isIPhone14ProMax ? "0.6rem" : isMobile ? "0.65rem" : "0.75rem",
                  py: isIPhone14ProMax ? 0.25 : isMobile ? 0.5 : 1,
                }}
              >
                {hasError()}
              </Alert>
            ) : (
              <CardContent sx={{ p: isIPhone14ProMax ? 0.5 : isMobile ? 1 : 3 }}>
                <Typography
                  variant={isIPhone14ProMax ? "caption" : isMobile ? "caption" : "subtitle1"}
                  color="text.secondary"
                  textAlign="center"
                  mb={isIPhone14ProMax ? 0.5 : isMobile ? 1 : 2}
                  sx={{
                    fontSize: isIPhone14ProMax ? "0.65rem" : isMobile ? "0.7rem" : undefined,
                  }}
                >
                  {getCurrentPeriodLabel()}: <strong>{getCurrentTotal()}</strong>
                </Typography>

                <Box
                  ref={chartContainerRef}
                  sx={{
                    height: chartHeight,
                    position: "relative",
                    ".tooltip": {
                      position: "absolute",
                      pointerEvents: "none",
                      opacity: 0,
                      transition: "opacity 0.2s",
                      zIndex: 10,
                      maxWidth: isIPhone14ProMax ? "120px" : isMobile ? "150px" : "200px",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  {hasData() ? (
                    <>
                      <svg ref={svgRef} width="100%" height="100%"></svg>
                      <div ref={tooltipRef} className="tooltip"></div>
                    </>
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <Typography
                        variant={isIPhone14ProMax ? "caption" : "body1"}
                        color="text.secondary"
                        sx={{ fontSize: isIPhone14ProMax ? "0.7rem" : undefined }}
                      >
                        No data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            )}
          </Card>
        </Box>
      </motion.div>
    </Container>
  )
}

export default AdminChart

