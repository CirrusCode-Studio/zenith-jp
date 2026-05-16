import React from 'react';
import { LESSON_DATA, VOCABULARY_DATA } from '@zenith-jp/content';
import type { MemoryState } from '@zenith-jp/core';
import { Sparkles } from 'lucide-react';

interface RoadmapBoxGridProps {
  activeLessonId: string;
  onChangeLesson: (lessonId: string) => void;
  showNotification: (msg: string) => void;
  memoryStates: Record<string, MemoryState>;
}

export default function RoadmapBoxGrid({
  activeLessonId,
  onChangeLesson,
  showNotification,
  memoryStates,
}: RoadmapBoxGridProps) {
  const activeLearnedCount = Object.keys(memoryStates).length;
  // Based on the constant database, the absolute total unique vocabulary is 215 words
  const totalVocabularyCount = 215; 
  const activationRatio = totalVocabularyCount > 0 ? Math.round((activeLearnedCount / totalVocabularyCount) * 100) : 0;

  return (
    <section className="bg-stone-50/50 dark:bg-stone-950/20 border-2 border-dashed border-[#E5E1DA] dark:border-stone-800/60 p-6 rounded-3xl space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E5E1DA] dark:border-stone-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[9px] font-mono text-[#4F46E5] dark:text-indigo-400 font-bold uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-200/20">
            <Sparkles size={11} className="text-indigo-500" /> BẢN ĐỒ THẦN KINH MINNA NO NIHONGO
          </div>
          <h4 className="text-xl font-bold font-serif italic text-stone-900 dark:text-stone-50 mt-2">
            Hệ Thống 25 Trạm Phát Triển Nhật Ngữ Sơ Cấp
          </h4>
          <p className="text-xs text-stone-600 dark:text-[#A8A29E] max-w-xl leading-relaxed mt-1">
            Bấm vào quân bài bất kì để thay đổi trọng tâm học tập. Dữ liệu từ vựng cho cả 25 bài học đã được liên kết thông minh, lưu giữ toàn diện trong hệ thần kinh phản xạ của bạn.
          </p>
        </div>

        <div className="p-3 bg-white dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-2xl flex items-center gap-3 font-mono text-[11px] shadow-xs shrink-0 self-stretch sm:self-auto justify-around">
          <div>
            <span className="block text-[8px] text-stone-500 uppercase tracking-wider">Tổng tế bào phản xạ</span>
            <span className="font-extrabold text-stone-800 dark:text-stone-100">
              {activeLearnedCount} <span className="text-stone-500 font-normal">/ {totalVocabularyCount} mốc từ</span>
            </span>
          </div>
          <div className="h-8 w-px bg-[#E5E1DA] dark:bg-stone-800" />
          <div>
            <span className="block text-[8px] text-stone-500 uppercase tracking-wider">Hiệu suất kích hoạt</span>
            <span className="font-extrabold text-[#4F46E5] dark:text-indigo-400">
              {activationRatio}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {LESSON_DATA.map((lesson, idx) => {
          const lessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === lesson.id);
          const totalWords = lessonVocabs.length;
          const studiedWords = lessonVocabs.filter((v) => memoryStates[v.id] !== undefined).length;
          const percent = totalWords > 0 ? Math.round((studiedWords / totalWords) * 100) : 0;
          const isActive = activeLessonId === lesson.id;

          let statusBorder = "border-[#E5E1DA] dark:border-stone-800/80 hover:border-indigo-400 dark:hover:border-indigo-600";
          let badgeText = "Chưa học";
          let badgeClass = "bg-[#F5F2EF] dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-750";

          if (isActive) {
            statusBorder = "border-[#4F46E5] ring-2 ring-[#4F46E5]/10 dark:border-indigo-500/80 shadow-md shadow-indigo-500/5";
            badgeText = "Đang mài";
            badgeClass = "bg-indigo-50 dark:bg-indigo-950/45 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-850";
          } else if (studiedWords === totalWords && totalWords > 0) {
            statusBorder = "border-emerald-500/50 dark:border-emerald-500/30";
            badgeText = "Khắc ghi";
            badgeClass = "bg-emerald-50 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-850";
          } else if (studiedWords > 0) {
            statusBorder = "border-amber-400/50 dark:border-amber-400/35";
            badgeText = "Dở dang";
            badgeClass = "bg-amber-50 dark:bg-amber-950/45 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-indigo-850";
          }

          return (
            <button
              key={lesson.id}
              onClick={() => {
                onChangeLesson(lesson.id);
                showNotification(`Dịch chuyển: ${lesson.vietnameseTitle}`);
              }}
              className={`p-4 bg-white dark:bg-stone-900 border rounded-2xl flex flex-col justify-between h-44 text-left transition-all duration-300 relative group cursor-pointer ${statusBorder} hover:shadow-md hover:scale-[1.01]`}
            >
              <div className="w-full">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-stone-500 group-hover:text-indigo-500 transition-colors font-bold uppercase tracking-wider">
                    BÀI {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-mono uppercase tracking-wider font-semibold border ${badgeClass} shrink-0`}>
                    {badgeText}
                  </span>
                </div>
                <h5 className="font-serif italic font-bold text-xs text-stone-850 dark:text-stone-100 mt-2.5 line-clamp-2 leading-relaxed group-hover:text-[#4F46E5] dark:group-hover:text-indigo-400 transition-colors">
                  {lesson.vietnameseTitle.replace(/^Bài \d+:\s*/, '')}
                </h5>
                <p className="text-[9px] text-stone-400 dark:text-stone-500 line-clamp-2 mt-1 select-none">
                  {lesson.description}
                </p>
              </div>

              <div className="space-y-1.5 mt-2.5 w-full">
                <div className="flex justify-between items-center text-[9px] text-stone-650 dark:text-stone-400 font-mono">
                  <span className="hidden min-[400px]:inline">Nơ-ron đã nạp</span>
                  <span className="min-[400px]:hidden">Đã học</span>
                  <span className="font-bold shrink-0">
                    {studiedWords} / {totalWords} từ
                  </span>
                </div>

                {/* Tiny visual progress bar */}
                <div className="w-full h-1 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      studiedWords === totalWords
                        ? 'bg-emerald-500'
                        : percent > 50
                        ? 'bg-[#4F46E5]'
                        : 'bg-amber-400'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
