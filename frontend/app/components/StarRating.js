// quick-queue/frontend/app/components/StarRating.js

"use client";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

export default function StarRating({ rating, onRatingChange, size = 20, editable = false, showValue = false }) {
  const handleStarClick = (index) => {
    if (!editable || !onRatingChange) return;
    
    // Click on left half = 0.5, click on right half = 1.0
    const newRating = index + 1;
    onRatingChange(newRating);
  };

  const handleStarHalfClick = (index) => {
    if (!editable || !onRatingChange) return;
    
    const newRating = index + 0.5;
    onRatingChange(newRating);
  };

  const renderStar = (index) => {
    const fillValue = rating - index;
    
    if (fillValue >= 1) {
      // Full star
      return (
        <FaStar 
          className="text-yellow-500" 
          size={size}
        />
      );
    } else if (fillValue > 0 && fillValue < 1) {
      // Half star
      return (
        <div className="relative inline-block">
          <FaRegStar className="text-yellow-500" size={size} />
          <div 
            className="absolute top-0 left-0 overflow-hidden" 
            style={{ width: `${fillValue * 100}%` }}
          >
            <FaStar className="text-yellow-500" size={size} />
          </div>
        </div>
      );
    } else {
      // Empty star
      return (
        <FaRegStar 
          className="text-gray-400" 
          size={size}
        />
      );
    }
  };

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <div 
          key={index} 
          className={`relative ${editable ? 'cursor-pointer' : ''}`}
          style={{ display: 'inline-block' }}
        >
          {editable ? (
            <div className="flex">
              {/* Left half - for 0.5 ratings */}
              <div
                className="w-1/2 h-full absolute left-0 z-10"
                onClick={() => handleStarHalfClick(index)}
                onMouseEnter={(e) => {
                  if (editable) {
                    e.currentTarget.parentElement.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (editable) {
                    e.currentTarget.parentElement.style.transform = 'scale(1)';
                  }
                }}
              />
              {/* Right half - for full ratings */}
              <div
                className="w-1/2 h-full absolute right-0 z-10"
                onClick={() => handleStarClick(index)}
                onMouseEnter={(e) => {
                  if (editable) {
                    e.currentTarget.parentElement.style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (editable) {
                    e.currentTarget.parentElement.style.transform = 'scale(1)';
                  }
                }}
              />
              <div className="transition-transform duration-150">
                {renderStar(index)}
              </div>
            </div>
          ) : (
            renderStar(index)
          )}
        </div>
      ))}
      {showValue && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
