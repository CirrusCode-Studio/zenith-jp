import type { MemoryState, UserStats } from "@zenith-jp/core";

// Pure IN-MEMORY SESSION STATE - bypasses any localStorage persistency
let inMemoryMemoryStates: Record<string, MemoryState> = {};

let inMemoryUserStats: UserStats = {
  totalWordsLearned: 0,
  masteredCount: 0,
  weakCount: 0,
  streakDays: 1,
  lastActiveDate: new Date().toDateString()
};

// In-memory step index storage for active lessons
let inMemoryStreamStepIndexes: Record<string, number> = {};

export function getMemoryStates(): Record<string, MemoryState> {
  return { ...inMemoryMemoryStates };
}

export function saveMemoryStates(states: Record<string, MemoryState>) {
  inMemoryMemoryStates = { ...states };
}

export function getUserStats(): UserStats {
  return { ...inMemoryUserStats };
}

export function saveUserStats(stats: UserStats) {
  inMemoryUserStats = { ...stats };
}

// Memory-based getters/setters for continuous step streaming
export function getSavedStreamStepIndex(lessonId: string): number | null {
  const index = inMemoryStreamStepIndexes[lessonId];
  return index !== undefined ? index : null;
}

export function saveStreamStepIndex(lessonId: string, index: number) {
  inMemoryStreamStepIndexes[lessonId] = index;
}

export function clearStreamStepIndex(lessonId: string) {
  delete inMemoryStreamStepIndexes[lessonId];
}

export function clearAllStreamStepIndexes() {
  inMemoryStreamStepIndexes = {};
}

// Spaced repetition interval steps: [10 mins, 1 day, 3 days, 7 days, 14 days, 30 days]
const INTERVAL_MINUTES = [10, 1440, 4320, 10080, 20160, 43200];

export function recordRecallResult(
  vocabId: string,
  success: boolean,
  reactionTimeMs: number,
  hintsUsed: number,
  replaysCount: number
): MemoryState {
  const currentStates = getMemoryStates();
  const existing = currentStates[vocabId] || {
    vocabId,
    memoryStrength: 0,
    recallSpeed: 0,
    replayCount: 0,
    hintUsageCount: 0,
    nextReviewAt: new Date().toISOString(),
    incorrectCount: 0,
    correctCount: 0,
    isWeak: false
  };

  // Update total counts
  if (success) {
    existing.correctCount += 1;
    // Step up memory strength if they didn't rely too heavily on full text hints
    if (hintsUsed <= 1) {
      existing.memoryStrength = Math.min(5, existing.memoryStrength + 1);
    } else {
      existing.memoryStrength = Math.max(1, existing.memoryStrength);
    }
  } else {
    existing.incorrectCount += 1;
    existing.memoryStrength = Math.max(1, existing.memoryStrength - 1);
  }

  // Update tracking details
  existing.replayCount += replaysCount;
  existing.hintUsageCount += hintsUsed;
  
  // High response delay or hint dependency defines a "weak" word
  const isSlowResponse = reactionTimeMs > 4500;
  const heavyHintDependency = hintsUsed >= 2;
  existing.isWeak = !success || isSlowResponse || heavyHintDependency;

  // Average review reaction speed
  if (existing.recallSpeed === 0) {
    existing.recallSpeed = reactionTimeMs / 1000;
  } else {
    existing.recallSpeed = (existing.recallSpeed * 0.7) + ((reactionTimeMs / 1000) * 0.3);
  }

  // Next review interval calculation
  const strengthIndex = Math.max(0, Math.min(INTERVAL_MINUTES.length - 1, existing.memoryStrength));
  const addMinutes = INTERVAL_MINUTES[strengthIndex];
  
  const nextDate = new Date();
  nextDate.setMinutes(nextDate.getMinutes() + addMinutes);
  existing.nextReviewAt = nextDate.toISOString();
  existing.lastReviewedAt = new Date().toISOString();

  currentStates[vocabId] = existing;
  saveMemoryStates(currentStates);

  // Recalculate stats
  updateGlobalStats();

  return existing;
}

export function updateGlobalStats() {
  const states = getMemoryStates();
  const stateValues = Object.values(states);
  
  const totalWordsLearned = stateValues.length;
  const masteredCount = stateValues.filter(s => s.memoryStrength >= 4).length;
  const weakCount = stateValues.filter(s => s.isWeak).length;

  const currentStats = getUserStats();
  
  // Streak calculation
  const todayStr = new Date().toDateString();
  let currentStreak = currentStats.streakDays;
  if (currentStats.lastActiveDate && currentStats.lastActiveDate !== todayStr) {
    const lastDate = new Date(currentStats.lastActiveDate);
    const diffTime = Math.abs(new Date(todayStr).getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  saveUserStats({
    totalWordsLearned,
    masteredCount,
    weakCount,
    streakDays: currentStreak || 1,
    lastActiveDate: todayStr
  });
}

export function resetAllProgress() {
  inMemoryMemoryStates = {};
  inMemoryUserStats = {
    totalWordsLearned: 0,
    masteredCount: 0,
    weakCount: 0,
    streakDays: 1,
    lastActiveDate: new Date().toDateString()
  };
  clearAllStreamStepIndexes();
}

export function resetClusterProgress(vocabIds: string[]) {
  const states = getMemoryStates();
  vocabIds.forEach(id => {
    delete states[id];
  });
  saveMemoryStates(states);
  updateGlobalStats();
}

// Returns list of weak words
export function getWeakVocabIds(): string[] {
  const states = getMemoryStates();
  return Object.values(states)
    .filter(s => s.isWeak)
    .map(s => s.vocabId);
}
