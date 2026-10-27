'use client';

export default function FormGroup({
  label,
  error,
  required,
  hint,
  children,
  className = '',
}) {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          <span>{label}</span>
          <span className="form-label-colon">:</span>
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      {children}
      {error && <p className="form-error">{error}</p>}
      {hint && !error && <p className="form-hint">{hint}</p>}
    </div>
  );
}
