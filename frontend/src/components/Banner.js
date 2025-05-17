import React from 'react';

const Banner = () => (
  <div className="banner">
    <div className="banner-content">
      <h1 className="text-4xl font-bold mb-4">Find Your Perfect Home Service</h1>
      <p>Professional Construction Services for Every Project</p>
      <div className="banner-search">
        <button 
          className="banner-button" 
          onClick={() => document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' })}
        >
          Explore More!!
        </button>
      </div>
    </div>
  </div>
);

export default Banner;

