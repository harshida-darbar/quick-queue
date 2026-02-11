// quick-queue/frontend/app/components/InfiniteScroll.js

"use client";
import { useEffect, useRef, useCallback } from 'react';

const InfiniteScroll = ({ 
  children, 
  dataLength, 
  next, 
  hasMore, 
  loader, 
  endMessage 
}) => {
  const observerRef = useRef();
  const loadingRef = useRef();

  const lastElementRef = useCallback(node => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        next();
      }
    });
    if (node) observerRef.current.observe(node);
  }, [hasMore, next]);

  return (
    <div>
      {children}
      {hasMore && (
        <div ref={lastElementRef} className="w-full">
          {loader}
        </div>
      )}
      {!hasMore && endMessage}
    </div>
  );
};

export default InfiniteScroll;