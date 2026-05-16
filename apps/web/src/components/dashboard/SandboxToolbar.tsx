import React from 'react';
import { VOCABULARY_DATA } from '@zenith-jp/content';
import { 
  getMemoryStates, 
  saveMemoryStates, 
  resetAllProgress 
} from '../../services/progress.service';
import { Sliders, Clock, Trash2 } from 'lucide-react';

interface SandboxToolbarProps {
  loadProgress: () => void;
  showNotification: (msg: string) => void;
}

export default function SandboxToolbar({
  loadProgress,
  showNotification,
}: SandboxToolbarProps) {

  const handleSimulateReviews = (type: 'all' | 'random') => {
    const states = getMemoryStates();
    const learnedIds = Object.keys(states);
    const idsToSimulate = learnedIds.length > 0 ? learnedIds : VOCABULARY_DATA.slice(0, 6).map((v) => v.id);

    if (learnedIds.length === 0) {
      VOCABULARY_DATA.slice(0, 6).forEach((v) => {
        states[v.id] = {
          vocabId: v.id,
          memoryStrength: 2,
          recallSpeed: 2.1,
          replayCount: 1,
          hintUsageCount: 0,
          nextReviewAt: new Date().toISOString(),
          incorrectCount: 0,
          correctCount: 1,
          isWeak: true,
        };
      });
      showNotification("Mô phỏng thành công 6 từ vựng ở trạng thái cần ôn tập!");
    } else {
      idsToSimulate.forEach((id) => {
        if (!states[id]) {
          states[id] = {
            vocabId: id,
            memoryStrength: 1,
            recallSpeed: 3.2,
            replayCount: 1,
            hintUsageCount: 0,
            nextReviewAt: new Date(Date.now() - 5000).toISOString(),
            incorrectCount: 0,
            correctCount: 1,
            isWeak: true,
          };
        } else {
          states[id].nextReviewAt = new Date(Date.now() - 5000).toISOString();
          if (type === 'random') {
            states[id].isWeak = Math.random() > 0.5;
          }
        }
      });
      showNotification("Đã đẩy toàn bộ từ vựng đã học tới hạn Spaced Repetition!");
    }

    saveMemoryStates(states);
    loadProgress();
  };

  const handleReset = () => {
    if (window.confirm("Bạn có chắc muốn xoá hết tiến độ lưu trữ và bộ nhớ phản xạ của mình để khởi đầu lại?")) {
      resetAllProgress();
      loadProgress();
      showNotification("Đã khởi tạo lại toàn bộ tiến trình học!");
    }
  };

  return (
    <section className="p-4 bg-[#F5F2EF] dark:bg-stone-900/55 rounded-3xl border border-[#E5E1DA] dark:border-stone-800/60 space-y-3">
      <div className="flex items-center gap-2 text-[#1A1A1A] dark:text-stone-200">
        <Sliders size={16} className="text-[#4F46E5]" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">Trình Mô Phỏng Khắc Phục Lỗi (MVP Sandbox)</h3>
      </div>
      <p className="text-stone-650 dark:text-stone-400 text-[10px] leading-relaxed select-none">
        Sử dụng nút dưới đây để mộc hóa thử nghiệm trạng thái ôn tập đến hạn ngay tức thì để dễ dàng kiểm chứng dòng chảy ôn tập.
      </p>
      <div className="flex items-center gap-4 flex-wrap pt-1 font-mono">
        <button
          id="btn-simulate-due"
          onClick={() => handleSimulateReviews('all')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-indigo-950/40 text-stone-700 dark:text-indigo-300 hover:bg-[#F5F2EF] border border-[#E5E1DA] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Clock size={13} className="text-[#4F46E5]" /> Đẩy tất cả về "Đến hạn"
        </button>

        <button
          id="btn-simulate-due-random"
          onClick={() => handleSimulateReviews('random')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-orange-950/20 text-stone-700 dark:text-orange-300 hover:bg-[#F5F2EF] border border-[#E5E1DA] text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Clock size={13} className="text-amber-600" /> Ngẫu nhiên lỗi dồn dập
        </button>

        <button
          id="btn-system-reset"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 text-xs font-semibold border border-red-200 transition-all cursor-pointer"
        >
          <Trash2 size={13} /> Nhấn reset tiến độ dứt điểm
        </button>
      </div>
    </section>
  );
}
