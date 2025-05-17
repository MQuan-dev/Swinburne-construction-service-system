"use client"

import { useState } from "react"

const MobileNavToggle = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mobile-nav-container">
      <button
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
      >
        <span className="sr-only">Menu</span>
        <div className={`hamburger ${isOpen ? "open" : ""}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      <div id="mobile-navigation" className={`mobile-nav ${isOpen ? "open" : ""}`}>
        {children}
      </div>
    </div>
  )
}

export default MobileNavToggle

