import React, { useState, useEffect, useRef } from 'react';
import type { Vocab } from '@zenith-jp/core';
import { speakJapanese } from '../services/audio.service';
import { 
  recordRecallResult, 
  getMemoryStates, 
  resetClusterProgress,
  getSavedStreamStepIndex,
  saveStreamStepIndex,
  clearStreamStepIndex
} from '../services/progress.service';
import VisualAnchor from './VisualAnchor';
import { 
  Volume2, Play, Pause, SkipForward, SkipBack, ArrowLeft, 
  Check, X, RotateCcw, Sliders, Zap, Brain, Timer, Sparkles
} from 'lucide-react';
import { VOCABULARY_DATA } from '@zenith-jp/content';
import { motion, AnimatePresence } from 'motion/react';

interface LearningRunnerProps {
  clusterId: string;
  clusterTitle: string;
  clusterVocabs: Vocab[];
  onBackToDashboard: () => void;
}

export interface StreamStep {
  id: string;
  type: 'exposure' | 'multiple_choice' | 'audio_recall' | 'flashcard_recall';
  word: Vocab;
  choices?: string[];
  blockNumber?: number;
  blockTitle?: string;
  isWeaved?: boolean;
}

// Generate Choices for Multiple Choice Challenge
function generateChoices(targetWord: Vocab): string[] {
  const wrongCandidates = VOCABULARY_DATA.filter(w => w.id !== targetWord.id);
  const shuffled = [...wrongCandidates].sort(() => 0.5 - Math.random());
  return [targetWord.meaning, shuffled[0].meaning, shuffled[1].meaning].sort(() => 0.5 - Math.random());
}

