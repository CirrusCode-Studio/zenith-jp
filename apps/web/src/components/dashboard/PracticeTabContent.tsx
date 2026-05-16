import React from 'react';
import { VOCABULARY_CLUSTERS, VOCABULARY_DATA, LESSON_DATA } from '@zenith-jp/content';
import type { MemoryState } from '@zenith-jp/core';

import { 
  resetClusterProgress, 
  getSavedStreamStepIndex, 
  clearStreamStepIndex 
} from '../../services/progress.service';
import type { Cluster } from '@zenith-jp/core';
import { Play, RotateCcw, Sparkles, BookMarked } from 'lucide-react';

interface PracticeTabContentProps {
  activeLessonId: string;
  onStartCluster: (clusterId: string) => void;
  memoryStates: Record<string, MemoryState>;
  loadProgress: () => void;
  showNotification: (msg: string) => void;
}

export default function PracticeTabContent({
  activeLessonId,
  onStartCluster,
  memoryStates,
  loadProgress,
  showNotification,
}: PracticeTabContentProps) {
  const currentLessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === activeLessonId);
  const totalInLesson = currentLessonVocabs.length;
  const studiedInLesson = currentLessonVocabs.filter((v) => memoryStates[v.id] !== undefined).length;

  // Retrieve step index strictly in-memory
  const savedStepIndex = getSavedStreamStepIndex(activeLessonId);

  const activeLesson = LESSON_DATA.find((l) => l.id === activeLessonId);
  const lessonClusters: Cluster[] = VOCABULARY_CLUSTERS.filter((c) => c.lessonId === activeLessonId);

  // Dynamic user performance title strictly in memory
  const getMindRating = () => {
    const totalLearned = Object.keys(memoryStates).length;
    if (totalLearned === 0) return "Chưa thức tỉnh";
    if (totalLearned < 10) return "Sơ cấp nhập môn";
    if (totalLearned < 25) return "Đại não sắc bén";
    if (totalLearned < 40) return "Trí nhớ dẻo dai";
    return "Tuyệt đỉnh Zen đại tôn";
  };

  return (
    <div className="space-y-6">
      {/* THE MASTER COGNITIVE STREAM CARD */}
      <div className="bg-[#FDFCFB] dark:bg-stone-900 border-2 border-[#4F46E5] p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-lg transition-all hover:shadow-xl">
        <div className="absolute top-0 right-0 p-8 text-[#4F46E5]/5 pointer-events-none">
          <BookMarked size={140} />
        </div>

        <div className="relative space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-stone-800 dark:text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-indigo-200/40">
            <Sparkles size={12} className="text-[#4F46E5]" /> 100% RECURSIVE RECALL FLOW
          </div>

          <h3 className="text-2xl md:text-3xl font-serif italic text-[#1A1A1A] dark:text-stone-50">
            Bài Học Toàn Bộ: {activeLesson?.vietnameseTitle}
          </h3>

          <p className="text-stone-700 dark:text-[#A8A29E] text-xs md:text-sm leading-relaxed max-w-lg">
            Hệ thống tự động liên kết {lessonClusters.length} nhóm từ vựng thành **MỘT BÀI HỌC DUY NHẤT**. Tiến hành mài dũa phản xạ từ 1 tới 2 ➔ quay lại 1, kéo dài chu kỳ lặp nơ-ron liền mạch qua các chặng tiếp theo.
          </p>

          {/* Memory status info */}
          <div className="flex gap-4 text-xs font-mono text-stone-700 bg-[#F5F2EF] dark:bg-stone-800 p-3.5 rounded-2xl border border-[#E5E1DA] max-w-sm">
            <div>
              <span className="block text-[9px] text-stone-600 dark:text-stone-400 uppercase">Bản đồ nơ-ron</span>
              <span className="font-bold text-[#1A1A1A] dark:text-stone-100">{studiedInLesson} / {totalInLesson} từ đã nạp</span>
            </div>
            <div className="border-l border-[#E5E1DA] dark:border-stone-800 pl-4 bg-transparent">
              <span className="block text-[9px] text-stone-600 dark:text-stone-400 uppercase">Vị thế nhịp tri</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{getMindRating()}</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {savedStepIndex !== null ? (
              <>
                <button
                  id="btn-trigger-master-stream"
                  onClick={() => onStartCluster("zenith_stream")}
                  className="px-6 py-3.5 rounded-2xl bg-[#4F46E5] text-white font-bold text-xs tracking-wider hover:bg-[#4F46E5]/90 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 font-mono"
                >
                  <Play size={14} fill="currentColor" /> TIẾP TỤC BÀI HỌC DỞ DANG (BƯỚC {savedStepIndex + 1})
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Bạn có chắc muốn xoá tiến độ dở dang và bắt đầu chuỗi bài học lại từ bước 1? (Lưu ý: Thao tác này CHỈ đặt lại bước học của bài, giữ nguyên độ bền trí nhớ các từ vựng đã thuộc)")) {
                      clearStreamStepIndex(activeLessonId);
                      onStartCluster("zenith_stream");
                    }
                  }}
                  className="px-4 py-3 rounded-xl border border-stone-200 hover:border-indigo-400 dark:border-stone-800 hover:text-indigo-650 text-stone-700 dark:text-stone-300 text-[10px] font-semibold transition-all font-mono cursor-pointer"
                >
                  Bắt Đầu Lại Từ Bước 1 ↺
                </button>
                <button
                  onClick={() => {
                    const lessonName = activeLesson?.title || 'bài học';
                    if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XOÁ SẠCH TOÀN BỘ phản xạ và trí nhớ của các từ vựng thuộc ${lessonName} về vạch xuất phát để học lại hoàn toàn từ đầu? Thao tác này không thể hoàn tác!`)) {
                      const allVocabIds = currentLessonVocabs.map((v) => v.id);
                      resetClusterProgress(allVocabIds);
                      clearStreamStepIndex(activeLessonId);
                      loadProgress();
                      showNotification(`Đã xoá sạch toàn bộ tiến trình & bộ nhớ của ${lessonName}!`);
                      onStartCluster("zenith_stream");
                    }
                  }}
                  className="px-4 py-3 rounded-xl border border-red-200 hover:border-red-400 dark:border-stone-800 hover:text-red-650 text-stone-500 text-[10px] font-semibold transition-all font-mono cursor-pointer"
                >
                  Xoá Trí Nhớ & Học Lại Từ Đầu ↺
                </button>
              </>
            ) : (
              <>
                <button
                  id="btn-trigger-master-stream"
                  onClick={() => onStartCluster("zenith_stream")}
                  className="px-8 py-4 rounded-2xl bg-[#4F46E5] text-white font-bold text-xs tracking-widest hover:bg-[#4F46E5]/90 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Play size={14} fill="currentColor" /> KHỞI CHẠY BÀI HỌC TOÀN DIỆN
                </button>
                {studiedInLesson > 0 && (
                  <button
                    onClick={() => {
                      const lessonName = activeLesson?.title || 'bài học';
                      if (window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn XOÁ SẠCH TOÀN BỘ phản xạ và trí nhớ của các từ vựng thuộc ${lessonName} về vạch xuất phát để học lại hoàn toàn từ đầu? Thao tác này không thể hoàn tác!`)) {
                        const allVocabIds = currentLessonVocabs.map((v) => v.id);
                        resetClusterProgress(allVocabIds);
                        clearStreamStepIndex(activeLessonId);
                        loadProgress();
                        showNotification(`Đã xoá sạch toàn bộ tiến trình & bộ nhớ của ${lessonName}!`);
                      }
                    }}
                    className="px-4 py-3.5 rounded-xl border border-stone-200 hover:border-red-400 dark:border-stone-800 hover:text-red-500 text-stone-500 text-[10px] font-semibold transition-all font-mono cursor-pointer"
                  >
                    Xoá Sạch Trí Nhớ Rèn Luân Hồi ↺
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* DYNAMIC TIMELINE STEPS OF THE MASTER LESSON */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-mono font-black text-stone-600 dark:text-stone-400 uppercase tracking-widest">
            Lộ Trình Tuyến Tính: {lessonClusters.length} Chặng Hoàn Thiện
          </h4>
          <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1 max-w-xl leading-relaxed">
            Khi học, hệ thống tự động gộp các nhóm từ vựng của bài học thành một lộ trình hợp nhất duy nhất. Đạt mốc nào, phản xạ sẽ được tích lũy tổng hòa tại mốc đó.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lessonClusters.map((cluster, idx) => {
            const blockTitle = cluster.vietnameseTitle || cluster.title;
            const blockDesc = cluster.description;
            const vocabIds = cluster.vocabIds;

            const total = vocabIds.length;
            const studied = vocabIds.filter((id) => memoryStates[id] !== undefined).length;
            const percent = total > 0 ? Math.round((studied / total) * 100) : 0;

            return (
              <div
                key={cluster.id}
                id={`suggested-topic-block-${idx}`}
                className="p-5 bg-[#F9F7F5] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800/80 rounded-2xl flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-500/80 transition-all duration-300 relative"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-mono text-stone-600 dark:text-stone-400 uppercase font-semibold">
                    <span>Chặng {idx + 1} / {lessonClusters.length}</span>
                    <span>{total} từ vựng</span>
                  </div>
                  <h5 className="font-serif italic font-bold text-base text-[#1A1A1A] dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {blockTitle}
                  </h5>
                  <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed font-sans pr-4">
                    {blockDesc}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E5E1DA]/40 mt-3 space-y-3">
                  <div className="w-full flex justify-between items-center text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                    <span>Tiến trình mài dũa:</span>
                    <span className="font-bold text-[#1A1A1A] dark:text-stone-200">
                      {studied}/{total} từ ({percent}%)
                    </span>
                  </div>

                  <div className="flex gap-2 justify-end w-full bg-transparent">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Bạn có chắc muốn xoá sạch hoàn toàn phản xạ của Chặng ${idx + 1} (${blockTitle}) để bắt đầu học lại từ đầu?`)) {
                          resetClusterProgress(vocabIds);
                          loadProgress();
                          showNotification(`Đã xóa sạch tiến trình Chặng ${idx + 1}!`);
                        }
                      }}
                      disabled={studied === 0}
                      className={`px-2.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg border flex items-center gap-1 transition-all ${
                        studied === 0
                          ? 'border-stone-100 dark:border-stone-850/60 text-stone-300 dark:text-stone-700 bg-transparent cursor-not-allowed opacity-40'
                          : 'border-stone-200 dark:border-stone-800 hover:border-red-300 dark:hover:border-red-900 hover:text-red-650 dark:hover:text-red-400 text-stone-500 dark:text-stone-400 bg-white dark:bg-stone-850 cursor-pointer hover:shadow-xs'
                      }`}
                      title="Xoá tiến độ chặng này để học từ đầu"
                    >
                      <RotateCcw size={10} /> Đặt lại ↺
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartCluster(`stage_${idx + 1}`);
                      }}
                      className="px-2.5 py-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider rounded-lg bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Play size={10} fill="currentColor" /> Luyện tập
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
