import React, { useState, useEffect } from 'react';
import { VOCABULARY_DATA } from '@zenith-jp/content';
import type { MemoryState, UserStats } from '@zenith-jp/core';
import { 
  getMemoryStates, 
  getUserStats, 
  updateGlobalStats
} from '../services/progress.service';
import { Sparkles } from 'lucide-react';

// Import newly refactored smaller modular subcomponents
import LessonSelector from './dashboard/LessonSelector';
import RoadmapBoxGrid from './dashboard/RoadmapBoxGrid';
import StatsCards from './dashboard/StatsCards';
import PracticeTabContent from './dashboard/PracticeTabContent';
import DictionaryTabContent from './dashboard/DictionaryTabContent';
import ReviewsTabContent from './dashboard/ReviewsTabContent';
import SandboxToolbar from './dashboard/SandboxToolbar';

interface DashboardProps {
  activeLessonId: string;
  onChangeLesson: (lessonId: string) => void;
  onStartCluster: (clusterId: string) => void;
  onTriggerWeakReview: () => void;
}

export default function Dashboard({ 
  activeLessonId, 
  onChangeLesson, 
  onStartCluster, 
  onTriggerWeakReview 
}: DashboardProps) {
  const [memoryStates, setMemoryStates] = useState<Record<string, MemoryState>>({});
  const [userStats, setUserStats] = useState<UserStats>({
    totalWordsLearned: 0,
    masteredCount: 0,
    weakCount: 0,
    streakDays: 1
  });

  const [activeTab, setActiveTab] = useState<'stream' | 'dictionary' | 'reviews'>('stream');
  const [notif, setNotif] = useState<string | null>(null);
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  // Load progress dynamically strictly in-memory
  const loadProgress = () => {
    updateGlobalStats();
    setMemoryStates(getMemoryStates());
    setUserStats(getUserStats());
  };

  useEffect(() => {
    loadProgress();
  }, [activeLessonId]);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  // Re-calculate live spaced reviews badge count of active lesson
  const currentLessonVocabs = VOCABULARY_DATA.filter(v => v.lessonId === activeLessonId);
  const now = new Date();
  const dueVocabIds = Object.keys(memoryStates).filter(id => {
    const m = memoryStates[id];
    const belongsToLesson = currentLessonVocabs.some(v => v.id === id);
    return belongsToLesson && m && new Date(m.nextReviewAt) <= now;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 border border-stone-800 text-stone-100 text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm animate-slideUp">
          <Sparkles size={14} className="text-amber-400 font-bold shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* 1. LESSON SELECTOR ROW WITH COMPACT CONTROL & CUSTOM ACCESSIBLE SEARCHABLE POPUP */}
      <LessonSelector
        activeLessonId={activeLessonId}
        onChangeLesson={onChangeLesson}
        showNotification={showNotification}
        roadmapOpen={roadmapOpen}
        setRoadmapOpen={setRoadmapOpen}
        memoryStates={memoryStates}
      />

      {/* 2. COLLAPSIBLE 25-LESSON FULL MIND PALACE SƠ ĐỒ ROADMAP GRID */}
      {roadmapOpen && (
        <RoadmapBoxGrid
          activeLessonId={activeLessonId}
          onChangeLesson={onChangeLesson}
          showNotification={showNotification}
          memoryStates={memoryStates}
        />
      )}

      {/* 3. DOCK STATS PROGRESS METRICS */}
      <StatsCards
        activeLessonId={activeLessonId}
        memoryStates={memoryStates}
        userStats={userStats}
      />

      {/* 4. ACTIVE VIEW SELECTION NAV TABS */}
      <div className="inline-flex p-1 bg-[#F5F2EF] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800/80 rounded-2xl w-full select-none">
        <button
          id="tab-stream"
          onClick={() => setActiveTab('stream')}
          className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer truncate px-2.5 ${
            activeTab === 'stream' 
              ? 'bg-white dark:bg-stone-800 text-[#1A1A1A] dark:text-stone-100 shadow-xs border border-[#E5E1DA] dark:border-stone-750' 
              : 'text-stone-750 hover:text-stone-950 dark:text-stone-450 dark:hover:text-stone-100'
          }`}
        >
          <span className="hidden sm:inline">✨ Dòng Chảy Trí Nhớ (Practice)</span>
          <span className="sm:hidden">✨ LUYỆN TẬP</span>
        </button>
        <button
          id="tab-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer truncate px-2.5 ${
            activeTab === 'dictionary' 
              ? 'bg-white dark:bg-stone-800 text-[#1A1A1A] dark:text-stone-100 shadow-xs border border-[#E5E1DA] dark:border-stone-750' 
              : 'text-stone-750 hover:text-stone-950 dark:text-stone-450 dark:hover:text-stone-100'
          }`}
        >
          <span className="hidden sm:inline">📖 Pocket Dictionary ({currentLessonVocabs.length})</span>
          <span className="sm:hidden">📖 TỪ ĐIỂN ({currentLessonVocabs.length})</span>
        </button>
        <button
          id="tab-reviews"
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 py-2 sm:py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer relative truncate px-2.5 ${
            activeTab === 'reviews' 
              ? 'bg-white dark:bg-stone-800 text-[#1A1A1A] dark:text-stone-100 shadow-xs border border-[#E5E1DA] dark:border-stone-750' 
              : 'text-stone-750 hover:text-stone-950 dark:text-stone-450 dark:hover:text-stone-100'
          }`}
        >
          <span className="hidden sm:inline">🔄 Spaced Reviews</span>
          <span className="sm:hidden">🔄 ÔN TẬP</span>
          {dueVocabIds.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-[#4F46E5] rounded-full text-[8.5px] sm:text-[10px] text-white flex items-center justify-center font-mono font-black scale-90 select-none">
              {dueVocabIds.length}
            </span>
          )}
        </button>
      </div>

      {/* 5. TAB VIEW CONTAINER RENDERING CHOSEN PORTION */}
      {activeTab === 'stream' && (
        <PracticeTabContent
          activeLessonId={activeLessonId}
          onStartCluster={onStartCluster}
          memoryStates={memoryStates}
          loadProgress={loadProgress}
          showNotification={showNotification}
        />
      )}

      {activeTab === 'dictionary' && (
        <DictionaryTabContent
          activeLessonId={activeLessonId}
          memoryStates={memoryStates}
        />
      )}

      {activeTab === 'reviews' && (
        <ReviewsTabContent
          activeLessonId={activeLessonId}
          memoryStates={memoryStates}
          onStartCluster={onStartCluster}
          onTriggerWeakReview={onTriggerWeakReview}
        />
      )}

      {/* 6. SYSTEM MVP SANDBOX INSTRUMENTATION PANEL */}
      <SandboxToolbar
        loadProgress={loadProgress}
        showNotification={showNotification}
      />
    </div>
  );
}