export default function LearningRunner({
  clusterId,
  clusterTitle,
  clusterVocabs,
  onBackToDashboard
}: LearningRunnerProps) {
  // Config & Session Startup
  const [isStarted, setIsStarted] = useState(false);
  const [studyMode, setStudyMode] = useState<'flow' | 'challenge'>('flow');
  const [voiceSpeed, setVoiceSpeed] = useState<'normal' | 'slow'>('normal');
  const [weaveOld, setWeaveOld] = useState(true);
  const [recursiveLoop, setRecursiveLoop] = useState(true);
  const [shadowTimeSec, setShadowTimeSec] = useState(2);
  const [shadowingEnabled, setShadowingEnabled] = useState(true);
  const [passiveRecallEnabled, setPassiveRecallEnabled] = useState(true);
  const [recallPauseSec, setRecallPauseSec] = useState(2);
  const [flowRevealed, setFlowRevealed] = useState(false);
  const [recallCountdown, setRecallCountdown] = useState(2);

  // Core Game State
  const [steps, setSteps] = useState<StreamStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);

  // Playback States
  const [isPlay, setIsPlay] = useState(true); 
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [activePhase, setActivePhase] = useState<'listen' | 'shadow'>('listen');
  const [shadowCountdown, setShadowCountdown] = useState(shadowTimeSec);

  // Active Challenge States
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isSuccessFeedback, setIsSuccessFeedback] = useState<boolean | null>(null);

  const wordStartRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const shadowTimerRef = useRef<any>(null);

  // Save Progress
  useEffect(() => {
    if (isStarted && clusterId === 'zenith_stream' && steps.length > 0) {
      const lessonId = clusterVocabs[0]?.lessonId || 'lesson_1';
      saveStreamStepIndex(lessonId, currentIndex);
    }
  }, [currentIndex, isStarted, steps]);

  // Load Saved Progress Check on Start
  const triggerStartSession = (mode: 'flow' | 'challenge') => {
    setStudyMode(mode);
    
    // Grab weaved words from previous lessons
    const states = getMemoryStates();
    const activeLessonId = clusterVocabs[0]?.lessonId || 'lesson_1';
    const oldIds = Object.keys(states).filter(id => {
      const v = VOCABULARY_DATA.find(w => w.id === id);
      return v && v.lessonId !== activeLessonId;
    });
    const weavedItems = VOCABULARY_DATA.filter(w => oldIds.includes(w.id)).slice(0, 2);

    const activeList = [...clusterVocabs];
    const generated: StreamStep[] = [];

    if (mode === 'flow') {
      // FLOW MODE: Progressive and Recursive Memory reinforcement loops
      const addExposureStep = (word: Vocab, idPrefix: string, isWeaved = false) => {
        generated.push({ id: `${idPrefix}-${word.id}-${generated.length}`, type: 'exposure', word, isWeaved });
      };

      if (recursiveLoop && activeList.length >= 2) {
        // Recursive loop logic: 1 -> 1,2 -> 1,2,3 -> 1,2,3,4 -> 1,2,3,4,5
        for (let j = 0; j < activeList.length; j++) {
          for (let k = 0; k <= j; k++) {
            // Weave first old word in block 3
            if (weaveOld && weavedItems[0] && j === 2 && k === 1) {
              addExposureStep(weavedItems[0], 'exp-weave', true);
            }
            addExposureStep(activeList[k], 'exp-rec');
          }
          // Weave second old word at block 4
          if (weaveOld && weavedItems[1] && j === 3) {
            addExposureStep(weavedItems[1], 'exp-weave', true);
          }
        }
        // Reverse reinforcement logic: 5 -> 5,4 -> 5,4,3 -> 5,4,3,2,1
        const rev = [...activeList].reverse();
        for (let j = 0; j < rev.length; j++) {
          for (let k = 0; k <= j; k++) {
            addExposureStep(rev[k], 'exp-rev');
          }
        }
      } else {
        // Linear path
        activeList.forEach(w => addExposureStep(w, 'exp-linear'));
      }
    } else {
      // CHALLENGE MODE: Active retrieval & test prompts
      const addTestSteps = (word: Vocab, isWeaved = false) => {
        const types: ('multiple_choice' | 'audio_recall' | 'flashcard_recall')[] = ['multiple_choice', 'audio_recall', 'flashcard_recall'];
        const type = types[Math.floor(Math.random() * types.length)];
        generated.push({
          id: `test-${type}-${word.id}-${generated.length}`,
          type,
          word,
          choices: type === 'multiple_choice' ? generateChoices(word) : undefined,
          isWeaved
        });
      };

      if (recursiveLoop && activeList.length >= 2) {
        // Build an intense recall challenge queue
        activeList.forEach((w, idx) => {
          addTestSteps(w);
          if (idx >= 1) addTestSteps(activeList[idx - 1]);
          if (idx >= 3 && weavedItems[0]) addTestSteps(weavedItems[0], true);
        });
        // Reverse testing cards
        [...activeList].reverse().forEach(w => {
          generated.push({ id: `test-rev-fc-${w.id}-${generated.length}`, type: 'flashcard_recall', word: w });
        });
      } else {
        // Flat testing deck
        activeList.forEach(w => {
          generated.push({
            id: `test-flat-${w.id}`,
            type: 'multiple_choice',
            word: w,
            choices: generateChoices(w)
          });
        });
      }
    }

    setSteps(generated);
    setCurrentIndex(0);
    setIsStarted(true);
    setIsSessionComplete(false);
  };

  // Autoplay Voice and Progressive Reveal Loop on transition
  const activeStep = steps[currentIndex];

  const startSpeechAndAutoAdvance = () => {
    setIsAudioPlaying(true);
    setAudioProgress(0);
    setShadowCountdown(shadowTimeSec);
    setActivePhase('listen');

    if (timerRef.current) clearInterval(timerRef.current);

    // Speak native tongue
    speakJapanese(activeStep.word.kana, voiceSpeed, () => {
      onSpeakCompleted();
    });

    // Animate audio timeline progress
    const characters = activeStep.word.kana.length;
    const estDuration = (characters * (voiceSpeed === 'slow' ? 250 : 150)) + 600;
    const tickerStart = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - tickerStart;
      const progress = Math.min(100, (elapsed / estDuration) * 100);
      setAudioProgress(progress);

      if (elapsed >= estDuration) {
        clearInterval(timerRef.current);
        onSpeakCompleted();
      }
    }, 20);
  };

  const skipRecallAndReveal = () => {
    if (studyMode === 'flow' && passiveRecallEnabled && !flowRevealed) {
      if (shadowTimerRef.current) clearInterval(shadowTimerRef.current);
      setFlowRevealed(true);
      startSpeechAndAutoAdvance();
    }
  };

  useEffect(() => {
    if (!isStarted || !activeStep) return;

    // Reset step specifics
    setAnswerRevealed(false);
    setSelectedChoice(null);
    setIsSuccessFeedback(null);
    setAudioProgress(0);
    setActivePhase('listen');
    setShadowCountdown(shadowTimeSec);
    setIsAudioPlaying(false);
    wordStartRef.current = Date.now();

    // Clean active intervals/timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (shadowTimerRef.current) clearInterval(shadowTimerRef.current);

    if (studyMode === 'flow' && passiveRecallEnabled) {
      setFlowRevealed(false);
      setRecallCountdown(recallPauseSec);

      let count = recallPauseSec * 10;
      shadowTimerRef.current = setInterval(() => {
        count--;
        setRecallCountdown(Number((count / 10).toFixed(1)));
        if (count <= 0) {
          clearInterval(shadowTimerRef.current);
          setFlowRevealed(true);
          startSpeechAndAutoAdvance();
        }
      }, 100);
    } else {
      setFlowRevealed(true);
      startSpeechAndAutoAdvance();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (shadowTimerRef.current) clearInterval(shadowTimerRef.current);
    };
  }, [currentIndex, isStarted, steps, studyMode, passiveRecallEnabled, recallPauseSec]);

  const onSpeakCompleted = () => {
    setIsAudioPlaying(false);
    setAudioProgress(100);
    
    if (studyMode === 'flow') {
      if (shadowingEnabled) {
        setActivePhase('shadow');
        startShadowingTimer();
      } else {
        setActivePhase('listen');
        startPassivePauseTimer();
      }
    }
  };

  const startPassivePauseTimer = () => {
    if (shadowTimerRef.current) clearInterval(shadowTimerRef.current);
    let count = 12; // 1.2 seconds of passive pause so the user has time to view/absorb the word meaning comfortably before auto-advance
    shadowTimerRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(shadowTimerRef.current);
        if (isPlay) {
          handleNextStep();
        }
      }
    }, 100);
  };

  const startShadowingTimer = () => {
    if (shadowTimerRef.current) clearInterval(shadowTimerRef.current);
    setShadowCountdown(shadowTimeSec);
    let count = shadowTimeSec * 10; // tenth parts of absolute play

    shadowTimerRef.current = setInterval(() => {
      count--;
      setShadowCountdown(Number((count / 10).toFixed(1)));
      
      if (count <= 0) {
        clearInterval(shadowTimerRef.current);
        if (isPlay) {
          // Zero interaction auto-advance!
          handleNextStep();
        }
      }
    }, 100);
  };

  // Keyboard Navigation Controls for lightning-fast active retrieval
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted || isSessionComplete || !activeStep) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (studyMode === 'flow') {
          setIsPlay(prev => !prev);
        } else if (activeStep.type === 'flashcard_recall' && !answerRevealed) {
          trigRevealAnswer();
        }
      }

      if (studyMode === 'challenge') {
        if (activeStep.type === 'multiple_choice' && !selectedChoice) {
          if (e.key === '1') submitChoice(activeStep.choices?.[0] || '');
          if (e.key === '2') submitChoice(activeStep.choices?.[1] || '');
          if (e.key === '3') submitChoice(activeStep.choices?.[2] || '');
        } else if (activeStep.type === 'flashcard_recall' && answerRevealed) {
          if (e.key === '1') submitActiveRecall(false);
          if (e.key === '2') submitActiveRecall(true);
        } else if (activeStep.type === 'audio_recall') {
          if (!answerRevealed && (e.code === 'Space' || e.code === 'Enter')) {
            trigRevealAnswer();
          } else if (answerRevealed) {
            if (e.key === '1') submitActiveRecall(false);
            if (e.key === '2') submitActiveRecall(true);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStarted, currentIndex, steps, answerRevealed, selectedChoice, isPlay, studyMode]);

  const speakSoundDirectly = () => {
    speakJapanese(activeStep.word.kana, voiceSpeed);
  };

  const trigRevealAnswer = () => {
    setAnswerRevealed(true);
    speakSoundDirectly();
  };

  // Submit Spaced Repetition Record
  const submitActiveRecall = (correct: boolean) => {
    if (isSuccessFeedback !== null) return;
    setIsSuccessFeedback(correct);
    const duration = Date.now() - wordStartRef.current;
    
    recordRecallResult(activeStep.word.id, correct, duration, 0, 1);

    if (!correct && !failedIds.includes(activeStep.word.id)) {
      setFailedIds(prev => [...prev, activeStep.word.id]);
    }

    // Auto-advance after short feedback wait
    setTimeout(() => {
      handleNextStep();
    }, 1200);
  };

  const submitChoice = (choice: string) => {
    if (selectedChoice) return;
    setSelectedChoice(choice);
    const correct = choice === activeStep.word.meaning;
    setIsSuccessFeedback(correct);
    const duration = Date.now() - wordStartRef.current;

    recordRecallResult(activeStep.word.id, correct, duration, 0, 1);

    if (!correct && !failedIds.includes(activeStep.word.id)) {
      setFailedIds(prev => [...prev, activeStep.word.id]);
    }

    // Auto advance on selection
    setTimeout(() => {
      handleNextStep();
    }, correct ? 1100 : 2200); // More time to view correction on failure
  };

  const handleNextStep = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Loopback failures to achieve 100% Session Recall Perfection
      if (failedIds.length > 0) {
        const extra: StreamStep[] = failedIds.map((id, idx) => ({
          id: `extra-reinforce-${id}-${idx}`,
          type: 'flashcard_recall',
          word: VOCABULARY_DATA.find(w => w.id === id)!
        }));
        setFailedIds([]);
        setSteps(prev => [...prev, ...extra]);
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsSessionComplete(true);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const resetAllProgressData = () => {
    if (window.confirm("Bạn có chắc chắn muốn đặt lại ký ức của nhóm từ này để rèn luyện lại từ đầu?")) {
      resetClusterProgress(clusterVocabs.map(v => v.id));
      const lessonId = clusterVocabs[0]?.lessonId || 'lesson_1';
      clearStreamStepIndex(lessonId);
      setCurrentIndex(0);
      setSteps([]);
      setIsStarted(false);
    }
  };

  // Design Waveform Bars
  const waveformHeights = [14, 28, 42, 24, 32, 48, 36, 44, 20, 32, 40, 18];

  // Mobile Swipe Gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const firstTouch = e.touches[0];
    touchStartX.current = firstTouch.clientX;
    touchStartY.current = firstTouch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const firstTouch = e.changedTouches[0];
    const diffX = firstTouch.clientX - touchStartX.current;
    const diffY = firstTouch.clientY - touchStartY.current;

    const minSwipeDistance = 50;

    if (Math.abs(diffX) > minSwipeDistance && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe Left -> Next word
        handleNextStep();
      } else {
        // Swipe Right -> Previous word
        handlePrevStep();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // --- RENDER SCREEN VIEWS ---
  if (!isStarted) {
    return (
      <div id="learning-setup" className="w-full max-w-xl mx-auto bg-stone-50 dark:bg-stone-900/40 border border-[#E5E1DA] dark:border-stone-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl animate-fadeIn select-none">
        <div className="space-y-2 text-center">
          <div className="inline-flex p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] rounded-2.5xl border border-[#E5E1DA]">
            <Brain size={32} className="animate-pulse" />
          </div>
          <h1 className="text-xl md:text-2xl font-serif italic font-bold tracking-tight text-[#1A1A1A] dark:text-stone-50 leading-tight">
            Thiết lập Sơ đồ Thần Kinh
          </h1>
          <p className="text-stone-600 dark:text-stone-400 text-xs font-sans max-w-sm mx-auto">
            Học phần: <span className="font-bold underline">{clusterTitle}</span> ({clusterVocabs.length} từ vựng vĩnh cửu)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            id="btn-choose-flow-mode"
            onClick={() => triggerStartSession('flow')}
            className={`p-5 rounded-2.5xl border flex flex-col items-center gap-3 text-center transition-all cursor-pointer bg-white dark:bg-stone-950 hover:border-[#4F46E5] ${
              studyMode === 'flow' ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/15' : 'border-[#E5E1DA]'
            }`}
          >
            <span className="p-2.5 bg-indigo-50/50 rounded-xl text-indigo-650 shrink-0">
              <Sparkles size={22} />
            </span>
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#1A1A1A] dark:text-stone-100 uppercase tracking-widest font-mono block">💫 Chế độ Flow</span>
              <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                Tiếp thu thụ động hoàn hảo. Âm thanh tự chạy, hình ảnh hiện dần, nhại nói (shadowing) và tự chuyển từ. Zero click friction.
              </p>
            </div>
          </button>

          <button
            id="btn-choose-challenge-mode"
            onClick={() => triggerStartSession('challenge')}
            className={`p-5 rounded-2.5xl border flex flex-col items-center gap-3 text-center transition-all cursor-pointer bg-white dark:bg-stone-950 hover:border-emerald-500 ${
              studyMode === 'challenge' ? 'border-emerald-500 ring-2 ring-emerald-500/15' : 'border-[#E5E1DA]'
            }`}
          >
            <span className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
              <Zap size={22} />
            </span>
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#1A1A1A] dark:text-stone-100 uppercase tracking-widest font-mono block">⚡ Chế độ Thách Thức</span>
              <p className="text-[10px] text-stone-600 dark:text-stone-400 leading-relaxed font-sans">
                Sát hạch trí lực phản xạ nhanh. Trắc nghiệm kết hợp đảo thẻ nhớ, in nơ-ron sâu dứt điểm. Tốc độ phím tắt siêu tốc.
              </p>
            </div>
          </button>
        </div>

        {/* Dynamic Config Controls */}
        <div className="p-4 bg-white dark:bg-stone-950/60 rounded-2xl border border-[#E5E1DA] space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#1A1A1A] dark:text-stone-200 font-mono">🐢 Tốc độ giọng đọc:</span>
            <div className="flex gap-2 font-mono">
              <button onClick={() => setVoiceSpeed('normal')} className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold ${voiceSpeed === 'normal' ? 'bg-[#4F46E5] text-white' : 'bg-stone-100 text-stone-500'}`}>🚀 Thường</button>
              <button onClick={() => setVoiceSpeed('slow')} className={`px-2 py-1 rounded-lg text-[10px] uppercase font-bold ${voiceSpeed === 'slow' ? 'bg-[#4F46E5] text-white' : 'bg-stone-100 text-stone-500'}`}>🐌 Chậm</button>
            </div>
          </div>

          <div className="border-t border-[#E5E1DA]/55 dark:border-stone-850/50 pt-3 flex flex-col gap-2.5">
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-stone-700 dark:text-stone-300">Tích hợp nơ-ron đã học (Weave old words)</span>
              <input type="checkbox" checked={weaveOld} onChange={e => setWeaveOld(e.target.checked)} className="rounded text-[#4F46E5] w-4 h-4" />
            </label>
            <label className="flex items-center justify-between text-xs cursor-pointer">
              <span className="font-medium text-stone-700 dark:text-stone-300">Vòng lặp nơ-ron đệ quy (Recursive expansion)</span>
              <input type="checkbox" checked={recursiveLoop} onChange={e => setRecursiveLoop(e.target.checked)} className="rounded text-[#4F46E5] w-4 h-4" />
            </label>
          </div>

          {studyMode === 'flow' && (
            <div className="border-t border-[#E5E1DA]/55 dark:border-stone-850/50 pt-3 space-y-3">
              {/* Shadowing Control */}
              <label id="toggle-shadowing-wrapper" className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="font-medium text-stone-700 dark:text-stone-300">Kích hoạt Shadowing (nhại nói)</span>
                <div id="toggle-shadowing" className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={shadowingEnabled}
                    onChange={e => setShadowingEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 dark:bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5] transition-colors"></div>
                </div>
              </label>

              {shadowingEnabled && (
                <div className="flex items-center justify-between text-xs animate-fadeIn pl-4 border-l-2 border-[#E5E1DA] dark:border-stone-800">
                  <span className="text-stone-600 dark:text-stone-400">Khoảng thời gian shadowing:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-stone-950 dark:text-stone-100">
                    <input type="range" min={1} max={5} value={shadowTimeSec} onChange={e => setShadowTimeSec(Number(e.target.value))} className="w-24 accent-[#4F46E5]" />
                    <span>{shadowTimeSec} Giây</span>
                  </div>
                </div>
              )}

              {/* Passive Recall Layer Control */}
              <div className="border-t border-stone-200/50 dark:border-stone-850/40 my-1 pt-2"></div>

              <label id="toggle-passive-recall-wrapper" className="flex items-center justify-between text-xs cursor-pointer select-none">
                <div className="space-y-0.5">
                  <span className="font-medium text-stone-700 dark:text-stone-300 block">Lớp Gợi nhớ Thụ động (Passive Recall)</span>
                  <span className="text-[10px] text-stone-500 block">Hiện nghĩa trước, ẩn chữ Nhật để nhẩm nghĩ trước</span>
                </div>
                <div id="toggle-passive-recall" className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={passiveRecallEnabled}
                    onChange={e => setPassiveRecallEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 dark:bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F46E5] transition-colors"></div>
                </div>
              </label>

              {passiveRecallEnabled && (
                <div className="flex items-center justify-between text-xs animate-fadeIn pl-4 border-l-2 border-[#E5E1DA] dark:border-stone-800">
                  <span className="text-stone-600 dark:text-stone-400">Khoảng dừng nhẩm nghĩ:</span>
                  <div className="flex items-center gap-2 font-mono font-bold text-stone-950 dark:text-stone-100">
                    <input type="range" min={1} max={5} value={recallPauseSec} onChange={e => setRecallPauseSec(Number(e.target.value))} className="w-24 accent-[#4F46E5]" />
                    <span>{recallPauseSec} Giây</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-2 flex gap-3">
          <button onClick={onBackToDashboard} className="flex-1 py-3 px-6 rounded-2.5xl border border-stone-200 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 text-xs font-mono tracking-wider cursor-pointer transition-colors text-center">
            ◀ Back
          </button>
          <button
            id="btn-launch-neural-stream"
            onClick={() => triggerStartSession(studyMode)}
            className="flex-3 py-3 px-6 rounded-2.5xl bg-[#4F46E5] text-white font-bold text-xs tracking-wider cursor-pointer hover:bg-indigo-650 shadow-md flex items-center justify-center gap-2"
          >
            Run <Play size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (isSessionComplete) {
    return (
      <div className="w-full max-w-lg mx-auto bg-stone-50 dark:bg-stone-900 border border-[#E5E1DA] rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-2xl select-none animate-fadeIn">
        <div className="inline-block p-4 rounded-full bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-250 text-emerald-600 dark:text-emerald-400">
          <Check size={42} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-serif italic text-black dark:text-stone-100">Ký Ức Đã Kết Tinh Hoàn Toàn!</h1>
          <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
            Hợp chất hóa học đã liên kết chặt chẽ thùy nhớ. Bạn đã xuất sắc hoàn thành chặng học này ở chế độ <span className="underline font-bold font-mono">{studyMode.toUpperCase()}</span>.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-stone-950/50 rounded-2xl border border-[#E5E1DA] text-left grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-stone-600 block uppercase font-mono mb-0.5">Thời gian rèn luyện</span>
            <span className="text-sm font-extrabold font-mono text-[#4F46E5]">Hoàn tất khóa</span>
          </div>
          <div>
            <span className="text-[10px] text-stone-600 block uppercase font-mono mb-0.5">Độ bền phản xạ</span>
            <span className="text-sm font-extrabold font-mono text-emerald-600">Ổn định (100%)</span>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button onClick={() => setIsStarted(false)} className="flex-1 py-3 px-4 rounded-xl border border-stone-200 font-bold hover:bg-stone-100 dark:hover:bg-stone-850 text-stone-500 text-xs">
            Học Lại Lĩnh Vực
          </button>
          <button id="btn-complete-back-dashboard" onClick={onBackToDashboard} className="flex-2 py-3 px-4 rounded-xl bg-[#4F46E5] text-white font-bold text-xs">
            Quay Lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-lg mx-auto bg-stone-50 dark:bg-stone-900 border border-[#E5E1DA] rounded-3xl p-5 md:p-7 shadow-2xl transition-all select-none"
    >
      
      {/* Dynamic Header Metrics row */}
      <div className="flex items-center justify-between border-b border-[#E5E1DA] dark:border-stone-800 pb-3 mb-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button onClick={onBackToDashboard} className="flex items-center text-stone-500 hover:text-[#1A1A1A] dark:hover:text-stone-100 transition-colors cursor-pointer">
            <ArrowLeft size={14} className="mr-1" /> Thôi học
          </button>
          <span className="opacity-30">|</span>
          <button onClick={resetAllProgressData} className="text-red-650 hover:underline cursor-pointer flex items-center">
            <RotateCcw size={11} className="mr-1" /> reset ↺
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F5F2EF] dark:bg-stone-800 px-2.5 py-1 rounded-full text-[10px] font-bold text-stone-800 border border-[#E5E1DA] dark:border-stone-700">
          <span>{studyMode === 'flow' ? '💫 Flow' : '⚡ Recall'}</span>
          <span>•</span>
          <span>{currentIndex + 1}/{steps.length}</span>
        </div>
      </div>

      {/* Progressive Step Progress bar */}
      <div className="w-full bg-[#F5F2EF] dark:bg-stone-800 h-1.5 rounded-full overflow-hidden border border-[#E5E1DA] mb-4">
        <div className="bg-[#4F46E5] h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }} />
      </div>

      {/* CENTRAL LEARNED PORTION: AUDIO WAVEFORM & SOUND TIMELINE */}
      <div className="p-4 md:p-5 bg-white dark:bg-stone-950/70 border border-[#E5E1DA] dark:border-stone-850 rounded-2.5xl space-y-4 mb-4">
        
        {/* Dynamic Holographic Acoustic Waveform */}
        <div className="flex items-center justify-center gap-1 md:gap-1.5 h-12 bg-[#F9F7F5] dark:bg-stone-900/40 rounded-xl border border-[#E5E1DA]/45">
          {waveformHeights.map((h, idx) => (
            <motion.div
              key={idx}
              animate={{
                height: isAudioPlaying ? [h, h * 0.35, h * 1.35, h * 0.5, h] : 4
              }}
              transition={{
                repeat: Infinity,
                duration: isAudioPlaying ? 0.65 + (idx % 3) * 0.15 : 0,
                ease: "easeInOut"
              }}
              className={`w-1 rounded-full ${isAudioPlaying ? 'bg-[#4F46E5] opacity-90' : 'bg-stone-400/40 dark:bg-stone-700/60'}`}
            />
          ))}
        </div>


      </div>

      {activeStep.isWeaved && (
        <div className="text-center text-[10px] uppercase font-mono font-black tracking-widest text-[#4F46E5] bg-indigo-50/60 py-1.5 px-3 rounded-full border border-indigo-150 mb-3 animate-fadeIn">
          🔄 Đốt cháy nơ-ron: Gặp lại Từ Cũ!
        </div>
      )}

      {/* RENDER ACTIVE SCREEN BASED ON MODE AND STEP TYPE */}
      <AnimatePresence mode="wait">
        {studyMode === 'flow' ? (
          <motion.div
            key={`flow-${currentIndex}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4 py-1"
          >
            {/* Passive Recall UI container */}
            <div className="min-h-72.5 flex flex-col justify-between py-1">
              {/* Vietnamese Meaning (Crucial: Shown FIRST during recall!) */}
              <div className="space-y-2 max-w-sm mx-auto w-full transition-all duration-300">
                <div className="text-[10px] uppercase tracking-widest text-stone-500 font-mono font-bold text-center block">
                  Ý nghĩa tiếng Việt
                </div>
                <div 
                  className={`p-5 rounded-2.5xl transition-all duration-300 shadow-sm border text-center ${
                    !flowRevealed 
                      ? 'bg-indigo-50/50 dark:bg-indigo-950/15 border-[#4F46E5]/40 scale-102 ring-4 ring-[#4F46E5]/5' 
                      : 'bg-white dark:bg-stone-950/55 border-[#E5E1DA] dark:border-stone-880'
                  }`}
                >
                  <p className="text-xl font-bold font-serif italic text-stone-900 dark:text-stone-100 leading-normal">
                    "{activeStep.word.meaning}"
                  </p>
                  
                  {!flowRevealed && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-stone-600 dark:text-stone-400 font-medium font-mono"
                    >
                      <Brain size={12} className="text-[#4F46E5] animate-pulse" />
                      <span>Nhẩm nghĩ từ tiếng Nhật trong đầu...</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Central Relation Link Arrow when recall is occurring */}
              <div className="h-6 flex items-center justify-center my-0.5">
                {!flowRevealed ? (
                  <motion.div 
                    animate={{ y: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-[#4F46E5] dark:text-indigo-400 text-sm font-bold"
                  >
                    ↓
                  </motion.div>
                ) : (
                  <div className="text-stone-300 dark:text-stone-700 text-xs">✓</div>
                )}
              </div>

              {/* Japanese elements (Kana, Kanji, Romaji, VisualAnchor) */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {!flowRevealed ? (
                    <motion.button
                      key="recall-placeholder"
                      onClick={skipRecallAndReveal}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="w-full py-5 px-4 bg-stone-100/40 dark:bg-stone-900/40 border border-[#E5E1DA] dark:border-stone-800 rounded-2.5xl flex flex-col items-center justify-center gap-2 cursor-pointer group active:scale-98 transition-all hover:border-[#4F46E5]/40 animate-fadeIn"
                    >
                      <div className="flex justify-center mb-1">
                        {/* Shimmer visual anchor to maintain layout stability */}
                        <div className="w-14 h-14 bg-stone-200/50 dark:bg-stone-800/50 rounded-2xl animate-pulse flex items-center justify-center text-stone-450 dark:text-stone-600">
                          <Zap size={20} className="opacity-40" />
                        </div>
                      </div>
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-stone-500 group-hover:text-[#4F46E5] text-xs font-mono font-bold tracking-wider animate-pulse">
                          Chạm để hiện đáp án ngay 👁️
                        </span>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="japanese-reveal"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 100, damping: 15 }}
                      className="space-y-3 text-center"
                    >
                      <div className="flex justify-center">
                        <VisualAnchor iconName={activeStep.word.iconName} vocabId={activeStep.word.id} size="lg" />
                      </div>

                      <div className="space-y-1.5">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#1A1A1A] dark:text-stone-50 font-serif">
                          {activeStep.word.kana}
                        </h1>
                        {activeStep.word.kanji && (
                          <p className="text-sm text-stone-600 dark:text-stone-400 font-mono italic">
                            {activeStep.word.kanji}
                          </p>
                        )}
                        <span className="inline-block text-[10px] bg-[#F5F2EF] dark:bg-stone-800 px-2.5 py-0.5 rounded font-mono font-bold text-stone-705 dark:text-stone-300">
                          Romaji: {activeStep.word.romaji}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={`challenge-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-1"
          >
            {activeStep.type === 'multiple_choice' && (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-[10px] font-mono tracking-widest block font-bold text-[#4F46E5] uppercase">Nhận diện phản xạ Hiragana</span>
                  <div className="flex justify-center"><VisualAnchor iconName={activeStep.word.iconName} vocabId={activeStep.word.id} size="md" /></div>
                  <h2 className="text-4xl font-extrabold text-stone-900 dark:text-white font-sans">{activeStep.word.kana}</h2>
                </div>

                <div className="space-y-2 pt-2">
                  {activeStep.choices?.map((choice, i) => {
                    const isSelected = selectedChoice === choice;
                    const isCorrect = choice === activeStep.word.meaning;
                    
                    let style = "border-[#E5E1DA] hover:bg-[#F5F2EF] bg-white dark:bg-stone-950 text-stone-950";
                    if (selectedChoice) {
                      if (isCorrect) style = "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold";
                      else if (isSelected) style = "bg-red-50 border-red-300 text-red-700 font-bold";
                      else style = "opacity-45 border-stone-100 text-stone-400";
                    }

                    return (
                      <button
                        key={i}
                        id={`btn-choice-${i}`}
                        disabled={selectedChoice !== null}
                        onClick={() => submitChoice(choice)}
                        className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${style}`}
                      >
                        <span className="font-mono text-[9px] mr-2 bg-stone-100 dark:bg-stone-800 text-stone-500 rounded px-1.5 py-0.5">{i+1}</span>
                        {choice}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep.type === 'audio_recall' && (
              <div className="space-y-5 text-center">
                <span className="text-[10px] font-mono tracking-widest uppercase block text-indigo-650">Phục tùng Thính giác</span>
                
                <div className="flex justify-center">
                  <button onClick={speakSoundDirectly} className="p-6 rounded-full bg-indigo-50 border border-indigo-250 text-[#4F46E5] hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    <Volume2 size={38} className="animate-pulse" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-660 max-w-xs mx-auto italic">Nhấn để đối thoại âm bản xứ, dịch nghĩa trong đầu.</p>

                {answerRevealed ? (
                  <div className="p-4 bg-[#F9F7F5] border border-[#E5E1DA] rounded-2xl space-y-1.5 animate-slideUp">
                    <span className="text-[9px] uppercase font-mono block text-stone-605">Ý nghĩa đúng:</span>
                    <h3 className="text-lg font-serif italic font-bold">"{activeStep.word.meaning}"</h3>
                    <p className="text-xs text-[#4F46E5] font-mono font-bold">{activeStep.word.kana} ({activeStep.word.romaji})</p>
                  </div>
                ) : (
                  <button id="btn-reveal" onClick={trigRevealAnswer} className="w-full py-3 px-6 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 font-bold text-xs">
                    👁️ KIỂM CHỨNG TRÍ TUỆ (Reveal Card)
                  </button>
                )}

                {answerRevealed && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button onClick={() => submitActiveRecall(false)} className="py-2.5 px-4 rounded-xl bg-red-50 border border-red-250 text-red-700 font-bold text-xs hover:bg-red-100 flex items-center justify-center gap-1.5">
                      <X size={14} /> Chưa nhớ (1)
                    </button>
                    <button onClick={() => submitActiveRecall(true)} className="py-2.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-105 flex items-center justify-center gap-1.5">
                      <Check size={14} /> Đã thuộc (2)
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeStep.type === 'flashcard_recall' && (
              <div className="space-y-4 text-center">
                <span className="text-[10px] font-mono tracking-widest uppercase block text-[#4F46E5]">Đào bới nơ-ron: dịch Hiragana</span>
                <div className="flex justify-center"><VisualAnchor iconName={activeStep.word.iconName} vocabId={activeStep.word.id} size="md" /></div>

                <div className="py-3 bg-stone-102 border border-[#E5E1DA] rounded-2xl">
                  <span className="text-[9px] uppercase font-mono tracking-wider block text-stone-650">Nghĩa là</span>
                  <h3 className="text-xl font-bold font-serif italic">"{activeStep.word.meaning}"</h3>
                </div>

                {answerRevealed ? (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-250 rounded-2xl space-y-1 animate-slideUp">
                    <h2 className="text-3xl font-black text-emerald-800 tracking-wide font-sans">{activeStep.word.kana}</h2>
                    <p className="text-[10px] text-stone-500 font-mono italic">{activeStep.word.kanji ? `${activeStep.word.kanji} • ` : ''}{activeStep.word.romaji}</p>
                  </div>
                ) : (
                  <button onClick={trigRevealAnswer} className="w-full py-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-805 font-black rounded-xl text-xs cursor-pointer shadow-xs">
                    👁️ TRỰC GIÁC KHÁM PHÁ (Phím Space)
                  </button>
                )}

                {answerRevealed && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button onClick={() => submitActiveRecall(false)} className="py-2.5 px-3 rounded-xl bg-red-50 border border-red-250 text-red-700 font-bold text-xs">
                      😓 Chưa nhớ (1)
                    </button>
                    <button onClick={() => submitActiveRecall(true)} className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-700 font-bold text-xs">
                      ✅ Nhớ tốt (2)
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK FLOATING CONTROL BAR */}
      <div className="border-t border-[#E5E1DA] dark:border-stone-850 mt-5 pt-4 flex items-center justify-between gap-2.5">
        <div className="flex gap-1.5 focus:outline-none">
          <button onClick={handlePrevStep} disabled={currentIndex === 0} className="p-2 bg-stone-105 border border-[#E5E1DA] rounded-xl hover:bg-[#E5E1DA]/55 cursor-pointer disabled:opacity-30">
            <SkipBack size={14} />
          </button>
          
          {studyMode === 'flow' && (
            <button id="btn-pause-flow" onClick={() => setIsPlay(!isPlay)} className="p-2 border border-[#E5E1DA] rounded-xl bg-[#F5F2EF] text-[#4F46E5] hover:bg-stone-200 cursor-pointer">
              {isPlay ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}

          <button onClick={handleNextStep} className="p-2 bg-stone-105 border border-[#E5E1DA] rounded-xl hover:bg-[#E5E1DA]/55 cursor-pointer">
            <SkipForward size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          <span className="text-[10px] text-stone-605 font-mono italic sm:inline flex items-center">
            {isSuccessFeedback !== null ? (isSuccessFeedback ? '🎯 Ghi nhận' : '⚠️ Lỗi') : ''}
          </span>
          <button onClick={speakSoundDirectly} className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-[#4F46E5] text-xs font-mono font-semibold cursor-pointer">
            🔊 Nghe 
          </button>
        </div>
      </div>

      {/* Mobile Swipe Navigation Hint */}
      <div className="text-center mt-3 block sm:hidden">
        <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono tracking-wide">
          💡 Trượt sang trái / phải để chuyển từ nhanh
        </span>
      </div>
    </div>
  );
}
