"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Chart from "chart.js/auto"
import "../../css/statistics.css"

const Statistics = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [contractMoneyData, setContractMoneyData] = useState([])
  const [coinHistoryData, setCoinHistoryData] = useState([])
  const [completedOrdersData, setCompletedOrdersData] = useState([])
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalSpent: 0,
    totalOrders: 0,
    totalRefunds: 0,
    totalDeductions: 0,
  })

  // Chart refs
  const contractMoneyChartRef = useRef(null)
  const coinHistoryChartRef = useRef(null)
  const completedOrdersChartRef = useRef(null)

  // Chart instances
  const contractMoneyChartInstance = useRef(null)
  const coinHistoryChartInstance = useRef(null)
  const completedOrdersChartInstance = useRef(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("accessToken")
        if (!token) {
          navigate("/login")
          return
        }

        // Fetch contract money history
        const contractMoneyResponse = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/orders/contract-money-history/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        const contractMoneyResult = await contractMoneyResponse.json()

        // Fetch coin history
        const coinHistoryResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/orders/coin-history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const coinHistoryResult = await coinHistoryResponse.json()

        // Fetch completed orders
        const completedOrdersResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/orders/completed-orders/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        const completedOrdersResult = await completedOrdersResponse.json()

        // Process and set data
        setContractMoneyData(contractMoneyResult.data || [])
        setCoinHistoryData(coinHistoryResult || [])
        setCompletedOrdersData(completedOrdersResult || [])

        // Calculate summary statistics
        const totalSpent = contractMoneyResult.data?.reduce((sum, item) => sum + item.total_income, 0) || 0
        const totalOrders = completedOrdersResult?.length || 0

        const totalRefunds =
          coinHistoryResult
            ?.filter((item) => item.transaction_type === "refund")
            .reduce((sum, item) => sum + Number.parseFloat(item.amount), 0) || 0

        const totalDeductions =
          coinHistoryResult
            ?.filter((item) => item.transaction_type === "deduction")
            .reduce((sum, item) => sum + Number.parseFloat(item.amount), 0) || 0

        setStats({
          totalSpent,
          totalOrders,
          totalRefunds,
          totalDeductions,
        })
      } catch (err) {
        console.error("Error fetching statistics data:", err)
        setError("Failed to load statistics. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Cleanup function to destroy chart instances
    return () => {
      if (contractMoneyChartInstance.current) {
        contractMoneyChartInstance.current.destroy()
      }
      if (coinHistoryChartInstance.current) {
        coinHistoryChartInstance.current.destroy()
      }
      if (completedOrdersChartInstance.current) {
        completedOrdersChartInstance.current.destroy()
      }
    }
  }, [navigate])

  // Create/update charts when data changes
  useEffect(() => {
    if (!loading) {
      // Contract Money Chart
      if (contractMoneyChartRef.current && contractMoneyData.length > 0) {
        if (contractMoneyChartInstance.current) {
          contractMoneyChartInstance.current.destroy()
        }

        const labels = contractMoneyData.map((item) => {
          const date = new Date(item.month)
          return `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`
        })

        const data = contractMoneyData.map((item) => item.total_income)

        contractMoneyChartInstance.current = new Chart(contractMoneyChartRef.current, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Contract Money",
                data: data,
                backgroundColor: "rgba(54, 162, 235, 0.6)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Amount",
                },
              },
            },
          },
        })
      }

      // Coin History Chart
      if (coinHistoryChartRef.current && coinHistoryData.length > 0) {
        if (coinHistoryChartInstance.current) {
          coinHistoryChartInstance.current.destroy()
        }

        // Group by month and transaction type
        const coinDataByMonth = coinHistoryData.reduce((acc, item) => {
          const date = new Date(item.timestamp)
          const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

          if (!acc[monthYear]) {
            acc[monthYear] = { refund: 0, deduction: 0 }
          }

          if (item.transaction_type === "refund") {
            acc[monthYear].refund += Number.parseFloat(item.amount)
          } else if (item.transaction_type === "deduction") {
            acc[monthYear].deduction += Number.parseFloat(item.amount)
          }

          return acc
        }, {})

        const labels = Object.keys(coinDataByMonth)
        const refundData = labels.map((month) => coinDataByMonth[month].refund)
        const deductionData = labels.map((month) => coinDataByMonth[month].deduction)

        coinHistoryChartInstance.current = new Chart(coinHistoryChartRef.current, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Refunds",
                data: refundData,
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 2,
                tension: 0.1,
              },
              {
                label: "Deductions",
                data: deductionData,
                backgroundColor: "rgba(255, 99, 132, 0.2)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 2,
                tension: 0.1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Coins",
                },
              },
            },
          },
        })
      }

      // Completed Orders Chart
      if (completedOrdersChartRef.current && completedOrdersData.length > 0) {
        if (completedOrdersChartInstance.current) {
          completedOrdersChartInstance.current.destroy()
        }

        // Group completed orders by month
        const ordersByMonth = completedOrdersData.reduce((acc, order) => {
          const date = new Date(order.updated_at)
          const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

          if (!acc[monthYear]) {
            acc[monthYear] = 0
          }

          acc[monthYear]++
          return acc
        }, {})

        const labels = Object.keys(ordersByMonth)
        const data = labels.map((month) => ordersByMonth[month])

        completedOrdersChartInstance.current = new Chart(completedOrdersChartRef.current, {
          type: "bar",
          data: {
            labels: labels,
            datasets: [
              {
                label: "Completed Orders",
                data: data,
                backgroundColor: "rgba(153, 102, 255, 0.6)",
                borderColor: "rgba(153, 102, 255, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1,
                },
                title: {
                  display: true,
                  text: "Number of Orders",
                },
              },
            },
          },
        })
      }
    }
  }, [loading, contractMoneyData, coinHistoryData, completedOrdersData])

  if (error) {
    return <div className="error-container">{error}</div>
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h1>Statistics Dashboard</h1>
        <p>View your activity and financial statistics</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
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
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Contract Money</h3>
            <p className="stat-value">{formatCurrency(stats.totalSpent)}</p>
            <p className="stat-change positive">Lifetime Income</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Completed Orders</h3>
            <p className="stat-value">{stats.totalOrders}</p>
            <p className="stat-change positive">Successfully completed</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Coin Refunds</h3>
            <p className="stat-value">{stats.totalRefunds}</p>
            <p className="stat-change positive">Coins refunded</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
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
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div className="stat-content">
            <h3>Total Coin Deductions</h3>
            <p className="stat-value">{stats.totalDeductions}</p>
            <p className="stat-change negative">Coins spent</p>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Contract Money by Month</h3>
          </div>
          <div className="chart-wrapper">
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
            {!loading && contractMoneyData.length === 0 ? (
              <div className="no-data-message">No contract money data available</div>
            ) : (
              <canvas ref={contractMoneyChartRef}></canvas>
            )}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Coin Transactions by Month</h3>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: "rgba(75, 192, 192, 1)" }}></div>
                <span>Refunds</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: "rgba(255, 99, 132, 1)" }}></div>
                <span>Deductions</span>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            {loading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
              </div>
            )}
            {!loading && coinHistoryData.length === 0 ? (
              <div className="no-data-message">No coin history data available</div>
            ) : (
              <canvas ref={coinHistoryChartRef}></canvas>
            )}
          </div>
        </div>
      </div>

      <div className="chart-container">
        <div className="chart-header">
          <h3>Completed Orders by Month</h3>
        </div>
        <div className="chart-wrapper">
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
            </div>
          )}
          {!loading && completedOrdersData.length === 0 ? (
            <div className="no-data-message">No completed orders data available</div>
          ) : (
            <canvas ref={completedOrdersChartRef}></canvas>
          )}
        </div>
      </div>
    </div>
  )
}

export default Statistics

