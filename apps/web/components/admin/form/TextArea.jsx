'use client';

import FormGroup from './FormGroup';

export default function TextArea({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  placeholder,
  maxLength,
  rows = 4,
  className = '',
  ...props
}) {
  return (
    <FormGroup label={label} error={error} required={required} hint={hint}>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        className={`form-textarea ${error ? 'error' : ''} ${className}`}
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
