export type MemoryState = {
    vocabId: string;
    memoryStrength: number; // 0 to 5 (0 = unlearned, 5 = mastered)
    recallSpeed: number; // in seconds, average response time
    replayCount: number; // number of times audio is replay-clicked
    hintUsageCount: number; // number of hints requested
    nextReviewAt: string; // ISO date string
    lastReviewedAt?: string;
    incorrectCount: number;
    correctCount: number;
    isWeak: boolean;
};