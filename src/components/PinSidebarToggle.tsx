import React from 'react';

interface PinSidebarToggleProps {
  isPinned: boolean;
  onToggle: () => void;
}

const PinSidebarToggle: React.FC<PinSidebarToggleProps> = ({ isPinned, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative w-16 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isPinned
          ? 'bg-emerald-500 focus:ring-emerald-500'
          : 'bg-rose-400 focus:ring-rose-400'
      }`}
      aria-label={isPinned ? 'Unpin sidebar' : 'Pin sidebar'}
      type="button"
    >
      <span
        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          isPinned ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {isPinned ? (
          <svg
            className="w-3.5 h-3.5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 text-rose-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
            />
          </svg>
        )}
      </span>
    </button>
  );
};

export default PinSidebarToggle;
