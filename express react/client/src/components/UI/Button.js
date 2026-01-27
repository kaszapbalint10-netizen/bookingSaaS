import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      icon: Icon,
      iconPosition = 'left',
      onClick,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      type={type}
      className={`btn btn-${variant} btn-${size} ${fullWidth ? 'full-width' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { y: -2 } : {}}
      whileTap={!disabled && !loading ? { y: 0 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-loader" />
          <span className="btn-text">{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="btn-icon" />}
          <span className="btn-text">{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="btn-icon" />}
        </>
      )}
    </motion.button>
  )
);

Button.displayName = 'Button';

export const IconButton = React.forwardRef(
  (
    {
      icon: Icon,
      label,
      variant = 'secondary',
      size = 'md',
      disabled = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      className={`icon-btn icon-btn-${variant} icon-btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
      aria-label={label}
      title={label}
      {...props}
    >
      {Icon && <Icon className="icon-btn-icon" />}
    </motion.button>
  )
);

IconButton.displayName = 'IconButton';

export const ButtonGroup = ({ children, className = '' }) => (
  <div className={`btn-group ${className}`}>{children}</div>
);
