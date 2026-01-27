import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './Input.css';

export const Input = React.forwardRef(
  (
    {
      label,
      error,
      placeholder,
      type = 'text',
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      icon: Icon,
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);
    const inputRef = useRef(ref);

    const handleChange = (e) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    const handleFocus = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    return (
      <div className={`input-group ${className}`}>
        {label && (
          <motion.label
            className={`input-label ${isFocused || hasValue ? 'active' : ''}`}
            animate={{
              y: isFocused || hasValue ? -24 : 0,
              fontSize: isFocused || hasValue ? '12px' : '14px',
              opacity: isFocused || hasValue ? 1 : 0.7,
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="required">*</span>}
          </motion.label>
        )}

        <div className="input-wrapper">
          {Icon && (
            <span className="input-icon">
              {typeof Icon === 'string' ? Icon : <Icon />}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`input-field ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
            {...props}
          />
        </div>

        <motion.div
          className="input-error"
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: error ? 1 : 0,
            height: error ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.div>

        {helperText && !error && (
          <div className="input-helper">{helperText}</div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = React.forwardRef(
  (
    {
      label,
      error,
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      helperText,
      rows = 4,
      icon,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!value);

    const handleChange = (e) => {
      setHasValue(!!e.target.value);
      onChange?.(e);
    };

    const handleFocus = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      setHasValue(!!e.target.value);
      onBlur?.(e);
    };

    return (
      <div className={`textarea-group ${className}`}>
        {label && (
          <motion.label
            className={`textarea-label ${isFocused || hasValue ? 'active' : ''}`}
            animate={{
              y: isFocused || hasValue ? -24 : 0,
              fontSize: isFocused || hasValue ? '12px' : '14px',
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="required">*</span>}
          </motion.label>
        )}

        <div className="textarea-wrapper">
          {icon && (
            <span className="textarea-icon">
              {typeof icon === 'string' ? icon : <icon />}
            </span>
          )}
          <textarea
            ref={ref}
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={`textarea-field ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
            {...props}
          />
        </div>

        <motion.div
          className="textarea-error"
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: error ? 1 : 0,
            height: error ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.div>

        {helperText && !error && (
          <div className="textarea-helper">{helperText}</div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = React.forwardRef(
  (
    {
      label,
      error,
      value,
      onChange,
      onBlur,
      onFocus,
      disabled = false,
      required = false,
      options = [],
      placeholder = 'Válassz lehetőséget...',
      helperText,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = (e) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <div className={`select-group ${className}`}>
        {label && (
          <motion.label
            className={`select-label ${value ? 'active' : ''}`}
            animate={{
              y: value ? -24 : 0,
              fontSize: value ? '12px' : '14px',
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="required">*</span>}
          </motion.label>
        )}

        <select
          ref={ref}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className={`select-field ${error ? 'error' : ''} ${isFocused ? 'focused' : ''}`}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <motion.div
          className="select-error"
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: error ? 1 : 0,
            height: error ? 'auto' : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.div>

        {helperText && !error && (
          <div className="select-helper">{helperText}</div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => (
  <label className={`checkbox ${className}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="checkbox-input"
      {...props}
    />
    <span className="checkbox-mark">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    {label && <span className="checkbox-label">{label}</span>}
  </label>
);
