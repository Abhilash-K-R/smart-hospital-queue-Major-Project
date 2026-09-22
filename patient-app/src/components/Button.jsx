import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Provides shared button variants while forwarding native interaction props.
export const Button = ({
  children,
  variant = 'primary', // primary, secondary, accent, danger, outline, ghost
  size = 'md', // sm, md, lg
  className = '',
  icon: Icon,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer active:scale-95";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-lg shadow-blue-500/25 focus:ring-blue-500 border border-blue-500/30",
    secondary: "bg-slate-800 hover:bg-slate-900 disabled:bg-slate-600 text-white dark:bg-slate-700 dark:hover:bg-slate-600 focus:ring-slate-500",
    accent: "bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white shadow-lg shadow-cyan-500/25 focus:ring-cyan-400",
    danger: "bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white shadow-lg shadow-red-500/25 focus:ring-red-500",
    outline: "border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent",
    ghost: "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  return (
    <motion.button
      whileHover={!isDisabled ? { y: -1 } : {}}
      whileTap={!isDisabled ? { scale: 0.97 } : {}}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}
      {children}
    </motion.button>
  );
};

