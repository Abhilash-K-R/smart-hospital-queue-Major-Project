import React from 'react';
import { motion } from 'framer-motion';

// Wraps content in a motion-enabled panel with optional glass and hover styling.
export const Card = ({
  children,
  className = '',
  glass = true,
  hover = true,
  onClick,
  ...props
}) => {
  return (
    <motion.div
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`rounded-2xl p-6 transition-all duration-300 ${
        glass
          ? 'glass-card'
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};
