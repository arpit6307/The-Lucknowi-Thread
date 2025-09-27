import React from 'react';
import '../assets/Loader.css'; // We will update this file next

const CustomLoader = ({ message = 'Loading...' }) => {
  return (
    <div className="loader-wrapper">
      {/* --- Main Loader Content --- */}
      <div className="loader-content">
        <div className="artisan-loader">
          <div className="loader-thread"></div>
          <div className="loader-thread"></div>
          <div className="loader-thread"></div>
          <div className="loader-thread"></div>
        </div>
        <p className="loader-message">{message}</p>
      </div>
      
      {/* --- New Footer Section --- */}
      <div className="loader-footer">
        <p>© 2025 The Lucknowi Thread. All rights reserved.</p>
        <p>Developed with ❤️ by Arpit Singh Yadav & Rituraj srivastava</p>
      </div>
    </div>
  );
};

export default CustomLoader;