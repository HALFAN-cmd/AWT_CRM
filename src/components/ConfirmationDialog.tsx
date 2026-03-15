import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { GlassCard, GlassButton } from './GlassUI';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary'
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/20 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-md"
          >
            <GlassCard className="p-10 shadow-[0_30px_60px_rgba(0,0,0,0.15)] border-white/60">
              <div className="flex items-start gap-6 mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                  variant === 'danger' 
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                    : 'bg-[#4facfe]/10 text-[#4facfe] border border-[#4facfe]/20'
                }`}>
                  <AlertCircle size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-2xl font-extrabold text-[#1e293b] mb-3 font-display">{title}</h3>
                  <p className="text-[#64748b] font-bold leading-relaxed">{message}</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[#64748b] hover:bg-black/10 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="flex gap-4 justify-end">
                <GlassButton variant="ghost" onClick={onClose} className="px-6 py-3 font-bold">
                  {cancelText}
                </GlassButton>
                <GlassButton 
                  variant={variant as 'primary' | 'secondary' | 'danger' | 'ghost'} 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-8 py-3 font-bold ${variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-[0_10px_25px_rgba(244,63,94,0.3)]' : 'shadow-[0_10px_25px_rgba(79,172,254,0.3)]'}`}
                >
                  {confirmText}
                </GlassButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
