import { db } from "./db";

export interface UserStats {
    currentStreak: number;
    bestStreak: number;
    todayMinutes: number;
    dailyGoalMinutes: number;
    totalWordsRead: number;
    level: number;
}

export const XP_PER_MINUTE = 10;
export const XP_PER_BOOK = 500;

export async function getGamificationStats(): Promise<UserStats> {
    const sessions = await db.sessions.toArray();

    // 1. Calculate Daily Progress
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.startTime).toDateString() === today);
    const todaySeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);

    // 2. Calculate Streaks
    // Get all unique dates sorted descending
    const dates = Array.from(new Set(sessions.map(s => new Date(s.startTime).toDateString())))
        .map(d => new Date(d).getTime())
        .sort((a, b) => b - a);

    let currentStreak = 0;
    let streakDate = new Date();
    streakDate.setHours(0, 0, 0, 0); // Start with today (midnight)

    // Check if we have activity today
    const hasActivityToday = dates.some(d => new Date(d).toDateString() === new Date().toDateString());

    // If no activity today, check if we had activity yesterday to keep streak alive
    if (!hasActivityToday) {
        // If last activity was yesterday, streak is technically still active (pending today)
        // If last activity was > 1 day ago, streak is broken, but we start counting from 0
        // Logic: Iterate backwards from "Yesterday"
        streakDate.setDate(streakDate.getDate() - 1);
    }

    // Simple Streak Logic: Consecutive days found in 'dates'
    // This is a naive implementation; for robust streaks we need to iterate day by day backwards

    // Robust Iteration
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

    const totalWords = sessions.reduce((acc, s) => acc + s.wordsRead, 0);

    return {
        currentStreak,
        bestStreak: currentStreak, // TODO: Store best streak in localstorage or separate table
        todayMinutes: Math.round(todaySeconds / 60),
        dailyGoalMinutes: 15, // Configurable later
        totalWordsRead: totalWords,
        level: Math.floor(totalWords / 10000) + 1 // 1 level per 10k words
    };
}
