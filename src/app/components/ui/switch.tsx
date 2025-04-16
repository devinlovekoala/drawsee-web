import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Switch({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
}: SwitchProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
          checked ? "bg-indigo-600" : "bg-gray-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={handleToggle}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
      {label && (
        <span
          className={cn(
            "text-sm font-medium text-gray-900",
            disabled && "text-gray-400"
          )}
          onClick={!disabled ? handleToggle : undefined}
          style={{ cursor: disabled ? 'default' : 'pointer' }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default Switch; 