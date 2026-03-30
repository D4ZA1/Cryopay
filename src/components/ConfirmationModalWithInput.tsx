import React, { useState, useEffect } from 'react';

interface ConfirmationModalWithInputProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  requiredInput: string;
  placeholder?: string;
}

const ConfirmationModalWithInput: React.FC<ConfirmationModalWithInputProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requiredInput,
  placeholder = 'Type to confirm',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
      setShowWarning(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (inputValue === requiredInput) {
      onConfirm();
      onClose();
    } else {
      setShowWarning(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (showWarning && e.target.value === requiredInput) {
      setShowWarning(false);
    }
  };

  const isConfirmDisabled = inputValue !== requiredInput;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={handleBackdropClick}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-scaleIn">
        <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden">
          {/* Glass morphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

          {/* Content */}
          <div className="relative p-6">
            {/* Icon */}
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500/20">
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-slate-400 text-center mb-4">
              {message}
            </p>

            {/* Required Input Info */}
            <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-white/[0.06]">
              <p className="text-sm text-slate-400 mb-1">
                Please type <span className="font-mono font-semibold text-red-400">{requiredInput}</span> to confirm:
              </p>
            </div>

            {/* Input Field */}
            <div className="mb-4">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800/50 border border-white/[0.06] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                autoFocus
              />
              
              {/* Warning Message */}
              {showWarning && (
                <div className="mt-2 flex items-center gap-2 text-red-400 text-sm animate-shake">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Input does not match. Please try again.</span>
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-white border border-white/[0.06] transition-all duration-200 font-medium"
              >
                {cancelText}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirmDisabled}
                className={`flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-lg ${
                  isConfirmDisabled
                    ? 'bg-red-500/30 text-red-300 cursor-not-allowed'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-4px);
          }
          75% {
            transform: translateX(4px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModalWithInput;
