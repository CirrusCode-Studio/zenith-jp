import React from 'react';
import { VOCABULARY_DATA } from '@zenith-jp/content';
import type { MemoryState } from '@zenith-jp/core';
import { Clock, AlertTriangle } from 'lucide-react';

interface ReviewsTabContentProps {
  activeLessonId: string;
  memoryStates: Record<string, MemoryState>;
  onStartCluster: (clusterId: string) => void;
  onTriggerWeakReview: () => void;
}

export default function ReviewsTabContent({
  activeLessonId,
  memoryStates,
  onStartCluster,
  onTriggerWeakReview,
}: ReviewsTabContentProps) {
  const currentLessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === activeLessonId);
  
  const now = new Date();
  const dueVocabIds = Object.keys(memoryStates).filter((id) => {
    const m = memoryStates[id];
    const belongsToLesson = currentLessonVocabs.some((v) => v.id === id);
    return belongsToLesson && m && new Date(m.nextReviewAt) <= now;
  });

  const weakVocabs = currentLessonVocabs.filter((v) => memoryStates[v.id]?.isWeak);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between select-none">
        <h3 className="text-xs uppercase font-mono font-bold tracking-widest text-stone-600 dark:text-stone-400">Hệ thống ôn tập theo chu kỳ</h3>
        <span className="text-xs text-stone-700 dark:text-stone-300 font-mono font-bold">🎯 {dueVocabIds.length} từ đến hạn</span>
      </div>

      <div className="bg-[#F9F7F5] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800/85 p-5 rounded-3xl space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#1A1A1A] dark:text-stone-100 font-serif italic">Bắt đầu Ôn tập Đột phá</h4>
          <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
            Quá trình này tự động tổng hợp các từ đến hạn ôn tập để mài phản xạ nhanh. Giúp thuyên chuyển thông tin của từ vựng từ bộ nhớ ngắn hạn sang thùy nhớ vĩnh cửu.
          </p>
        </div>

        {dueVocabIds.length > 0 ? (
          <div className="pt-2">
            <button
              id="btn-start-due-reviews"
              onClick={() => onStartCluster("due_reviews")}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-semibold hover:bg-[#4F46E5]/90 active:scale-95 transition-all text-xs tracking-wider cursor-pointer"
            >
              <Clock size={14} /> TIẾN HÀNH ÔN TẬP NGAY ({dueVocabIds.length} TỪ)
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/35 rounded-2xl text-center text-xs text-emerald-700 dark:text-emerald-400 font-medium font-sans">
            🎉 Tuyệt vời! Bạn đã hoàn thành hết các bài ôn tập đến hạn hôm nay.
          </div>
        )}

        {/* WEAK WORDS */}
        {weakVocabs.length > 0 && (
          <div className="border-t border-[#E5E1DA]/55 dark:border-stone-800/50 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-700 dark:text-red-405 flex items-center gap-1.5 font-mono">
                <AlertTriangle size={14} className="text-red-600 animate-pulse" /> CÓ {weakVocabs.length} TỪ YẾU PHẢN XẠ!
              </span>
              <button
                id="btn-trigger-weak-review"
                onClick={onTriggerWeakReview}
                className="text-[10px] text-[#4F46E5] dark:text-indigo-400 font-bold hover:underline cursor-pointer"
              >
                Luyện riêng nhóm này ngay
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {weakVocabs.slice(0, 6).map((vv) => (
                <div
                  key={vv.id}
                  className="p-2 border border-[#E5E1DA] dark:border-stone-800 rounded-xl bg-white dark:bg-stone-950 text-[10px] text-stone-750 dark:text-stone-300 font-sans flex items-center justify-between shadow-xs"
                >
                  <span className="font-bold text-stone-900 dark:text-stone-100">{vv.kana}</span>
                  <span className="text-black dark:text-stone-400 font-bold truncate max-w-[50%] font-mono">{vv.meaning}</span>
                </div>
              ))}
              {weakVocabs.length > 6 && (
                <div className="p-2 border border-[#E5E1DA] border-dashed rounded-xl bg-transparent text-[9px] text-stone-600 dark:text-stone-400 font-mono text-center flex items-center justify-center font-semibold">
                  và {weakVocabs.length - 6} từ khác...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
