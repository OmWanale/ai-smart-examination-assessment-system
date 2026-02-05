export function Button({ children, variant = 'primary', size = 'md', className = '', disabled = false, ...props }) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-warm focus:ring-primary-400 dark:from-primary-600 dark:to-primary-700 dark:hover:from-primary-500 dark:hover:to-primary-600',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 shadow-md hover:shadow-warm focus:ring-secondary-400 dark:from-secondary-600 dark:to-secondary-700',
    outline: 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 focus:ring-primary-400 dark:border-primary-400 dark:text-primary-400 dark:hover:bg-dark-hover',
    danger: 'bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700 shadow-md focus:ring-error-400 dark:from-error-600 dark:to-error-700',
    ghost: 'text-text-dark hover:bg-primary-100 focus:ring-primary-400 dark:text-stone-200 dark:hover:bg-dark-hover',
    success: 'bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-500 shadow-md focus:ring-success-400',
  };

  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ label, error, helper, className = '', icon, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 dark:text-stone-500">
            {icon}
          </div>
        )}
        <input
          className={`input ${icon ? 'pl-10' : ''} ${error ? 'border-error-500 focus:ring-error-400 focus:border-error-400 dark:border-error-500' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-error-500 text-sm mt-1.5 flex items-center gap-1"><span>⚠</span>{error}</p>}
      {helper && !error && <p className="text-text-muted text-sm mt-1.5 dark:text-stone-400">{helper}</p>}
    </div>
  );
}

export function Textarea({ label, error, helper, className = '', rows = 4, ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea
        rows={rows}
        className={`input resize-none ${error ? 'border-error-500 focus:ring-error-400' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-error-500 text-sm mt-1.5">{error}</p>}
      {helper && !error && <p className="text-text-muted text-sm mt-1.5 dark:text-stone-400">{helper}</p>}
    </div>
  );
}

export function Select({ label, error, options = [], placeholder, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select
        className={`input appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="%2378716C"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25rem] pr-10 ${error ? 'border-error-500 focus:ring-error-400' : ''} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <p className="text-error-500 text-sm mt-1.5">{error}</p>}
    </div>
  );
}

export function Card({ children, className = '', hover = false, padding = 'normal', ...props }) {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    normal: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={`bg-white rounded-xl shadow-md border border-primary-100 dark:bg-dark-card dark:border-dark-border dark:shadow-dark ${paddingClasses[padding]} ${hover ? 'hover:shadow-lg hover:scale-[1.01] cursor-pointer' : ''} transition-all duration-300 ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div>
        <h3 className="text-lg font-display font-semibold text-text-dark dark:text-stone-100">{title}</h3>
        {subtitle && <p className="text-sm text-text-muted mt-0.5 dark:text-stone-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Alert({ type = 'info', children, className = '', dismissible = false, onDismiss }) {
  const typeClasses = {
    info: 'bg-info-50 border border-info-100 text-info-600 dark:bg-info-600/20 dark:text-info-500 dark:border-info-600/30',
    success: 'bg-success-50 border border-success-100 text-success-600 dark:bg-success-600/20 dark:text-success-500 dark:border-success-600/30',
    warning: 'bg-warning-50 border border-warning-100 text-warning-600 dark:bg-warning-600/20 dark:text-warning-500 dark:border-warning-600/30',
    error: 'bg-error-50 border border-error-100 text-error-600 dark:bg-error-600/20 dark:text-error-500 dark:border-error-600/30',
  };

  const icons = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className={`rounded-lg p-4 flex items-start gap-3 animate-fade-in ${typeClasses[type]} ${className}`}>
      <span className="text-lg flex-shrink-0">{icons[type]}</span>
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 hover:opacity-70 transition-opacity">✕</button>
      )}
    </div>
  );
}

export function Badge({ children, variant = 'primary', size = 'md', className = '' }) {
  const variantClasses = {
    primary: 'bg-primary-100 text-primary-700 dark:bg-primary-800/40 dark:text-primary-300',
    secondary: 'bg-secondary-100 text-secondary-700 dark:bg-secondary-800/40 dark:text-secondary-300',
    accent: 'bg-accent-100 text-accent-700 dark:bg-accent-800/40 dark:text-accent-300',
    success: 'bg-success-100 text-success-600 dark:bg-success-600/30 dark:text-success-500',
    warning: 'bg-warning-100 text-warning-600 dark:bg-warning-600/30 dark:text-warning-500',
    error: 'bg-error-100 text-error-600 dark:bg-error-600/30 dark:text-error-500',
    neutral: 'bg-stone-100 text-stone-600 dark:bg-stone-700/40 dark:text-stone-300',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-semibold ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

export function Spinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 dark:border-dark-border dark:border-t-primary-500 ${sizeClasses[size]} ${className}`} />
  );
}

export function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-xl p-6 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-text-dark dark:text-stone-100 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="text-center py-12 px-6">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-display font-semibold text-text-dark dark:text-stone-100 mb-2">{title}</h3>
      {description && <p className="text-text-muted dark:text-stone-400 mb-6 max-w-md mx-auto">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function Divider({ className = '' }) {
  return <div className={`h-px bg-gradient-to-r from-transparent via-primary-200 to-transparent dark:via-dark-border ${className}`} />;
}

export function Avatar({ name, src, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';

  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`rounded-full object-cover ${sizeClasses[size]} ${className}`} 
      />
    );
  }

  return (
    <div className={`rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 text-white font-semibold flex items-center justify-center ${sizeClasses[size]} ${className}`}>
      {initials}
    </div>
  );
}

export function ProgressBar({ value, max = 100, showLabel = false, variant = 'primary', className = '' }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600',
    success: 'bg-gradient-to-r from-success-500 to-success-600',
    error: 'bg-gradient-to-r from-error-500 to-error-600',
  };

  return (
    <div className={className}>
      <div className="h-2 bg-stone-200 dark:bg-dark-border rounded-full overflow-hidden">
        <div 
          className={`h-full ${variantClasses[variant]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-text-muted dark:text-stone-400 mt-1">{Math.round(percentage)}%</p>
      )}
    </div>
  );
}

