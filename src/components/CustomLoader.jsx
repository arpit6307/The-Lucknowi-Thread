import React from 'react';
import '../assets/Loader.css';

const CustomLoader = ({ message = 'Unveiling Artistry...' }) => {
  return (
    <div className="loader-wrapper">
      <div className="loader-content">
        
        {/* --- THE FINAL & PERFECTED LOADER --- */}
        <div className="digital-fabric-loader">
          <svg className="pattern-svg" viewBox="0 0 100 100">
            {/* Outer Rays (As requested) */}
            <path className="pattern-path" d="M50 2 L50 15 M50 98 L50 85 M2 50 L15 50 M98 50 L85 50 M16 16 L25 25 M84 84 L75 75 M16 84 L25 75 M84 16 L75 25"></path>
            
            {/* NEW: Inner Circles like a Sun */}
            <circle className="pattern-path delay-1" cx="50" cy="50" r="35" fill="none"></circle>
            <circle className="pattern-path delay-2" cx="50" cy="50" r="25" fill="none"></circle>
          </svg>
          
          <div className="logo-container">
            <span className="logo-T">T</span>
            <span className="logo-L">L</span>
            <span className="logo-T">T</span>
          </div>
        </div>

        <p className="loader-message">{message}</p>
      </div>
      
      <div className="loader-footer">
        <p>© 2025 The Lucknowi Thread</p>
        <p>Developed with ❤️ by Arpit Singh Yadav & Rituraj srivastava</p>
      </div>
    </div>
  );
};

export default CustomLoader;
