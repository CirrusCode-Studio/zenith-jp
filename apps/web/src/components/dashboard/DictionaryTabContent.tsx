import React, { useState } from 'react';
import type { MemoryState } from '@zenith-jp/core';
import { speakJapanese } from '../../services/audio.service';
import VisualAnchor from '../VisualAnchor';
import { Volume2, Search } from 'lucide-react';
import { VOCABULARY_DATA } from '@zenith-jp/content';
interface DictionaryTabContentProps {
    activeLessonId: string;
    memoryStates: Record<string, MemoryState>;
}

export default function DictionaryTabContent({
    activeLessonId,
    memoryStates,
}: DictionaryTabContentProps) {
	const [searchText, setSearchText] = useState('');

	const currentLessonVocabs = VOCABULARY_DATA.filter((v) => v.lessonId === activeLessonId);

	const filteredVocab = currentLessonVocabs.filter((item) => {
		const text = searchText.toLowerCase().trim();
		if (text === '') return true;
		return (
		item.kana.toLowerCase().includes(text) ||
		item.meaning.toLowerCase().includes(text) ||
		item.romaji.toLowerCase().includes(text) ||
		(item.kanji && item.kanji.toLowerCase().includes(text))
		);
	});

	const handlePlaySound = (kanaText: string) => {
		speakJapanese(kanaText, 'normal');
	};

	return (
		<div className="space-y-4">
		<div className="flex flex-col md:flex-row gap-3">
			<div className="relative flex-1">
			<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-650 dark:text-stone-400" size={16} />
			<input
				id="search-input"
				type="text"
				placeholder="Tra từ bằng Hiragana, Kanji, Romaji, Ý nghĩa tiếng Việt..."
				value={searchText}
				onChange={(e) => setSearchText(e.target.value)}
				className="w-full pl-10 pr-4 py-3 bg-[#F9F7F5] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800/85 rounded-2xl text-xs text-[#1A1A1A] dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] placeholder-stone-400"
			/>
			</div>
		</div>

		<div className="flex items-center justify-between text-xs text-stone-700 dark:text-stone-300 px-1 font-medium select-none">
			<span>Tìm thấy {filteredVocab.length} trên {currentLessonVocabs.length} từ vựng</span>
			<span>Chỉ phát âm khi nhấp nút [🔊]</span>
		</div>

		<div className="space-y-2 max-h-125 overflow-y-auto pr-1">
			{filteredVocab.map((vocab) => {
			const memory = memoryStates[vocab.id];
			const strength = memory?.memoryStrength || 0;
			const isWeakLevel = memory?.isWeak;

			return (
				<div
				key={vocab.id}
				id={`vocab-row-${vocab.id}`}
				className="p-3 bg-[#F9F7F5] dark:bg-stone-900 border border-[#E5E1DA] dark:border-stone-800 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs hover:border-slate-400 transition-colors"
				>
				<div className="flex items-center gap-3">
					<VisualAnchor iconName={vocab.iconName} vocabId={vocab.id} size="sm" />
					<div className="space-y-0.5">
					<div className="flex items-center gap-1.5 flex-wrap">
						<span className="text-sm font-bold text-[#1A1A1A] dark:text-stone-100 font-sans">{vocab.kana}</span>
						{vocab.kanji && (
						<span className="text-[10px] text-stone-600 dark:text-stone-400 font-mono">({vocab.kanji})</span>
						)}
						<span className="text-[10px] bg-[#F5F2EF] dark:bg-stone-800 text-stone-700 dark:text-stone-300 px-1.5 py-0.2 rounded font-mono italic border border-[#E5E1DA] dark:border-stone-750 font-bold">
						{vocab.romaji}
						</span>
						{isWeakLevel && (
						<span className="text-[9px] bg-red-50 text-red-700 px-1 rounded font-bold border border-red-200 uppercase font-mono">
							Yếu
						</span>
						)}
					</div>
					<p className="text-[#1A1A1A] dark:text-stone-300 text-[11px] font-medium leading-relaxed font-sans">{vocab.meaning}</p>
					</div>
				</div>

				<div className="flex items-center gap-3 bg-transparent">
					<div className="hidden sm:flex flex-col items-end gap-1">
					<span className="text-[8px] uppercase tracking-wider text-stone-600 dark:text-stone-400 font-mono">Trí nhớ</span>
					<div className="flex gap-0.5">
						{[1, 2, 3, 4, 5].map((level) => (
						<span
							key={level}
							className={`w-1.5 h-3 rounded-sm ${
							level <= strength
								? 'bg-[#4F46E5]'
								: 'bg-stone-205 dark:bg-stone-805'
							}`}
						/>
						))}
					</div>
					</div>

					<button
					id={`btn-play-sound-${vocab.id}`}
					onClick={() => handlePlaySound(vocab.kana)}
					className="p-2.5 rounded-full bg-[#F5F2EF] dark:bg-indigo-950/40 text-[#4F46E5] hover:bg-[#E5E1DA] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-[#E5E1DA]"
					title="Phát giọng đọc"
					>
					<Volume2 size={15} />
					</button>
				</div>
				</div>
			);
			})}

			{filteredVocab.length === 0 && (
			<div className="py-8 text-center text-stone-400 text-xs">
				Không tìm thấy từ vựng nào khớp với từ khoá.
			</div>
			)}
		</div>
		</div>
	);
}
