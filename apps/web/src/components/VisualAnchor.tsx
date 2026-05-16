import React from 'react';
import * as Lucide from 'lucide-react';

interface VisualAnchorProps {
  iconName: string;
  vocabId: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function VisualAnchor({ iconName, vocabId, size = 'md' }: VisualAnchorProps) {
  // Map dimensions
  const dimensionClass = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28'
  }[size];

  const iconSize = {
    sm: 20,
    md: 32,
    lg: 44
  }[size];

  // Custom vector artwork for specific key words to make it feel deeply premium and custom
  const renderCustomGraphic = () => {
    switch (vocabId) {
      case "1": // わたし (Tôi - pointing at person)
        return (
          <svg className="w-full h-full text-stone-700 dark:text-stone-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="50" cy="35" r="14" fill="currentColor" fillOpacity="0.1" />
            <path d="M25 80c0-15 12-25 25-25s25 10 25 25" />
            <path d="M50 55v15M42 62l8 8 8-8" strokeWidth="3" className="animate-pulse" /> {/* Pointing self marker */}
          </svg>
        );

      case "2": // わたしたち (Chúng tôi - plural)
        return (
          <svg className="w-full h-full text-stone-700 dark:text-stone-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            {/* Person 1 */}
            <circle cx="35" cy="40" r="10" />
            <path d="M15 80c0-12 10-18 20-18s20 6 20 18" />
            {/* Person 2 */}
            <circle cx="65" cy="40" r="10" fill="currentColor" fillOpacity="0.1" />
            <path d="M45 80c0-12 10-18 20-18s20 6 20 18" />
          </svg>
        );

      case "3": // あなた (Bạn - point forward arrow)
        return (
          <svg className="w-full h-full text-stone-700 dark:text-stone-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="50" cy="30" r="12" />
            <path d="M25 75c0-12 12-20 25-20s25 8 25 20" />
            <path d="M50 48v22M50 70l-6-6M50 70l6-6" strokeWidth="3" /> {/* Pointing out */}
          </svg>
        );

      case "11": // せんせい (Giáo viên - boards + glasses)
        return (
          <svg className="w-full h-full text-amber-800 dark:text-amber-200" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="20" y="20" width="60" height="40" rx="4" fill="currentColor" fillOpacity="0.05" />
            <path d="M30 60v15M70 60v15M25 35h50M35 48l8 8 20-20" />
            <circle cx="50" cy="80" r="3" fill="currentColor" />
          </svg>
        );

      case "13": // がくせい (Học sinh - student hat)
        return (
          <svg className="w-full h-full text-stone-700 dark:text-stone-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M50 20L15 35l35 15 35-15-35-15z" fill="currentColor" fillOpacity="0.1" />
            <path d="M25 40v20c0 10 11 15 25 15s25-5 25-15V40" />
            <path d="M80 35v25M78 60h4" />
          </svg>
        );

      case "17": // いしゃ (Bác sĩ - Heart pulse)
        return (
          <svg className="w-full h-full text-rose-700 dark:text-rose-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 40c0-15 18-20 38-5 20-15 38-10 38 5s-20 35-38 45C30 75 12 55 12 40z" fill="currentColor" fillOpacity="0.05" />
            <path d="M25 40h15l5-12 6 24 5-18 6 6h13" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      case "21": // びょういん (Bệnh viện - building with cross)
        return (
          <svg className="w-full h-full text-red-700 dark:text-red-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="25" y="15" width="50" height="70" rx="6" fill="currentColor" fillOpacity="0.05" />
            <path d="M15 85h70" />
            {/* Medical Cross */}
            <path d="M50 30v16M42 38h16" strokeWidth="5" strokeLinecap="round" />
            {/* Windows */}
            <rect x="35" y="55" width="8" height="8" rx="1" />
            <rect x="57" y="55" width="8" height="8" rx="1" />
            <rect x="35" y="68" width="8" height="10" rx="1" />
            <rect x="57" y="68" width="8" height="10" rx="1" />
          </svg>
        );

      case "22": // でんき (Điện, đèn điện)
        return (
          <svg className="w-full h-full text-amber-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M30 40a20 20 0 1140 0c0 10-8 15-10 22h-20c-2-7-10-12-10-22z" fill="currentColor" fillOpacity="0.1" />
            <path d="M40 78h20M42 84h16M40 62h20" />
            <path d="M50 15v5M28 28l5 5M72 28l-5 5M20 45h6M74 45h6" strokeLinecap="round" />
          </svg>
        );

      case "42": // にほん (Nhật Bản - Mt Fuji and Sun)
        return (
          <svg className="w-full h-full text-stone-700 dark:text-stone-300" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            {/* Mt Fuji outline */}
            <path d="M15 80c10-5 25-25 35-45 10 20 25 40 35 45H15z" fill="currentColor" fillOpacity="0.05" />
            {/* Snowy peak */}
            <path d="M42 45l8-10 8 10-4 4-4-2-4 2-4-4z" fill="currentColor" />
            {/* Sun */}
            <circle cx="72" cy="30" r="10" fill="#EF4444" stroke="#EF4444" fillOpacity="0.8" />
          </svg>
        );

      case "45": // さくらだいがく (Hoa anh đào + đại học)
        return (
          <svg className="w-full h-full text-pink-500" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5">
            {/* School building */}
            <path d="M15 75V45l35-15 35 15v30" />
            <path d="M10 80h80" />
            {/* Sakura flower petal */}
            <path d="M50 35c8-10 18-5 12 5s-12 5-12 5-6-5-12-5 4-15 12-5z" fill="currentColor" fillOpacity="0.25" />
          </svg>
        );

      default:
        return null;
    }
  };

  const customGraphic = renderCustomGraphic();

  if (customGraphic) {
    return (
      <div 
        id={`vocab-anchor-${vocabId}`}
        className={`flex items-center justify-center p-3 rounded-2xl bg-[#F9F7F5] dark:bg-stone-800 border border-[#E5E1DA] dark:border-stone-700/50 shadow-xs transition-all duration-300 hover:scale-105 ${dimensionClass}`}
      >
        {customGraphic}
      </div>
    );
  }

  // Fallback to stylized Lucide symbols
  const LucideIcon = (Lucide as any)[convertToCamelCase(iconName || 'book')] || Lucide.Book;

  return (
    <div 
      id={`vocab-anchor-${vocabId}`}
      className={`flex items-center justify-center p-3 rounded-2xl bg-[#F9F7F5] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800/60 shadow-xs transition-all duration-300 hover:scale-105 ${dimensionClass} text-[#1A1A1A] dark:text-stone-300`}
    >
      <div className="relative">
        <LucideIcon size={iconSize} strokeWidth={2} className="text-[#4F46E5] dark:text-indigo-400" />
        <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-stone-300 dark:bg-stone-600 rounded-full anim-pulse" />
      </div>
    </div>
  );
}

// Utility to match iconNames to Lucide imports
function convertToCamelCase(str: string): string {
  if (str.startsWith('flag-')) {
    return 'Flag'; // Fallback flag representation
  }
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}
