import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  maxWidth?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className,
  maxWidth = 250
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      
      let x = 0;
      let y = 0;
      
      switch (position) {
        case 'top':
          x = triggerRect.left + triggerRect.width / 2;
          y = triggerRect.top - 8;
          break;
        case 'bottom':
          x = triggerRect.left + triggerRect.width / 2;
          y = triggerRect.bottom + 8;
          break;
        case 'left':
          x = triggerRect.left - 8;
          y = triggerRect.top + triggerRect.height / 2;
          break;
        case 'right':
          x = triggerRect.right + 8;
          y = triggerRect.top + triggerRect.height / 2;
          break;
      }
      
      setCoords({ x, y });
    }
  }, [isVisible, position]);

  const getTooltipStyles = () => {
    const styles: React.CSSProperties = {
      maxWidth: `${maxWidth}px`
    };
    
    if (tooltipRef.current && coords.x && coords.y) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      switch (position) {
        case 'top':
          styles.left = `${coords.x}px`;
          styles.top = `${coords.y}px`;
          styles.transform = 'translate(-50%, -100%)';
          break;
        case 'bottom':
          styles.left = `${coords.x}px`;
          styles.top = `${coords.y}px`;
          styles.transform = 'translate(-50%, 0)';
          break;
        case 'left':
          styles.left = `${coords.x}px`;
          styles.top = `${coords.y}px`;
          styles.transform = 'translate(-100%, -50%)';
          break;
        case 'right':
          styles.left = `${coords.x}px`;
          styles.top = `${coords.y}px`;
          styles.transform = 'translate(0, -50%)';
          break;
      }
    }
    
    return styles;
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-block"
      >
        {children}
      </div>
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            style={getTooltipStyles()}
            className={cn("fixed z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-800 rounded-lg shadow-lg pointer-events-none", className)}
          >
            {content}
            <div
              className={cn(
                "absolute w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45",
                position === 'top' && "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
                position === 'bottom' && "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
                position === 'left' && "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
                position === 'right' && "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}