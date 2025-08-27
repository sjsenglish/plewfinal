import React from 'react';
import { Link } from 'react-router-dom'; // Import at the top
import { tokens } from '../../styles/tokens';
import './Button.css';

const Button = ({
  children,
  variant = 'primary', // primary, secondary, ghost, danger, success, outline, link
  size = 'medium', // small, medium, large
  disabled = false,
  loading = false,
  fullWidth = false,
  theme = 'tsa', // tsa, plew, maths
  onClick,
  type = 'button',
  className = '',
  as: Component = 'button',
  to,
  href,
  ...props
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const themeClass = `btn--theme-${theme}`;
  const disabledClass = disabled ? 'btn--disabled' : '';
  const loadingClass = loading ? 'btn--loading' : '';
  const fullWidthClass = fullWidth ? 'btn--full-width' : '';

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    themeClass,
    disabledClass,
    loadingClass,
    fullWidthClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  // Handle different component types
  if (Component === 'Link' || to) {
    return (
      <Link to={to} className={classes} onClick={handleClick} {...props}>
        {loading && <span className="btn__spinner" />}
        <span className={`btn__content ${loading ? 'btn__content--loading' : ''}`}>{children}</span>
      </Link>
    );
  }

  if (Component === 'a' || href) {
    return (
      <a href={href} className={classes} onClick={handleClick} {...props}>
        {loading && <span className="btn__spinner" />}
        <span className={`btn__content ${loading ? 'btn__content--loading' : ''}`}>{children}</span>
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="btn__spinner" />}
      <span className={`btn__content ${loading ? 'btn__content--loading' : ''}`}>{children}</span>
    </button>
  );
};

export default Button;