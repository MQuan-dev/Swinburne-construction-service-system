import "../../css/helpsupport.css";


import { useState } from "react"

function HelpSupport() {
  const [activeTab, setActiveTab] = useState("faq")
  const [message, setMessage] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    alert("Your message has been sent. Our support team will get back to you soon.")
    setMessage("")
  }

  return (
    <div className="help-support-container">
      <h2>Help & Support</h2>

      <div className="support-tabs">
        <button className={`tab-btn ${activeTab === "faq" ? "active" : ""}`} onClick={() => setActiveTab("faq")}>
          FAQ
        </button>
        <button
          className={`tab-btn ${activeTab === "contact" ? "active" : ""}`}
          onClick={() => setActiveTab("contact")}
        >
          Contact Support
        </button>
        <button className={`tab-btn ${activeTab === "guides" ? "active" : ""}`} onClick={() => setActiveTab("guides")}>
          User Guides
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "faq" && (
          <div className="faq-section">
            <div className="faq-item">
              <h3>How do I create a new order?</h3>
              <p>
                To create a new order, navigate to the "Create Order" section from the sidebar menu. Fill in all the
                required details about your project, upload any relevant files, and submit your order.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I select a constructor for my project?</h3>
              <p>
                After creating an order, constructors will submit quotations for your project. You can view these
                quotations in the order details page and select the one that best meets your requirements.
              </p>
            </div>

            <div className="faq-item">
              <h3>What happens after I select a quotation?</h3>
              <p>
                Once you select a quotation, the order status will change to "Constructor Selected". You'll then need to
                sign a contract with the constructor before work begins.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I make payments for my orders?</h3>
              <p>
                Payments can be made through your account balance. You can deposit funds to your balance and then use
                those funds to pay for orders.
              </p>
            </div>

            <div className="faq-item">
              <h3>What if I'm not satisfied with the work?</h3>
              <p>
                If you're not satisfied with the work, you can raise a dispute through the platform. Our support team
                will review the case and help resolve the issue.
              </p>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="contact-section">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="helpform-group">
                <label htmlFor="subject">Subject</label>
                <select id="subject" required>
                  <option value="">Select a subject</option>
                  <option value="order">Order Issue</option>
                  <option value="payment">Payment Problem</option>
                  <option value="account">Account Question</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="helpform-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows="6"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Describe your issue or question in detail..."
                ></textarea>
              </div>

              <div className="helpform-group">
                <label htmlFor="attachment">Attachment (optional)</label>
                <input type="file" id="attachment" />
              </div>

              <button type="submit" className="submit-btn">
                Send Message
              </button>
            </form>

            <div className="contact-info">
              <h3>Other Ways to Reach Us</h3>
              <p>
                <strong>Email:</strong> support@constructionportal.com
              </p>
              <p>
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
              <p>
                <strong>Hours:</strong> Monday-Friday, 9am-5pm EST
              </p>
            </div>
          </div>
        )}

        {activeTab === "guides" && (
          <div className="guides-section">
            <div className="guide-card">
              <div className="guide-icon">
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
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
              </div>
              <h3>Getting Started Guide</h3>
              <p>Learn the basics of using our platform, from creating your account to placing your first order.</p>
              <a href="#" className="guide-link">
                Read Guide
              </a>
            </div>

            <div className="guide-card">
              <div className="guide-icon">
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
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
              </div>
              <h3>Order Management</h3>
              <p>Detailed instructions on how to create, manage, and track your construction orders.</p>
              <a href="#" className="guide-link">
                Read Guide
              </a>
            </div>

            <div className="guide-card">
              <div className="guide-icon">
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
              <h3>Payment Guide</h3>
              <p>Learn how to manage your account balance, make payments, and handle refunds.</p>
              <a href="#" className="guide-link">
                Read Guide
              </a>
            </div>

            <div className="guide-card">
              <div className="guide-icon">
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>Contract Management</h3>
              <p>Everything you need to know about contracts, from signing to completion.</p>
              <a href="#" className="guide-link">
                Read Guide
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HelpSupport

