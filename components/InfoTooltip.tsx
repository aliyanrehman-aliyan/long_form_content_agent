import React, { useId, useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  size?: 'default' | 'sm';
  className?: string;
  panelClassName?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content, size = 'default', className = '', panelClassName = '' }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const tooltipId = useId();
  const isOpen = isHovered || isFocused || isPinned;
  const buttonSizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const iconSizeClass = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span
      className={`relative inline-flex shrink-0 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        setIsPinned(false);
      }}
    >
      <button
        type="button"
        aria-label="Section information"
        aria-describedby={isOpen ? tooltipId : undefined}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isPinned) {
            setIsPinned(false);
            event.currentTarget.blur();
          } else {
            setIsPinned(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setIsPinned(false);
          }
        }}
        className={`inline-flex ${buttonSizeClass} items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
      >
        <Info className={iconSizeClass} aria-hidden="true" />
      </button>
      <span
        id={tooltipId}
        role="tooltip"
        className={`absolute left-1/2 top-full z-[80] mt-2 w-60 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2 text-left text-[11px] font-semibold leading-relaxed text-white shadow-xl transition-all duration-150 ${
          isOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        } ${panelClassName}`}
      >
        {content}
      </span>
    </span>
  );
};

export default InfoTooltip;
