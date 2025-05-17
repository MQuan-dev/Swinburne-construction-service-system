"use client"

const UserProfileModal = ({ profile, onClose }) => {
  if (!profile) return null

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.className === "modal-overlay") onClose()
      }}
    >
      <div className="user-profile-modal">
        <div className="modal-header">
          <h2>User Profile</h2>
          <button className="modal-close-x" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="user-profile-content">
          <div className="user-profile-summary">
            <div className="user-role-badge">
              <span className={`role-badge ${profile.role}`}>{profile.role}</span>
              <span className={`status-badge ${profile.account_status}`}>{profile.account_status}</span>
            </div>
            <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-icon">⭐</span>
                  <span className="stat-value">{profile.average_rating}</span>
                  <span className="stat-label">Rating</span>
                </div>
                <div className="stat-item">
                  <span className="stat-icon">✓</span>
                  <span className="stat-value">{profile.completed_orders_count}</span>
                  <span className="stat-label">Completed Orders</span>
                </div>
            </div>
          </div>

          <div className="user-profile-details">
            <div className="detail-section">
              <h3>Account Information</h3>
              <div className="detail-row">
                <span className="detail-label">Username:</span>
                <span className="detail-value">{profile.username}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {profile.first_name} {profile.last_name}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{profile.email}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Member Since:</span>
                <span className="detail-value">{new Date(profile.date_joined).toLocaleDateString()}</span>
              </div>
            </div>

            {(profile.phone_number || profile.tax_code || profile.company_name) && (
              <div className="detail-section">
                <h3>Business Information</h3>
                {profile.phone_number && (
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{profile.phone_number}</span>
                  </div>
                )}
                {profile.company_name && (
                  <div className="detail-row">
                    <span className="detail-label">Company:</span>
                    <span className="detail-value">{profile.company_name}</span>
                  </div>
                )}
                {profile.tax_code && (
                  <div className="detail-row">
                    <span className="detail-label">Tax Code:</span>
                    <span className="detail-value">{profile.tax_code}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserProfileModal

