'use client';

import FormGroup from './FormGroup';

export default function TextInput({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  placeholder,
  type = 'text',
  maxLength,
  className = '',
  ...props
}) {
  return (
    <FormGroup label={label} error={error} required={required} hint={hint}>
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`form-input ${error ? 'error' : ''} ${className}`}
        {...props}
      />
      {maxLength && (
        <p className="form-counter">
          {(value || '').length}/{maxLength}
        </p>
      )}
    </FormGroup>
  );
}
