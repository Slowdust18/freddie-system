'use client';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
  onDismiss?: () => void;
}

const variantStyles: Record<NonNullable<ToastProps['variant']>, string> = {
  success: 'border-green-500/60 bg-green-500/10 text-green-200',
  error: 'border-red-500/60 bg-red-500/10 text-red-200',
  info: 'border-blue-500/60 bg-blue-500/10 text-blue-200',
};

export default function Toast({ message, variant = 'info', onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${variantStyles[variant]}`}
      >
        <span className="text-sm font-medium leading-5">{message}</span>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs uppercase tracking-wide text-current transition hover:opacity-80"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
