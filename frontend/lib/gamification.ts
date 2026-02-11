import { db } from "./db";

export interface UserStats {
    currentStreak: number;
    bestStreak: number;
    todayMinutes: number;
    dailyGoalMinutes: number;
    totalWordsRead: number;
    level: number;
    currentXP: number;
    nextLevelXP: number;
    rank: string;
    progressToLevel: number; // 0-100
}

export const XP_PER_MINUTE = 10;
export const XP_PER_BOOK = 500;

const RANKS = [
    { level: 1, title: "Cognitive Initiate" },
    { level: 5, title: "Data Reader" },
    { level: 10, title: "Information Broker" },
    { level: 20, title: "Knowledge Seeker" },
    { level: 30, title: "Logic Weaver" },
    { level: 40, title: "Memory Architect" },
    { level: 50, title: "Synaptic Surfer" },
    { level: 60, title: "Neural Engineer" },
    { level: 75, title: "Cortex Commander" },
    { level: 90, title: "Quantified Mind" },
    { level: 100, title: "Singularity Architect" }
];

export async function getGamificationStats(): Promise<UserStats> {
    const sessions = await db.sessions.toArray();

    // 1. Calculate Daily Progress
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === today);
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // 2. Calculate Streaks (Existing Logic)
    const dates = Array.from(new Set(sessions.map(s => new Date(s.startTime).toDateString())))
        .map(d => new Date(d).getTime())
        .sort((a, b) => b - a);

    let currentStreak = 0;

    // Robust Iteration for Streak
    let ptrDate = new Date();
    ptrDate.setHours(0, 0, 0, 0);

    // Check Today
    const hasToday = dates.some(d => d >= ptrDate.getTime() && d < ptrDate.getTime() + 86400000);
    if (hasToday) currentStreak++;

    // Iterate backwards
    while (true) {
        ptrDate.setDate(ptrDate.getDate() - 1);
        const hasDay = dates.some(d => d >= ptrDate.getTime() && d < ptrDate.getTime() + 86400000);
        if (hasDay) {
            currentStreak++;
        } else {
            break;
        }
    }

    // 3. XP & Leveling Logic
    const totalWords = sessions.reduce((acc, s) => acc + s.wordsRead, 0);
    const totalTimeMinutes = sessions.reduce((acc, s) => acc + s.durationSeconds, 0) / 60;

    // XP Formula: (Words * 0.1) + (Minutes * 10) + (Streak * 50)
    // This rewards both volume and consistency
    const totalXP = Math.floor((totalWords * 0.1) + (totalTimeMinutes * 10) + (currentStreak * 50));

    // Level Curve: XP = Level^2 * 100 (Quadratic)
    // Level = Sqrt(XP / 100)
    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

    const currentBaseXP = Math.pow(level - 1, 2) * 100;
    const nextLevelXP = Math.pow(level, 2) * 100;
    const levelProgress = Math.min(100, Math.max(0, ((totalXP - currentBaseXP) / (nextLevelXP - currentBaseXP)) * 100));

    // Rank Logic
    const rank = RANKS.slice().reverse().find(r => level >= r.level)?.title || "Cognitive Initiate";

    return {
        currentStreak,
        bestStreak: currentStreak,
        todayMinutes: Math.round(todaySeconds / 60),
        dailyGoalMinutes: 15,
        totalWordsRead: totalWords,
        level,
        currentXP: totalXP,
        nextLevelXP,
        rank,
        progressToLevel: levelProgress
    };
}
