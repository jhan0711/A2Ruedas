import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${
            variant === 'danger'
              ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {message}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
            Esta acción quedará registrada en la bitácora del taller.
          </p>
        </div>
      </div>
    </Modal>
  );
};
