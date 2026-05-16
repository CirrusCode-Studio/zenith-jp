import React, { useState, useEffect } from 'react';
import { LESSON_DATA, VOCABULARY_DATA } from '@zenith-jp/content';
import type { MemoryState } from '@zenith-jp/core';
import { BookMarked, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LessonSelectorProps {
  activeLessonId: string;
  onChangeLesson: (lessonId: string) => void;
  showNotification: (msg: string) => void;
  roadmapOpen: boolean;
  setRoadmapOpen: (open: boolean) => void;
  memoryStates: Record<string, MemoryState>;
}

export default function LessonSelector({
  activeLessonId,
  onChangeLesson,
  showNotification,
  roadmapOpen,
  setRoadmapOpen,
  memoryStates,
}: LessonSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsMobile(window.innerWidth < 768);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Calculate stats dynamically for each lesson
  const getLessonStats = (lessonId: string) => {
    const lessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === lessonId);
    const total = lessonVocabs.length;
    const studied = lessonVocabs.filter((v) => memoryStates[v.id] !== undefined).length;
    const percent = total > 0 ? Math.round((studied / total) * 100) : 0;
    return { total, studied, percent };
  };

  const currentLessonIndex = LESSON_DATA.findIndex((l) => l.id === activeLessonId);
  const activeLesson = LESSON_DATA[currentLessonIndex] || LESSON_DATA[0];

  return (
    <section className="bg-[#F5F2EF] dark:bg-[#1C1917] border border-[#E5E1DA] dark:border-stone-800/80 p-5 rounded-3xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center shrink-0">
          <BookMarked size={20} className="stroke-[2.5]" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider font-mono text-[#4F46E5] dark:text-indigo-400 font-bold">LỰA CHỌN BÀI HỌC</span>
          <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-stone-150 font-serif italic">
            {activeLesson?.vietnameseTitle || 'Chưa chọn'}
          </h3>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full md:w-auto">
        {/* Quick previous/next lesson buttons */}
        <div className="flex items-center justify-between bg-white dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 px-2.5 py-1.5 rounded-xl text-stone-500 font-mono text-[10px] uppercase font-bold shrink-0">
          <button
            onClick={() => {
              if (currentLessonIndex > 0) {
                onChangeLesson(LESSON_DATA[currentLessonIndex - 1].id);
                showNotification(`Dịch chuyển: ${LESSON_DATA[currentLessonIndex - 1].vietnameseTitle}`);
              } else {
                showNotification("Đây đã là Bài học đầu tiên!");
              }
            }}
            title="Bài học trước"
            className="p-1 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-[#FDFCFB] hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="px-3 select-none text-stone-700 dark:text-stone-300">
            {currentLessonIndex + 1} / {LESSON_DATA.length}
          </span>
          <button
            onClick={() => {
              if (currentLessonIndex < LESSON_DATA.length - 1) {
                onChangeLesson(LESSON_DATA[currentLessonIndex + 1].id);
                showNotification(`Dịch chuyển: ${LESSON_DATA[currentLessonIndex + 1].vietnameseTitle}`);
              } else {
                showNotification("Bạn đang ở Bài học cuối cùng!");
              }
            }}
            title="Bài học tiếp theo"
            className="p-1 text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-[#FDFCFB] hover:bg-stone-50 dark:hover:bg-stone-800 rounded-md transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>

        {/* Styled modern searchable dropdown with bottom-sheet drawer on mobile and popover on desktop */}
        <div className="relative flex-1 sm:flex-initial" id="custom-lesson-dropdown">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-64 flex items-center justify-between pl-4 pr-3 py-2.5 text-[11px] font-mono font-bold uppercase tracking-wider rounded-xl border bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-[#E5E1DA] dark:border-stone-800 transition-all hover:bg-stone-50 dark:hover:bg-stone-800 active:scale-98 cursor-pointer shadow-xs min-h-11"
          >
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[#4F46E5] dark:text-indigo-400 shrink-0">
                BÀI {currentLessonIndex + 1 < 10 ? `0${currentLessonIndex + 1}` : currentLessonIndex + 1}:
              </span>
              <span className="truncate text-stone-800 dark:text-stone-200">
                {activeLesson?.vietnameseTitle.replace(/^Bài \d+:\s*/, '') || 'CHỌN'}
              </span>
            </div>
            <ChevronDown size={14} className="text-stone-500 shrink-0 ml-1.5" />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <>
                {/* Click-away Backdrop (full dark on mobile, click-transporter on desktop) */}
                <motion.div
                  key="dropdown-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setDropdownSearch('');
                  }}
                  className="fixed inset-0 z-45 bg-black/40 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none"
                />

                {/* Adaptive dropdown container with search and lesson stats */}
                <motion.div
                  key="dropdown-menu"
                  initial={isMobile ? { y: '100%' } : { opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={isMobile ? { y: '100%' } : { opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] rounded-t-[2rem] bg-white dark:bg-stone-900 border-t border-[#E5E1DA] dark:border-stone-800 shadow-2xl flex flex-col md:absolute md:bottom-auto md:top-full md:right-0 md:left-auto md:w-85 md:max-h-105 md:rounded-2xl md:border md:mt-2 overflow-hidden"
                >
                  {/* Compact bottom header - only visible on Mobile devices */}
                  <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E5E1DA] dark:border-stone-800 md:hidden bg-stone-50 dark:bg-stone-900/40">
                    <div className="flex items-center gap-1.5">
                      <BookMarked size={15} className="text-[#4F46E5] dark:text-indigo-400" />
                      <h4 className="font-serif italic font-bold text-xs text-stone-900 dark:text-stone-100">Chọn Bài Học</h4>
                    </div>
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setDropdownSearch('');
                      }}
                      className="py-1 px-3.5 rounded-lg text-[9px] font-mono font-bold uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 hover:text-stone-950 dark:hover:text-[#FDFCFB] cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>

                  {/* Quick filter input bar with clear support */}
                  <div className="p-3 border-b border-[#E5E1DA] dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-550 dark:text-stone-400" />
                      <input
                        type="text"
                        value={dropdownSearch}
                        onChange={(e) => setDropdownSearch(e.target.value)}
                        placeholder="Lọc nhanh Bài 1 - 25..."
                        className="w-full pl-8 pr-8 py-2 bg-[#F5F2EF] dark:bg-stone-800 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg text-stone-800 dark:text-stone-150 border-none focus:outline-none focus:ring-1 focus:ring-[#4F46E5]"
                        autoFocus={!isMobile}
                      />
                      {dropdownSearch && (
                        <button
                          onClick={() => setDropdownSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-650 text-stone-600 dark:text-stone-300 font-bold"
                        >
                          Xoá
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter and render individual lessons */}
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 max-h-[50vh] md:max-h-72.5">
                    {LESSON_DATA.filter((lesson) => {
                      const query = dropdownSearch.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        lesson.vietnameseTitle.toLowerCase().includes(query) ||
                        lesson.id.toLowerCase().includes(query) ||
                        lesson.title.toLowerCase().includes(query) ||
                        lesson.description.toLowerCase().includes(query)
                      );
                    }).map((lesson) => {
                      const originalIndex = LESSON_DATA.findIndex((l) => l.id === lesson.id);
                      const lessonNumStr = (originalIndex + 1) < 10 ? `0${originalIndex + 1}` : `${originalIndex + 1}`;
                      const isActive = activeLessonId === lesson.id;
                      const stats = getLessonStats(lesson.id);

                      let statusColor = "bg-stone-50 dark:bg-stone-800/40 text-stone-400 border border-[#E5E1DA]/40 dark:border-stone-800";
                      let statusSymbol = "⚪";
                      if (stats.studied === stats.total && stats.total > 0) {
                        statusColor = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300/20";
                        statusSymbol = "✅";
                      } else if (stats.studied > 0) {
                        statusColor = "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300/20";
                        statusSymbol = "🔄";
                      }

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            onChangeLesson(lesson.id);
                            showNotification(`Dịch chuyển: ${lesson.vietnameseTitle}`);
                            setIsDropdownOpen(false);
                            setDropdownSearch('');
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer relative ${
                            isActive
                              ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border border-[#4F46E5]/30'
                              : 'hover:bg-[#F9F7F5] dark:hover:bg-stone-850/80 border border-transparent'
                          }`}
                        >
                          <span className={`text-[11px] font-mono font-black shrink-0 ${isActive ? 'text-[#4F46E5]' : 'text-stone-400'}`}>
                            {lessonNumStr}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h5 className={`text-[11px] font-bold font-sans ${
                              isActive ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-stone-800 dark:text-stone-200'
                            } leading-tight truncate`}>
                              {lesson.vietnameseTitle.replace(/^Bài \d+:\s*/, '')}
                            </h5>
                            <p className="text-[9px] text-stone-500 dark:text-stone-400 font-mono mt-0.5 flex items-center gap-1.5">
                              <span className={`font-semibold ${isActive ? 'text-indigo-600' : 'text-stone-600 dark:text-stone-400'}`}>
                                {stats.studied}/{stats.total} từ đã học
                              </span>
                              <span>•</span>
                              <span className="font-extrabold">{stats.percent}%</span>
                            </p>
                            {/* Nano progress line */}
                            <div className="w-full h-0.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden mt-1 select-none">
                              <div
                                className={`h-full ${isActive ? 'bg-[#4F46E5]' : 'bg-stone-400/50 dark:bg-stone-600'}`}
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                          </div>

                          <span className={`shrink-0 text-[10px] w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold ${statusColor}`}>
                            {statusSymbol}
                          </span>
                        </button>
                      );
                    })}

                    {LESSON_DATA.filter((lesson) => {
                      const query = dropdownSearch.toLowerCase().trim();
                      if (!query) return true;
                      return (
                        lesson.vietnameseTitle.toLowerCase().includes(query) ||
                        lesson.id.toLowerCase().includes(query) ||
                        lesson.title.toLowerCase().includes(query) ||
                        lesson.description.toLowerCase().includes(query)
                      );
                    }).length === 0 && (
                      <div className="py-8 text-center text-[10px] font-mono text-stone-500">
                        Không tìm thấy bài học nào phù hợp!
                      </div>
                    )}
                  </div>

                  {/* Progress footer inside selector */}
                  <div className="p-2.5 bg-[#F9F7F5] dark:bg-stone-900 border-t border-[#E5E1DA] dark:border-stone-800 font-mono text-[8px] text-stone-500 flex justify-between items-center select-none">
                    <span>Tổng số: 25 Bài học Minna</span>
                    <span className="font-bold">Động cơ Spaced Repetition v1.2</span>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle Map Button */}
        <button
          onClick={() => setRoadmapOpen(!roadmapOpen)}
          className={`px-4 py-2.5 text-[11px] font-bold font-mono uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            roadmapOpen
              ? 'bg-[#4F46E5] text-white border-transparent shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border-[#E5E1DA] dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          SƠ ĐỒ 25 BÀI ({roadmapOpen ? "ĐÓNG" : "XEM"})
        </button>
      </div>
    </section>
  );
}
