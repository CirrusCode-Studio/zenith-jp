import React from 'react';
import { LESSON_DATA, VOCABULARY_DATA } from '@zenith-jp/content';
import type { MemoryState, UserStats } from '@zenith-jp/core';
import { BookOpen, Award, AlertTriangle, Flame } from 'lucide-react';

interface StatsCardsProps {
  activeLessonId: string;
  memoryStates: Record<string, MemoryState>;
  userStats: UserStats;
}

export default function StatsCards({
  activeLessonId,
  memoryStates,
  userStats,
}: StatsCardsProps) {
  const currentLessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === activeLessonId);
  const totalInLesson = currentLessonVocabs.length;
  const studiedInLesson = currentLessonVocabs.filter((v) => memoryStates[v.id] !== undefined).length;
  const masteredInLesson = currentLessonVocabs.filter((v) => memoryStates[v.id]?.memoryStrength >= 4).length;
  const weakInLesson = currentLessonVocabs.filter((v) => memoryStates[v.id]?.isWeak).length;

  const activeLesson = LESSON_DATA.find((l) => l.id === activeLessonId);

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4" id="section-stats-cards">
      <div className="bg-[#F9F7F5] dark:bg-stone-900/60 border border-[#E5E1DA] dark:border-stone-800/80 p-4 rounded-3xl flex flex-col justify-between h-32 transition-all hover:border-[#4F46E5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-stone-400">Tiến tiến</span>
          <span className="p-1.5 rounded-lg bg-[#F5F2EF] dark:bg-stone-800 text-[#4F46E5] dark:text-indigo-400">
            <BookOpen size={14} />
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-mono text-[#1A1A1A] dark:text-stone-100">{studiedInLesson}</h2>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">/ {totalInLesson} từ {activeLesson?.title}</p>
        </div>
      </div>

      <div className="bg-[#F9F7F5] dark:bg-stone-900/60 border border-[#E5E1DA] dark:border-stone-800/80 p-4 rounded-3xl flex flex-col justify-between h-32 transition-all hover:border-[#4F46E5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-stone-400">Khắc ghi</span>
          <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
            <Award size={14} />
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-mono text-[#1A1A1A] dark:text-stone-100">{masteredInLesson}</h2>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Đạt bền bỉ ≥ 4</p>
        </div>
      </div>

      <div className="bg-[#F9F7F5] dark:bg-stone-900/60 border border-[#E5E1DA] dark:border-stone-800/80 p-4 rounded-3xl flex flex-col justify-between h-32 transition-all hover:border-[#4F46E5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-stone-400">Cần mài dũa</span>
          <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={14} />
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-mono text-[#1A1A1A] dark:text-stone-100">{weakInLesson}</h2>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">Gợi nhớ còn trễ</p>
        </div>
      </div>

      <div className="bg-[#F9F7F5] dark:bg-stone-900/60 border border-[#E5E1DA] dark:border-stone-800/80 p-4 rounded-3xl flex flex-col justify-between h-32 transition-all hover:border-[#4F46E5]/40 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-stone-600 dark:text-stone-400">Nhịp độ (Streak)</span>
          <span className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950 text-red-500">
            <Flame size={14} />
          </span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-mono text-[#1A1A1A] dark:text-stone-100">{userStats.streakDays || 1}</h2>
          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-1">ngày liên tục</p>
        </div>
      </div>
    </section>
  );
}
