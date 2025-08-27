// src/components/ui/Input.js
import React, { forwardRef } from 'react';
import './Input.css';

const Input = forwardRef(
  (
    {
      label,
      error,
      helpText,
      size = 'medium',
      variant = 'default',
      fullWidth = false,
      theme = 'tsa',
      leftIcon,
      rightIcon,
      className = '',
      id,
      required = false,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseClass = 'input-field';
    const sizeClass = `input-field--${size}`;
    const variantClass = `input-field--${variant}`;
    const themeClass = `input-field--theme-${theme}`;
    const errorClass = error ? 'input-field--error' : '';
    const fullWidthClass = fullWidth ? 'input-field--full-width' : '';
    const hasIconsClass = leftIcon || rightIcon ? 'input-field--has-icons' : '';

    const wrapperClasses = ['input-wrapper', fullWidthClass, className].filter(Boolean).join(' ');

    const fieldClasses = [baseClass, sizeClass, variantClass, themeClass, errorClass, hasIconsClass]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && <span className="input-required">*</span>}
          </label>
        )}

        <div className="input-container">
          {leftIcon && <div className="input-icon input-icon--left">{leftIcon}</div>}

          <input
            ref={ref}
            id={inputId}
            className={fieldClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
            {...props}
          />

          {rightIcon && <div className="input-icon input-icon--right">{rightIcon}</div>}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="input-error" role="alert">
            {error}
          </div>
        )}

        {helpText && !error && (
          <div id={`${inputId}-help`} className="input-help">
            {helpText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;