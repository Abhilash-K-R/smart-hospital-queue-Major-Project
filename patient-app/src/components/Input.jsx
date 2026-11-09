import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Renders a labeled form control and forwards its ref to form libraries.
export const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  placeholder,
  className = '',
  id,
  required = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={effectiveType}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-10' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'} py-2.5 bg-slate-50 dark:bg-slate-900 border ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-800 focus:border-blue-600 focus:ring-blue-500'
          } rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-opacity-20 transition-all duration-200 ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-none"
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-slate-500" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
