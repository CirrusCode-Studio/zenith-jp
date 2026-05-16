import React, { useState, useEffect, useRef } from 'react';
import type { Vocab } from '@zenith-jp/core';
import { speakJapanese } from '../services/audio.service';
import { 
  recordRecallResult, 
  resetClusterProgress,
  getSavedStreamStepIndex,
  saveStreamStepIndex,
  clearStreamStepIndex
} from '../services/progress.service';
import VisualAnchor from './VisualAnchor';
import { 
  Volume2, 
  ChevronRight, 
  Check, 
  ArrowLeft, 
  Undo,
  RotateCcw
} from 'lucide-react';
import { VOCABULARY_DATA, VOCABULARY_CLUSTERS } from '@zenith-jp/content';

interface LearningRunnerProps {
  clusterId: string;
  clusterTitle: string;
  clusterVocabs: Vocab[];
  onBackToDashboard: () => void;
}

export interface StreamStep {
  id: string;
  type: 'exposure' | 'writing' | 'recall' | 'audio_recall' | 'multiple_choice';
  word: Vocab;
  choices?: string[];
  isWeakReview?: boolean;
  blockNumber?: number;
  blockTitle?: string;
  isMacroReview?: boolean;
}

// Encouragement quotes for Zen-like learning style
const ENCOURAGEMENTS_CORRECT = [
    "Rất tốt! Từ vựng đã bắt đầu khắc sâu vào tâm trí bạn.",
    "Chính xác! Trí lực phản xạ đang hoạt động cực nhạy.",
    "Khá lắm! Bạn đang hình thành mối liên kết ngữ nghĩa vững chắc.",
    "Tuyệt vời. Đúng như dòng chảy tự nhiên.",
    "Rất chuẩn! Não bộ của bạn ghi nhớ rất mượt mà."
];

const ENCOURAGEMENTS_INCORRECT = [
    "Không sao cả, hãy gieo lại mầm ký ức.",
    "Từng bước một. Gợi nhớ lại chính là cách củng cố nơ-ron.",
    "Nhẹ nhàng lắng nghe và cảm nhận lại giai điệu của từ.",
    "Não bộ đang thiết lập liên kết nơ-ron mới, hãy tiếp tục học nhé."
];

// Helper to generate 3 choices for multiple choice questions
function generateChoicesForWord(targetWord: Vocab): string[] {
  const incorrectCandidates = VOCABULARY_DATA.filter(w => w.id !== targetWord.id);
  const shuffled = [...incorrectCandidates].sort(() => 0.5 - Math.random());
  const correctAnswer = targetWord.meaning;
  const wrong1 = shuffled[0]?.meaning || "Không rõ";
  const wrong2 = shuffled[1]?.meaning || "Chưa xác định";
  return [correctAnswer, wrong1, wrong2].sort(() => 0.5 - Math.random());
}

