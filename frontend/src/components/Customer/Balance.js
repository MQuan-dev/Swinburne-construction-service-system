"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "../../css/balance.css"

function Balance() {
  const [balance, setBalance] = useState("0.00")
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Fetch user profile for coin balance
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

        // Extract coin balance from the nested data structure
        if (response.data && response.data.data && response.data.data.coin_balance) {
          setBalance(response.data.data.coin_balance)
        } else {
          console.error("Unexpected response structure:", response.data)
          setBalance("0.00")
        }
      } catch (error) {
        console.error("Error fetching balance:", error)
        setBalance("0.00")
      }
    }

    // Fetch coin history
    const fetchCoinHistory = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        if (!token) {
          navigate("/login")
          return
        }

        const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/orders/coin-history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Check if response data is an array or nested in a data property
        const transactionsData = Array.isArray(response.data) ? response.data : response.data.data || []

        // Sort transactions by timestamp in descending order (newest first)
        const sortedTransactions = transactionsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        setTransactions(sortedTransactions)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
    fetchCoinHistory()
  }, [navigate])

  // Format date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get appropriate icon based on transaction type
  const getTransactionIcon = (type) => {
    switch (type) {
      case "deduction":
        return (
          <div className="transaction-icon payment">
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
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
        )
      case "refund":
        return (
          <div className="transaction-icon refund">
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
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </div>
        )
      default:
        return (
          <div className="transaction-icon deposit">
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
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <polyline points="19 12 12 19 5 12"></polyline>
            </svg>
          </div>
        )
    }
  }

  // Coin icon for the balance display
  const CoinIcon = () => (
    <div className="coin-icon">
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
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="6" x2="12" y2="12"></line>
        <line x1="12" y1="12" x2="16" y2="12"></line>
      </svg>
    </div>
  )

  return (
    <div className="balance-container">
      <h2>Account Balance</h2>

      <div className="balance-card">
        <div className="balance-header">
          <h3>Current Balance</h3>
          <div className="balance-amount-container">
            <CoinIcon />
            <div className="balance-amount">{loading ? "Loading..." : balance}</div>
          </div>
        </div>

        <div className="balance-actions">
          <button className="balance-btn deposit">Deposit Funds</button>
          <button className="balance-btn withdraw">Withdraw</button>
        </div>
      </div>

      <div className="transaction-history">
        <h3>Transaction History</h3>

        {loading ? (
          <div className="loading">Loading transaction history...</div>
        ) : (
          <div className="transaction-list">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div className="transaction-item" key={transaction.id}>
                  {getTransactionIcon(transaction.transaction_type)}
                  <div className="transaction-details">
                    <div className="transaction-title">{transaction.description}</div>
                    <div className="transaction-date">
                      {formatDate(transaction.timestamp)} • Order #{transaction.order}
                    </div>
                  </div>
                  <div
                    className={`transaction-amount ${transaction.transaction_type === "refund" ? "refund" : "payment"}`}
                  >
                    {transaction.transaction_type === "refund" ? "+" : "-"}
                    {transaction.amount}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-transactions">No transaction history available</div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Additional styles for the coin icon */
        .balance-amount-container {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .coin-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background-color:rgb(202, 174, 16);
          border-radius: 50%;
          color: #fff;
        }
        
        .coin-icon svg {
          stroke: #fff;
        }
      `}</style>
    </div>
  )
}

export default Balance

