import { Flame, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { getGamificationStats, UserStats } from "@/lib/gamification";
import Link from 'next/link';

export function StreakHUD() {
    const [stats, setStats] = useState<UserStats | null>(null);

    useEffect(() => {
        getGamificationStats().then(setStats);
    }, []);

    if (!stats) return null;

    const progress = Math.min(100, (stats.todayMinutes / stats.dailyGoalMinutes) * 100);

    return (
        <Link href="/stats">
            <div className="flex items-center gap-4 px-4 py-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors cursor-pointer group">
                {/* Streak */}
                <div className="flex items-center gap-1.5">
                    <Flame className={`w-4 h-4 ${stats.currentStreak > 0 ? 'text-orange-500 fill-orange-500 animate-pulse' : 'text-gray-600'}`} />
                    <span className="text-xs font-bold font-mono text-white">
                        {stats.currentStreak} <span className="text-gray-500 text-[10px]">DAY STREAK</span>
                    </span>
                </div>

                <div className="w-px h-4 bg-white/10" />

                {/* Daily Goal */}
                <div className="flex items-center gap-2">
                    <div className="relative w-4 h-4">
                        <svg className="w-full h-full -rotate-90">
                            <circle cx="8" cy="8" r="7" className="stroke-white/10 fill-none" strokeWidth="2" />
                            <circle
                                cx="8" cy="8" r="7"
                                className="stroke-redshift-red fill-none transition-all duration-1000"
                                strokeWidth="2"
                                strokeDasharray="44"
                                strokeDashoffset={44 - (44 * progress) / 100}
                            />
                        </svg>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {stats.todayMinutes}/{stats.dailyGoalMinutes} MIN
                    </span>
                </div>
            </div>
        </Link>
    );
}
