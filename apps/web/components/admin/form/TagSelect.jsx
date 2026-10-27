'use client';

import FormGroup from './FormGroup';

const TAG_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'spicy', label: 'Spicy' },
  { value: 'new', label: 'New' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'signature', label: 'Signature' },
];

export default function TagSelect({
  label,
  value,
  onChange,
  error,
  required,
  hint,
  className = '',
}) {
  return (
    <FormGroup label={label} error={error} required={required} hint={hint} className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`form-select ${error ? 'error' : ''}`}
      >
        <option value="">Select a tag...</option>
        {TAG_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormGroup>
  );
}
