import React from 'react';
import { cn } from '../utils';

export interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "bg-white/70 backdrop-blur-[20px] border border-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface GlassButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}

export const GlassButton = ({ children, className, variant = 'primary', ...props }: GlassButtonProps) => {
  const variants = {
    primary: "bg-gradient-to-r from-[#4facfe] to-[#00f2fe] text-white border-transparent shadow-[0_10px_25px_rgba(79,172,254,0.3)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(79,172,254,0.4)] font-bold",
    secondary: "bg-white/50 hover:bg-white/80 text-[#1e293b] border-white/60 shadow-sm",
    danger: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border-rose-500/20 font-bold",
    ghost: "bg-transparent hover:bg-black/5 text-[#64748b] hover:text-[#1e293b] border-transparent font-bold",
  };

  return (
    <button
      className={cn(
        "px-5 py-2.5 rounded-2xl border backdrop-blur-sm transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none font-sans",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export interface GlassInputProps {
  className?: string;
  [key: string]: any;
}

export const GlassInput = ({ className, ...props }: GlassInputProps) => {
  return (
    <input
      className={cn(
        "bg-white/80 backdrop-blur-sm border border-black/5 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:border-[#4facfe] focus:ring-[4px] focus:ring-[#4facfe]/10 transition-all placeholder:text-[#94a3b8] text-[#1e293b] font-bold",
        className
      )}
      {...props}
    />
  );
};

export interface GlassSelectProps {
  options: { value: string; label: string }[];
  className?: string;
  [key: string]: any;
}

export const GlassSelect = ({ options, className, ...props }: GlassSelectProps) => {
  return (
    <select
      className={cn(
        "bg-white/80 backdrop-blur-sm border border-black/5 rounded-2xl px-5 py-3 outline-none focus:bg-white focus:border-[#4facfe] focus:ring-[4px] focus:ring-[#4facfe]/10 transition-all text-[#1e293b] font-bold appearance-none cursor-pointer",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white font-sans">
          {opt.label}
        </option>
      ))}
    </select>
  );
};