export default function LearningRunner({
  clusterId,
  clusterTitle,
  clusterVocabs,
  onBackToDashboard
}: LearningRunnerProps) {
  // --- STATE ---
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [resumePrompt, setResumePrompt] = useState<boolean>(false);
  const [savedStepVal, setSavedStepVal] = useState<number>(0);
  
  // Controls
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow'>('normal');
  const [autoplay, setAutoplay] = useState<boolean>(true);
  const [replaysThisWord, setReplaysThisWord] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Stats / Extra queues
  const [failedStepsThisSession, setFailedStepsThisSession] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Timing
  const wordStartTimeRef = useRef<number>(Date.now());

  // Check for saved progress on load
  useEffect(() => {
    if (clusterId === 'zenith_stream' && steps.length > 0) {
      const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
      const saved = getSavedStreamStepIndex(lessonId);
      if (saved !== null) {
        if (saved > 0 && saved < steps.length) {
          setSavedStepVal(saved);
          setResumePrompt(true);
        }
      }
    }
  }, [steps, clusterId, clusterVocabs]);

  // --- INITIALIZE STREAM STEPS ---
  useEffect(() => {
    const generatedSteps: StreamStep[] = [];
    const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
    const lessonClusters = VOCABULARY_CLUSTERS.filter(c => c.lessonId === lessonId);

    const getBlockTitleForIndex = (idx: number) => {
      const cluster = lessonClusters[idx];
      return cluster ? (cluster.vietnameseTitle || cluster.title) : `Nhóm bổ túc ${idx + 1}`;
    };

    // Divide clusterVocabs into blocks of size 5
    const blockSize = 5;
    const blocks: Vocab[][] = [];
    for (let i = 0; i < clusterVocabs.length; i += blockSize) {
      blocks.push(clusterVocabs.slice(i, i + blockSize));
    }

    // Generate steps for each block with micro and macro loopback reviews
    blocks.forEach((block, blockIndex) => {
      const L = block.length;
      const blockTitle = getBlockTitleForIndex(blockIndex);
      
      // We will interleave Exposure + Writing with Recalls
      // For each word j in this block, introduce it and then if j >= 1, recall the previous word (j-1)
      block.forEach((word, j) => {
        // Step 1: Exposure of word j
        generatedSteps.push({
          id: `exp-b${blockIndex}-w${j}-${word.id}`,
          type: 'exposure',
          word,
          blockNumber: blockIndex + 1,
          blockTitle,
          isMacroReview: false
        });

        // Step 2: Writing of word j
        generatedSteps.push({
          id: `wri-b${blockIndex}-w${j}-${word.id}`,
          type: 'writing',
          word,
          blockNumber: blockIndex + 1,
          blockTitle,
          isMacroReview: false
        });

        // Step 3: Loopback recall of the previous word in the same block: "như từ 1, học xong đến từ số 2 thì quay lại từ 1"
        if (j >= 1) {
          generatedSteps.push({
            id: `rec-b${blockIndex}-prev-w${j-1}-${block[j - 1].id}`,
            type: 'recall',
            word: block[j - 1],
            blockNumber: blockIndex + 1,
            blockTitle,
            isMacroReview: false
          });
        }
      });

      // After doing all exposures/writings in this block, recall the last word of this block!
      if (L > 0) {
        generatedSteps.push({
          id: `rec-b${blockIndex}-last-${block[L - 1].id}`,
          type: 'recall',
          word: block[L - 1],
          blockNumber: blockIndex + 1,
          blockTitle,
          isMacroReview: false
        });
      }

      // Macro-Review Loopback for previous block: "cho đến khi hết 5 từ của cluster hai thì quay lại cluster 1, rồi mới qua cluster 3"
      if (blockIndex > 0) {
        const prevBlockIndex = blockIndex - 1;
        const prevBlock = blocks[prevBlockIndex];
        const prevBlockTitle = getBlockTitleForIndex(prevBlockIndex);
        
        // Loop back to recall the previous block's words in sequence
        prevBlock.forEach((word, prevIndex) => {
          // Use varied recall modes: Multiple Choice, Audio Recall, Standard Recall
          let type: 'multiple_choice' | 'audio_recall' | 'recall' = 'recall';
          if (prevIndex % 3 === 0) {
            type = 'multiple_choice';
          } else if (prevIndex % 3 === 1) {
            type = 'audio_recall';
          }

          generatedSteps.push({
            id: `macro-prev-b${prevBlockIndex}-w${prevIndex}-${type}-${word.id}`,
            type,
            word,
            choices: type === 'multiple_choice' ? generateChoicesForWord(word) : undefined,
            blockNumber: prevBlockIndex + 1,
            blockTitle: `Ôn Trọng Điểm: ${prevBlockTitle}`,
            isMacroReview: true
          });
        });
      }
    });

    setSteps(generatedSteps);
    setCurrentStepIndex(0);
    setIsSessionComplete(false);
    wordStartTimeRef.current = Date.now();
  }, [clusterVocabs]);

  // --- AUTOPLAY SOUND ON MOUNT / CHANGE ---
  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (currentStep && autoplay) {
      const wait = setTimeout(() => {
        speakJapanese(currentStep.word.kana, voiceSpeed);
      }, 350);
      return () => clearTimeout(wait);
    }
  }, [currentStepIndex, steps, autoplay]);

  // Reset metrics on each step transition
  useEffect(() => {
    setAnswerRevealed(false);
    setSelectedChoice(null);
    setReplaysThisWord(0);
    setHintsUsed(0);
    setFeedback('');
    wordStartTimeRef.current = Date.now();

    // Save step progress for continuous study sessions
    if (clusterId === 'zenith_stream' && steps.length > 0) {
      const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
      saveStreamStepIndex(lessonId, currentStepIndex);
    }
  }, [currentStepIndex, steps, clusterId]);

  // keyboard event handler for speedy flow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSessionComplete || !currentStep) return;

      if (e.code === 'Space') {
        const canPlay = ['exposure', 'writing', 'recall', 'audio_recall'].includes(currentStep.type);
        if (canPlay) {
          e.preventDefault();
          playSpeaker();
        }
      }

      if (e.code === 'Enter') {
        e.preventDefault();
        if (currentStep.type === 'exposure') {
          handleNextStep();
        } else if (currentStep.type === 'writing') {
          handleNextStep();
        } else if ((currentStep.type === 'recall' || currentStep.type === 'audio_recall') && !answerRevealed) {
          setAnswerRevealed(true);
          speakJapanese(currentStep.word.kana, voiceSpeed);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStepIndex, steps, answerRevealed, isSessionComplete]);

  if (isSessionComplete) {
    return renderCompletionScreen();
  }

  if (steps.length === 0 || !currentStep) {
    return (
      <div className="py-20 text-center text-stone-500 font-mono text-xs">
        Đang khởi chạy luồng dồn lực nơ-ron...
      </div>
    );
  }

  // Speak sound out loud
  const playSpeaker = () => {
    setReplaysThisWord(prev => prev + 1);
    speakJapanese(currentStep.word.kana, voiceSpeed);
  };

  // Submit actual outcome to Spaced Repetition engine
  const handleRecallResult = (correct: boolean) => {
    const duration = Date.now() - wordStartTimeRef.current;
    
    // Save state
    recordRecallResult(
      currentStep.word.id,
      correct,
      duration,
      hintsUsed,
      replaysThisWord
    );

    if (!correct) {
      // track that this word failed to possibly suggest reinforcing later
      if (!failedStepsThisSession.includes(currentStep.word.id)) {
        setFailedStepsThisSession(prev => [...prev, currentStep.word.id]);
      }
    }

    handleNextStep();
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Done with steps list!
      // If there are words the user failed this session, we can dynamically append active recall check steps to ensure 100% mastery!
      if (failedStepsThisSession.length > 0) {
        const extraSteps: StreamStep[] = failedStepsThisSession.map((wordId, idx) => {
          const vocab = VOCABULARY_DATA.find(v => v.id === wordId)!;
          return {
            id: `extra-reinforce-${wordId}-${idx}`,
            type: 'recall',
            word: vocab
          };
        });
        // Clear failed words and append them
        setFailedStepsThisSession([]);
        setSteps(prev => [...prev, ...extraSteps]);
        setCurrentStepIndex(prev => prev + 1);
      } else {
        setIsSessionComplete(true);
      }
    }
  };

  // Handle multiple choice clicking
  const handleMultipleChoiceSelect = (choice: string) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    
    const isCorrect = choice === currentStep.word.meaning;
    const duration = Date.now() - wordStartTimeRef.current;

    recordRecallResult(
      currentStep.word.id,
      isCorrect,
      duration,
      0,
      replaysThisWord
    );

    if (isCorrect) {
      const idx = Math.floor(Math.random() * ENCOURAGEMENTS_CORRECT.length);
      setFeedback(ENCOURAGEMENTS_CORRECT[idx]);
    } else {
      setFeedback(`Ký ức đúng là: "${currentStep.word.meaning}"`);
      if (!failedStepsThisSession.includes(currentStep.word.id)) {
        setFailedStepsThisSession(prev => [...prev, currentStep.word.id]);
      }
    }
  };

  // Get dynamic step category title
  const getStepCategoryTitle = () => {
    const isMacro = currentStep.isMacroReview;
    const blockPrefix = currentStep.blockNumber 
      ? `[Nhóm ${currentStep.blockNumber}/9] ` 
      : "";
    
    if (currentStep.isWeakReview) return "Hồi Tưởng Cố Nhân (Ôn tập bổ sung)";
    
    let baseTitle = "";
    switch (currentStep.type) {
      case 'exposure': baseTitle = "Lắng nghe & Thấu cảm"; break;
      case 'writing': baseTitle = "Luyện viết tay"; break;
      case 'recall': baseTitle = isMacro ? "Quay lại ôn tập" : "Phản xạ Gợi nhớ"; break;
      case 'audio_recall': baseTitle = isMacro ? "Quay lại nghe dịch" : "Đôi tai Thính nhạy"; break;
      case 'multiple_choice': baseTitle = isMacro ? "Quay lại trắc nghiệm" : "Nhận diện Trực giác"; break;
      default: baseTitle = "Dòng chảy Trí nhớ"; break;
    }
    return `${blockPrefix}${baseTitle}`;
  };

  if (steps.length === 0 || !currentStep) {
    return (
      <div className="w-full max-w-lg mx-auto bg-[#FDFCFB] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-3xl p-6 md:p-8 text-center space-y-4 shadow-xl">
        <p className="text-sm text-stone-500 font-sans">Đang tạo sơ đồ liên kết neuron...</p>
      </div>
    );
  }

  // Handle resume prompt if active
  if (resumePrompt) {
    return (
      <div className="w-full max-w-lg mx-auto bg-[#FDFCFB] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        <div className="py-4">
          <span className="inline-block p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/25 text-[#4F46E5] dark:text-indigo-400 mb-4 shadow-xs border border-indigo-200">
            <Undo size={32} className="animate-spin text-[#4F46E5]" style={{ animationDuration: '4s' }} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif italic">
            Phục Hồi Dòng Chảy Ký Ức
          </h1>
          <p className="text-stone-500 dark:text-stone-400 text-xs mt-2 font-sans max-w-xs mx-auto leading-relaxed">
            Hệ thống phát hiện bạn đang học dở dang **Bài học Zenith** ở bước <b>{savedStepVal + 1} / {steps.length}</b>. Bạn có muốn tiếp tục rèn giũa từ điểm này để duy trì dòng chảy tri thức hay thiết lập khởi động hoàn cảnh mới từ đầu?
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => {
              setCurrentStepIndex(savedStepVal);
              setResumePrompt(false);
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-semibold hover:bg-[#4F46E5]/95 active:scale-[0.98] transition-all shadow-md cursor-pointer text-xs tracking-wider font-sans"
          >
            Học Tiếp Tiến Trình Dở Dang (Khuyên dùng)
          </button>
          
          <button
            onClick={() => {
              const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
              clearStreamStepIndex(lessonId);
              setCurrentStepIndex(0);
              setResumePrompt(false);
            }}
            className="w-full py-3 px-6 rounded-xl border border-[#E5E1DA] text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 text-xs font-semibold cursor-pointer transition-all font-sans"
          >
            Học Lại Từ Đầu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-[#FDFCFB] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-3xl p-6 md:p-8 shadow-xl transition-all duration-300">
      
      {/* HEADER RAIL METRICS */}
      <div className="flex items-center justify-between border-b border-[#E5E1DA] dark:border-stone-800/40 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <button 
            id="btn-back-dashboard"
            onClick={onBackToDashboard} 
            className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 transition-colors cursor-pointer"
          >
            <ArrowLeft size={13} /> Thôi Học
          </button>
          
          <span className="text-stone-300 dark:text-stone-850">|</span>

          <button
            onClick={() => {
              if (window.confirm(`Bạn có chắc chắn muốn đặt lại toàn bộ tiến độ rèn luyện và học lại bài/chặng này từ đầu? Tất cả các mốc trí nhớ hiện tại của nhóm từ này sẽ xoá sạch.`)) {
                const vocabIds = clusterVocabs.map(v => v.id);
                resetClusterProgress(vocabIds);
                if (clusterId === 'zenith_stream') {
                  const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
                  clearStreamStepIndex(lessonId);
                }
                setCurrentStepIndex(0);
                setAnswerRevealed(false);
                setSelectedChoice(null);
                setFeedback('Dữ liệu nhóm này đã được reset về 0!');
              }
            }}
            className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-500 hover:text-red-650 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer"
            title="Nhấn để xoá sạch trí nhớ nhóm này và học lại từ đầu"
          >
            <RotateCcw size={11} /> Đặt lại ↺
          </button>
        </div>
        
        <span className="text-[10px] font-mono tracking-widest uppercase bg-[#F5F2EF] dark:bg-stone-800 px-3 py-1 rounded-full text-stone-700 dark:text-stone-300 border border-[#E5E1DA] dark:border-stone-700 font-bold max-w-37.5 md:max-w-xs truncate">
          {getStepCategoryTitle()}
        </span>
      </div>

      {/* ZEN PROGRESS BAR */}
      <div className="w-full bg-[#F5F2EF] dark:bg-stone-800 h-1.5 rounded-full mb-6 overflow-hidden border border-[#E5E1DA] dark:border-stone-800">
        <div 
          className="bg-[#4F46E5] h-full transition-all duration-500 rounded-full"
          style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>

      <div className="text-right text-[10px] font-mono text-stone-650 dark:text-stone-400 mb-4 tracking-wider">
        Bước {currentStepIndex + 1} trong tổng {steps.length}
      </div>

      {currentStep.blockTitle && (
        <div className="text-center text-[10px] uppercase font-mono font-black tracking-widest text-[#4F46E5] dark:text-indigo-400 mb-5 bg-[#4F46E5]/5 dark:bg-indigo-950/20 py-2 px-3 rounded-xl border border-[#4F46E5]/10 animate-fadeIn">
          {currentStep.isMacroReview ? "🔄 Ôn tập " : "📖 "}{currentStep.blockTitle}
        </div>
      )}

      {/* RENDER DYNAMIC CARD BASED ON STEP TYPE */}
      {currentStep.type === 'exposure' && (
        <div className="space-y-6 text-center animate-fadeIn" id="step-exposure">
          <div className="flex justify-center my-1">
            <VisualAnchor iconName={currentStep.word.iconName} vocabId={currentStep.word.id} size="lg" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-5xl font-extrabold tracking-tight text-stone-900 dark:text-stone-50 font-serif">
              {currentStep.word.kana}
            </h1>
            {currentStep.word.kanji && (
              <p className="text-sm text-stone-600 dark:text-stone-400 font-mono italic">
                {currentStep.word.kanji}
              </p>
            )}
            <p className="text-xs text-stone-600 dark:text-stone-400 tracking-wider">
              Romaji: {currentStep.word.romaji}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <button
              id={`btn-play-sound-${currentStep.word.id}`}
              onClick={playSpeaker}
              className="p-5 rounded-full bg-[#F5F2EF] dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 hover:bg-[#E5E1DA] active:scale-95 transition-all border border-[#E5E1DA] dark:border-indigo-900/30 cursor-pointer shadow-xs"
              title="Phát âm thanh bản xứ"
            >
              <Volume2 size={34} />
            </button>

            <div className="flex flex-col gap-1 items-start text-left bg-[#F5F2EF] dark:bg-stone-800/40 p-2 rounded-xl border border-[#E5E1DA] dark:border-stone-700/50 text-[10px]">
              <label className="flex items-center gap-1 text-stone-600 dark:text-stone-400 font-medium">
                <input 
                  type="checkbox" 
                  checked={autoplay} 
                  onChange={(e) => setAutoplay(e.target.checked)}
                  className="rounded text-[#4F46E5] scale-90"
                />
                Tự động phát âm
              </label>
              <div className="flex gap-2 mt-1 border-t border-[#E5E1DA] dark:border-stone-700/50 pt-1 w-full font-mono text-[9px]">
                <button 
                  onClick={() => setVoiceSpeed('normal')} 
                  className={`px-1.5 py-0.5 rounded ${voiceSpeed === 'normal' ? 'bg-[#4F46E5] text-white font-bold' : 'text-stone-400'}`}
                >
                  Nhanh
                </button>
                <button 
                  onClick={() => setVoiceSpeed('slow')} 
                  className={`px-1.5 py-0.5 rounded ${voiceSpeed === 'slow' ? 'bg-[#4F46E5] text-white font-bold' : 'text-stone-400'}`}
                >
                  Rùa
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50/50 dark:bg-amber-950/10 rounded-2xl border border-orange-100 dark:border-stone-800 text-stone-900 dark:text-stone-300 font-sans">
            <div className="text-[10px] uppercase text-amber-650 dark:text-amber-400 font-mono tracking-widest mb-1">Nghĩa tiếng Việt</div>
            <p className="text-base font-bold font-serif italic text-black dark:text-stone-50">"{currentStep.word.meaning}"</p>
          </div>

          <div className="pt-2">
            <button
              id="btn-goto-writing"
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-medium hover:bg-[#4F46E5]/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              Tiếp tục luyện viết <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {currentStep.type === 'writing' && (
        <div className="space-y-6 text-center animate-fadeIn" id="step-writing">
          <div className="flex justify-center">
            <VisualAnchor iconName={currentStep.word.iconName} vocabId={currentStep.word.id} size="md" />
          </div>

          <div className="py-4 bg-[#F9F7F5] dark:bg-stone-800/50 rounded-2xl border border-[#E5E1DA] dark:border-stone-800 p-5">
            <div className="text-5xl font-extrabold tracking-tight text-[#1A1A1A] dark:text-stone-50 font-sans mb-2">
              {currentStep.word.kana}
            </div>
            <div className="text-stone-600 dark:text-stone-400 text-xs font-mono font-bold">
              {currentStep.word.kanji ? `${currentStep.word.kanji} • ` : ''}{currentStep.word.romaji}
            </div>
          </div>

          <button 
            id={`btn-play-writing-${currentStep.word.id}`}
            onClick={playSpeaker}
            className="mx-auto flex items-center gap-1.5 text-xs bg-[#F5F2EF] dark:bg-indigo-950/35 text-[#4F46E5] dark:text-indigo-400 px-4 py-2 rounded-full hover:bg-[#E5E1DA] transition-all font-medium border border-[#E5E1DA] cursor-pointer"
          >
            <Volume2 size={13} /> Lắng nghe âm điệu
          </button>

          <div className="p-4 bg-amber-50/40 dark:bg-emerald-950/10 rounded-2xl border border-amber-200/30">
            <p className="text-amber-900 dark:text-amber-400 text-xs font-bold font-sans">
              ✎ Hãy đặt giấy bút kế bên & viết từ này 1 lần:
            </p>
            <div className="mt-2 text-2xl font-mono text-amber-800 dark:text-amber-300 tracking-wider bg-white dark:bg-stone-800 px-4 py-2 rounded-xl inline-block border border-[#E5E1DA] dark:border-stone-750 shadow-xs">
              {currentStep.word.kana}
            </div>
            <p className="text-[10px] text-stone-650 dark:text-stone-400 mt-2 italic max-w-xs mx-auto">
              Cơ vận động ngón tay liên kết chặt chẽ với vùng ghi nhớ ngôn ngữ ở thùy thái dương.
            </p>
          </div>

          <div className="pt-2">
            <button
              id="btn-writing-done"
              onClick={handleNextStep}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-medium hover:bg-[#4F46E5]/90 active:scale-[0.98] transition-all shadow-md cursor-pointer"
            >
              Tôi Đã Viết Xong <Check size={15} />
            </button>
          </div>
        </div>
      )}

      {currentStep.type === 'recall' && (
        <div className="space-y-6 text-center animate-fadeIn" id="step-recall">
          <div className="flex justify-center">
            <VisualAnchor iconName={currentStep.word.iconName} vocabId={currentStep.word.id} size="md" />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] tracking-widest font-mono text-stone-600 dark:text-stone-400 block">Nghĩa tiếng Việt là:</span>
            <h2 className="text-2xl font-bold font-serif italic text-black dark:text-stone-50 my-2 block px-5 py-3.5 border border-[#E5E1DA] dark:border-stone-800 bg-[#F9F7F5] dark:bg-stone-800 rounded-2xl text-center shadow-xs">
              "{currentStep.word.meaning}"
            </h2>
          </div>

          {answerRevealed ? (
            <div className="py-4 bg-[#F9F7F5] dark:bg-stone-800/40 rounded-2xl border border-[#E5E1DA] dark:border-stone-800 space-y-3 animate-slideUp">
              <div className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400 font-sans">
                {currentStep.word.kana}
              </div>
              <div className="text-stone-700 dark:text-stone-300 text-xs font-mono font-bold">
                {currentStep.word.kanji ? `${currentStep.word.kanji} • ` : ''}{currentStep.word.romaji}
              </div>
              <button
                id={`btn-play-reveal-${currentStep.word.id}`}
                onClick={playSpeaker}
                className="mx-auto flex items-center gap-1.5 text-xs bg-[#F5F2EF] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-750 text-[#4F46E5] px-3.5 py-1.5 rounded-full hover:bg-[#E5E1DA] transition-all cursor-pointer"
              >
                <Volume2 size={13} /> Nghe chuẩn âm
              </button>
            </div>
          ) : (
            <div className="py-4">
              <button
                id="btn-reveal-answer"
                onClick={() => {
                  setAnswerRevealed(true);
                  playSpeaker();
                }}
                className="w-full py-4 px-6 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-800 font-semibold transition-all shadow-xs cursor-pointer"
              >
                👁️ Trực Giác Khám Phá (Xem Đáp Án)
              </button>
              <p className="text-[10px] text-stone-600 dark:text-stone-400 mt-2 font-mono italic">
                (Hãy phác thảo/hình dung từ trong đầu trước khi mở thẻ)
              </p>
            </div>
          )}

          {answerRevealed && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                id="btn-forgot-vocab"
                onClick={() => {
                  setHintsUsed(prev => prev + 1);
                  handleRecallResult(false);
                }}
                className="py-3 px-4 rounded-xl border border-red-200/60 text-xs font-bold bg-red-50 text-red-650 hover:bg-red-100 active:scale-95 transition-all text-center cursor-pointer"
              >
                😅 Chưa nhớ ra
              </button>
              <button
                id="btn-correct-vocab"
                onClick={() => handleRecallResult(true)}
                className="py-3 px-4 rounded-xl border border-emerald-250 text-xs font-bold bg-emerald-50 text-emerald-650 hover:bg-emerald-100 active:scale-95 transition-all text-center cursor-pointer"
              >
                ✅ Đã phản xạ đúng!
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'audio_recall' && (
        <div className="space-y-6 text-center animate-fadeIn" id="step-audio-recall">
          <span className="text-[10px] font-mono text-stone-600 dark:text-stone-400 uppercase tracking-widest block">Thử Thách Nghe Phản Xạ</span>
          
          <div className="flex justify-center">
            <button
              id={`btn-listen-trigger-${currentStep.word.id}`}
              onClick={playSpeaker}
              className="p-7 rounded-full bg-[#F5F2EF] dark:bg-stone-800 text-[#4F46E5] dark:text-indigo-400 hover:scale-105 active:scale-95 transition-all border border-[#E5E1DA] dark:border-stone-700 cursor-pointer shadow-md"
              title="Nhấp để nghe"
            >
              <Volume2 size={44} className="animate-pulse" />
            </button>
          </div>
          
          <p className="text-xs text-stone-700 dark:text-stone-300 italic max-w-xs mx-auto">
            Nhấp biểu tượng để nghe âm thanh, đoán nghĩa Việt của từ này trong đầu.
          </p>

          {answerRevealed ? (
            <div className="p-4 bg-[#F9F7F5] dark:bg-stone-800 border border-[#E5E1DA] rounded-2xl space-y-2 animate-slideUp">
              <span className="text-[10px] uppercase text-stone-650 dark:text-stone-400 block font-mono">Ý nghĩa chuẩn là:</span>
              <h3 className="text-2xl font-bold font-serif italic text-black dark:text-stone-50">
                "{currentStep.word.meaning}"
              </h3>
              <p className="text-xs text-[#4F46E5] font-mono leading-relaxed font-bold">
                {currentStep.word.kana} ({currentStep.word.romaji})
              </p>
            </div>
          ) : (
            <div className="pt-2">
              <button
                id="btn-reveal-audio-answer"
                onClick={() => setAnswerRevealed(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300 text-amber-850 text-xs font-semibold cursor-pointer shadow-xs"
              >
                👁️ Kiểm Chứng Ý Nghĩa
              </button>
            </div>
          )}

          {answerRevealed && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <button
                id="btn-forgot-audio"
                onClick={() => handleRecallResult(false)}
                className="py-3 px-4 rounded-xl border border-red-200/60 text-xs font-bold bg-red-50 text-red-650 hover:bg-red-100 active:scale-95 transition-all text-center cursor-pointer"
              >
                😅 Chưa nhớ ra
              </button>
              <button
                id="btn-correct-audio"
                onClick={() => handleRecallResult(true)}
                className="py-3 px-4 rounded-xl border border-emerald-250 text-xs font-bold bg-emerald-50 text-emerald-650 hover:bg-emerald-100 active:scale-95 transition-all text-center cursor-pointer"
              >
                ✅ Đã phản xạ đúng!
              </button>
            </div>
          )}
        </div>
      )}

      {currentStep.type === 'multiple_choice' && (
        <div className="space-y-6 text-center animate-fadeIn" id="step-multiple-choice">
          <div className="flex justify-between items-center bg-[#F5F2EF] dark:bg-stone-800 px-3 py-1.5 rounded-lg text-[10px] font-mono text-stone-700 dark:text-stone-300 border border-[#E5E1DA] dark:border-stone-700">
            <span>Bài kiểm tra trắc nghiệm phản xạ</span>
            <span className="uppercase text-[#4F46E5] font-black">Hiragana ➔ Nghĩa</span>
          </div>

          <div className="py-4 bg-[#F9F7F5] dark:bg-stone-800/40 rounded-2xl border border-[#E5E1DA] dark:border-stone-800/80 p-5">
            <h2 className="text-4xl font-extrabold text-[#1A1A1A] dark:text-stone-50 font-sans mb-1">
              {currentStep.word.kana}
            </h2>
            <button 
              onClick={playSpeaker}
              className="p-1.5 rounded-full bg-white dark:bg-stone-800 text-[#4F46E5] hover:bg-stone-100 inline-flex transition-transform hover:scale-105 active:scale-95 cursor-pointer mt-1 border border-[#E5E1DA]"
              title="Nghe lại âm"
            >
              <Volume2 size={13} />
            </button>
          </div>

          <div className="space-y-2.5 pt-1 text-left">
            {currentStep.choices?.map((choice, i) => {
              const isSelected = selectedChoice === choice;
              const isCorrectTarget = choice === currentStep.word.meaning;
              
              let choiceStyle = "border-[#E5E1DA] hover:bg-[#F5F2EF] text-black bg-white dark:bg-stone-900 dark:border-stone-800 dark:hover:bg-stone-800/60";
              
              if (selectedChoice) {
                if (isCorrectTarget) {
                  choiceStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold dark:text-emerald-400";
                } else if (isSelected) {
                  choiceStyle = "bg-red-50 border-red-400 text-red-800 font-bold dark:text-red-400";
                } else {
                  choiceStyle = "opacity-55 border-stone-200 text-stone-400 cursor-not-allowed";
                }
              }

              return (
                <button
                  key={i}
                  id={`btn-choice-${i}`}
                  disabled={selectedChoice !== null}
                  onClick={() => handleMultipleChoiceSelect(choice)}
                  className={`w-full p-4 rounded-xl border text-xs font-semibold tracking-wide transition-all ${choiceStyle} flex items-center justify-between cursor-pointer`}
                >
                  <span>{choice}</span>
                  {selectedChoice && isCorrectTarget && (
                    <Check size={16} className="text-emerald-600 dark:text-emerald-400 mr-1" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedChoice && (
            <div className="space-y-4 animate-slideUp">
              <div className="p-3 bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:border-stone-750 rounded-xl text-[11px] text-black dark:text-stone-200 font-sans italic font-medium">
                {feedback}
              </div>

              <button
                id="btn-mc-next"
                onClick={handleNextStep}
                className="w-full flex items-center justify-center gap-1 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-semibold hover:bg-[#4F46E5]/90 transition-all cursor-pointer shadow-sm text-xs"
              >
                Tiếp tục chuỗi ➔
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // --- RENDER COMPLETION SUMMARY (ZEN STYLE) ---
  function renderCompletionScreen() {
    // Clear saved progress on full completion
    if (clusterId === 'zenith_stream') {
      const lessonId = clusterVocabs?.[0]?.lessonId || 'lesson_1';
      clearStreamStepIndex(lessonId);
    }

    return (
      <div className="w-full max-w-lg mx-auto bg-[#FDFCFB] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-3xl p-6 md:p-8 shadow-xl text-center space-y-6 animate-fadeIn">
        <div className="py-4">
          <span className="inline-block p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 mb-4 shadow-xs border border-emerald-200">
            <Check size={40} />
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-50 font-serif italic">
            Dòng Chảy Đã Kết Tinh!
          </h1>
          <p className="text-stone-750 dark:text-stone-300 text-xs mt-2 font-sans max-w-xs mx-auto">
            Chúc mừng bạn đã hoàn thành hoàn chỉnh một chuỗi nơ-ron học tập liên tục. Trí lực của bạn đã tiến sâu thêm một bước lớn.
          </p>
        </div>

        <div className="p-5 bg-[#F9F7F5] dark:bg-stone-800 rounded-2xl border border-[#E5E1DA] dark:border-stone-800 text-left space-y-4">
          <h4 className="text-[10px] font-bold text-stone-650 dark:text-stone-400 uppercase tracking-widest font-mono">Kết quả thu hoạch</h4>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white dark:bg-stone-900 border border-[#E5E1DA] p-3.5 rounded-xl text-center">
              <span className="text-[9px] text-stone-600 dark:text-stone-400 block uppercase font-mono mb-1">Mục tiêu củng cố</span>
              <span className="text-lg font-black font-mono text-[#4F46E5]">{clusterVocabs.length} từ vựng</span>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-[#E5E1DA] p-3.5 rounded-xl text-center">
              <span className="text-[9px] text-stone-600 dark:text-stone-400 block uppercase font-mono mb-1">Phản xạ ghi dấu</span>
              <span className="text-lg font-black font-mono text-emerald-600">Thành công</span>
            </div>
          </div>

          <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed font-sans">
            🌟 <b>Lời khuyên thông thái:</b> Hãy để nơ-ron thần kinh nghỉ ngơi. Thuật toán Spaced Repitition đã cập nhật chính xác độ bền ký lực. Những từ này sẽ tự động tái lộ diện trong kì hạn ôn tập tới để bảo lưu trí nhớ dài hạn của bạn.
          </p>
        </div>

        <div className="pt-2">
          <button
            id="btn-complete-back"
            onClick={onBackToDashboard}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-[#4F46E5] text-white font-semibold hover:bg-[#4F46E5]/95 active:scale-[0.98] transition-all shadow-md cursor-pointer text-xs tracking-wider"
          >
            Quay lại bến bờ tĩnh lặng (Dashboard)
          </button>
        </div>
      </div>
    );
  }
}
