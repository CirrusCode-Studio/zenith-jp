'use client';
import React, { useState, useEffect } from 'react';
import Dashboard from '../components/Dashboard';
import LearningRunner from '../components/LearningRunner';
import { VOCABULARY_CLUSTERS, VOCABULARY_DATA, LESSON_DATA } from '@zenith-jp/content';
import type { Vocab } from '@zenith-jp/core';
import { getMemoryStates, updateGlobalStats } from '../services/progress.service';
import Image from 'next/image';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Volume2, 
  BookMarked
} from 'lucide-react';

const Home = () => {
    const [activeSession, setActiveSession] = useState<{
        id: string; // cluster ID / 'due_reviews' / 'weak_reviews'
        title: string;
        vocabs: Vocab[];
    } | null>(null);

    const [activeLessonId, setActiveLessonId] = useState<string>('lesson_1');
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [demoVoiceWarmed, setDemoVoiceWarmed] = useState<boolean>(false);

    // Apply dark mode CSS classes dynamically
    useEffect(() => {
        if (darkMode) {
        document.documentElement.classList.add('dark');
        } else {
        document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Warmup WebSpeech synthesis
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        }
        // Update progress stats on boot
        updateGlobalStats();
    }, []);

    const handleStartCluster = (clusterId: string) => {
        if (clusterId === 'zenith_stream') {
        const lessonVocabs = VOCABULARY_DATA.filter(v => v.lessonId === activeLessonId);
        const lesson = LESSON_DATA.find(l => l.id === activeLessonId);
        setActiveSession({
            id: 'zenith_stream',
            title: `BÀI HỌC DÀNH CHO BẠN (ZENITH MASTER ${lesson?.title.toUpperCase() || 'LESSON'})`,
            vocabs: lessonVocabs
        });
        } else if (clusterId === 'due_reviews') {
        // Find all due vocabularies
        const states = getMemoryStates();
        const now = new Date();
        const dueIds = Object.keys(states).filter(id => {
            const m = states[id];
            return m && new Date(m.nextReviewAt) <= now;
        });

        if (dueIds.length === 0) {
            alert("Hiện không có từ vựng nào đến hạn ôn tập! Hãy tiếp tục học các nhóm từ mới.");
            return;
        }

        const dueVocabs = VOCABULARY_DATA.filter(v => dueIds.includes(v.id));
        setActiveSession({
            id: 'due_reviews',
            title: 'BÀI ÔN TẬP ĐẾN HẠN (SPACED DUE)',
            vocabs: dueVocabs
        });
        } else if (clusterId.startsWith('stage_')) {
        const idx = parseInt(clusterId.replace('stage_', ''), 10) - 1;
        const lessonClusters = VOCABULARY_CLUSTERS.filter(c => c.lessonId === activeLessonId);
        const cluster = lessonClusters[idx];
        if (!cluster) return;

        const clusterVocabs = VOCABULARY_DATA.filter(v => cluster.vocabIds.includes(v.id) && v.lessonId === activeLessonId);
        setActiveSession({
            id: clusterId,
            title: `CHẶNG ${idx + 1}: ${cluster.vietnameseTitle || cluster.title}`,
            vocabs: clusterVocabs
        });
        } else {
        const cluster = VOCABULARY_CLUSTERS.find(c => c.id === clusterId);
        if (!cluster) return;

        const clusterVocabs = VOCABULARY_DATA.filter(v => cluster.vocabIds.includes(v.id) && v.lessonId === activeLessonId);
        setActiveSession({
            id: clusterId,
            title: cluster.vietnameseTitle || cluster.title,
            vocabs: clusterVocabs
        });
        }
    };

    const handleStartWeakReview = () => {
        const states = getMemoryStates();
        const weakIds = Object.keys(states).filter(id => states[id]?.isWeak);

        if (weakIds.length === 0) {
        alert("Tuyệt vời! Hiện tại bạn không có từ vựng nào gặp khó khăn hay bị coi là yếu phản xạ.");
        return;
        }

        const weakVocabs = VOCABULARY_DATA.filter(v => weakIds.includes(v.id));
        setActiveSession({
        id: 'weak_reviews',
        title: 'LUYỆN TẬP TỪ PHẢN XẠ YẾU',
        vocabs: weakVocabs
        });
    };

    const handleBackToDashboard = () => {
        setActiveSession(null);
        updateGlobalStats();
    };

    return (
        <div className={`min-h-screen bg-[#FDFCFB] text-[#1A1A1A] dark:bg-stone-950 dark:text-stone-100 transition-colors duration-300 font-sans antialiased pb-12`}>
        
        {/* GLOBAL NAVBAR HEADER */}
        <header className="border-b border-[#E5E1DA] dark:border-stone-900 bg-[#FDFCFB]/80 dark:bg-stone-950/70 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
                {/* <div className="p-2 bg-[#4F46E5] rounded-xl text-white shadow-md shadow-indigo-500/10 flex items-center justify-center"> */}
                <Image
                    src="/apple-touch-icon.png"
                    alt="Zenith Japanese Logo"
                    width={36}
                    height={36}
                    className="w-8 h-8 rounded-md"
                />
                {/* </div> */}
                <div>
                <h1 className="text-sm font-black uppercase tracking-[0.15em] text-[#1A1A1A] dark:text-white flex items-center gap-1.5 font-sans leading-none">
                    ZENITH JAPANESE
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F5F2EF] dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-mono font-medium border border-[#E5E1DA] dark:border-stone-700">v1.1</span>
                </h1>
                <p className="text-[10px] text-stone-600 dark:text-stone-400 font-mono tracking-wider">Minna no Nihongo Vocabulary Engine</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Dark mode switcher */}
                <button
                id="theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/50 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
                title={darkMode ? "Bật Light Mode" : "Bật Dark Mode"}
                >
                {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
            </div>
            </div>
        </header>

        {/* CORE MOTIVATIONAL BANNER */}
        <main className="max-w-5xl mx-auto px-4 md:px-6 pt-8">
            {!activeSession ? (
            <div className="space-y-8">
                <div className="bg-[#F5F2EF] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 text-[#4F46E5]/10 pointer-events-none hidden md:block">
                    <BookMarked size={120} />
                </div>
                <div className="max-w-xl space-y-3 relative z-10">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-indigo-950/40 text-stone-800 dark:text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider border border-[#E5E1DA] dark:border-stone-800">
                    <Sparkles size={12} className="text-[#4F46E5]" /> Vòng lặp thu hồi tự nhiên (Recursive Recall)
                    </div>
                    <h2 className="text-2xl md:text-3.5xl font-serif italic text-[#1A1A1A] dark:text-stone-50 tracking-tight leading-normal">
                    Học từ vựng một lần, nhớ mãi mãi.
                    </h2>
                    <p className="text-stone-700 dark:text-stone-300 text-xs md:text-sm leading-relaxed max-w-lg font-medium">
                    Zenith loại bỏ hoàn toàn các màn kể chuyện rườm rà. Chúng tôi tập trung 100% vào chuỗi phản xạ âm thanh, tự sướng viết tay và chu kỳ Spaced Repetition thông minh để in từ vựng Minna no Nihongo vào vùng trí nhớ sâu của bạn.
                    </p>
                    
                    {/* Voice support warning indicator for modern browsers */}
                    {!demoVoiceWarmed && (
                    <div className="flex items-center gap-2 text-[11px] text-[#4F46E5] dark:text-amber-400 bg-white dark:bg-amber-950/20 px-3.5 py-2.5 rounded-xl border border-[#E5E1DA] dark:border-amber-500/10">
                        <Volume2 size={14} className="shrink-0 animate-bounce" />
                        <span>Hệ thống sử dụng giọng nói chuẩn bản xứ. Nhấp <button id="btn-demo-warm" className="font-bold underline hover:text-[#4F46E5]/80" onClick={() => { window.speechSynthesis?.getVoices(); setDemoVoiceWarmed(true); }}>Vào đây</button> để khởi động động cơ synth giọng tiếng Nhật trước khi học!</span>
                    </div>
                    )}
                </div>
                </div>

                {/* DASHBOARD PANEL */}
                <Dashboard 
                activeLessonId={activeLessonId}
                onChangeLesson={setActiveLessonId}
                onStartCluster={handleStartCluster}
                onTriggerWeakReview={handleStartWeakReview}
                />
            </div>
            ) : (
            <div className="space-y-4 animate-fadeIn">
                {/* SESSION CONTROLLER RUNNER */}
                <LearningRunner 
                clusterId={activeSession.id}
                clusterTitle={activeSession.title}
                clusterVocabs={activeSession.vocabs}
                onBackToDashboard={handleBackToDashboard}
                />
            </div>
            )}
        </main>

        {/* FOOTER */}
        <footer className="max-w-5xl mx-auto px-4 md:px-6 mt-16 text-center border-t border-stone-200/30 dark:border-stone-900 pt-8">
            <p className="text-[11px] text-stone-600 dark:text-stone-400 font-mono max-w-md mx-auto font-medium">
            Mô hình hoạt động dựa trên triết lý học tối giản Zenith: Sát thực tế, nói không với Slop, tối đa hóa thời gian phản xạ (Recall Speed).
            </p>
            <p className="text-[10px] text-stone-600 dark:text-stone-400 font-mono mt-4 font-semibold">
            © 2026 Zenith Japanese. Đã tối ưu cho tài liệu Minna no Nihongo Sơ cấp 1.
            </p>
        </footer>
        </div>
    );
}

export default Home;