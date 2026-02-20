// quick-queue/frontend/app/components/ImageCarousel.js

"use client";
import { useState } from "react";
import { IoChevronBack, IoChevronForward, IoBusinessOutline } from "react-icons/io5";

export default function ImageCarousel({ images = [], alt = "Service", className = "" }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ensure images is an array and filter out empty strings
  const validImages = Array.isArray(images) 
    ? images.filter(img => img && img.trim() !== '') 
    : [];

  const hasMultipleImages = validImages.length > 1;

  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? validImages.length - 1 : prevIndex - 1
    );
  };

  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) =>
      prevIndex === validImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const goToSlide = (index, e) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  // If no images, show placeholder
  if (validImages.length === 0) {
    return (
      <div className={`relative bg-gradient-to-br from-purple-500 to-purple-600 ${className}`}>
        <div className="w-full h-full flex items-center justify-center">
          <IoBusinessOutline size={64} className="text-white/50" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {/* Main Image */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={validImages[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.querySelector('.fallback-icon')?.classList.remove('hidden');
          }}
        />
        <div className="fallback-icon hidden absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
          <IoBusinessOutline size={64} className="text-white/50" />
        </div>
      </div>

      {/* Navigation Arrows - Only show if multiple images */}
      {hasMultipleImages && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer outline-none z-10"
            aria-label="Previous image"
          >
            <IoChevronBack size={20} />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer outline-none z-10"
            aria-label="Next image"
          >
            <IoChevronForward size={20} />
          </button>
        </>
      )}

      {/* Dots Indicator - Only show if multiple images */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => goToSlide(index, e)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer outline-none ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image Counter - Only show if multiple images */}
      {hasMultipleImages && (
        <div className="absolute top-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium z-10">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}
    </div>
  );
}
