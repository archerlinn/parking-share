"use client";

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles = 'block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-rose-600 sm:text-sm';
    const errorStyles = error ? 'ring-red-500 focus:ring-red-500' : 'ring-gray-300';
    const widthStyle = fullWidth ? 'w-full' : '';
    
    return (
      <div className={`${widthStyle} ${className}`}>
        {label && (
          <label htmlFor={props.id} className="block text-sm font-medium leading-6 text-gray-900 mb-1">
            {label}
          </label>
        )}
        <div>
          <input
            ref={ref}
            className={`${baseStyles} ${errorStyles}`}
            {...props}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input; 