import React, { useEffect, useRef } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';

const SmoothScroll = ({ children }) => {
  useEffect(() => {
    // Locomotive Scroll v5 is zero-config and handles its own instance
    const scroll = new LocomotiveScroll();

    return () => {
      if (scroll) scroll.destroy();
    };
  }, []);

  return (
    <div data-scroll-container>
      {children}
    </div>
  );
};

export default SmoothScroll;
