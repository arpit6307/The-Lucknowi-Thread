import React, { useState } from 'react';
import '../assets/StarRating.css'; // Import the new CSS file

// Custom SVG Star Icon
const StarIcon = () => (
    <svg className="star-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const StarRating = ({ rating, setRating, readOnly = false }) => {
    const [hover, setHover] = useState(0);

    const effectiveRating = hover || rating;

    return (
        <div 
            className="star-rating-v2" 
            onMouseLeave={() => !readOnly && setHover(0)}
        >
            {[...Array(5)].map((_, index) => {
                const ratingValue = index + 1;
                
                const starColor = ratingValue <= effectiveRating ? '#ffc107' : 'transparent';
                
                return (
                    <label 
                        key={index} 
                        className="star-label"
                        onMouseEnter={() => !readOnly && setHover(ratingValue)}
                    >
                        <input
                            type="radio"
                            name="rating"
                            className="star-input"
                            value={ratingValue}
                            onClick={() => !readOnly && setRating(ratingValue)}
                            disabled={readOnly}
                        />
                        <div style={{ fill: starColor }}>
                            <StarIcon />
                        </div>
                    </label>
                );
            })}
        </div>
    );
};

export default StarRating;