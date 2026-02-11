"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { motion } from "framer-motion";
import Link from 'next/link';
import { ArrowLeft, Activity, Trophy, Flame, Zap } from "lucide-react";
import { useMemo } from "react";

export default function StatsPage() {
    const sessions = useLiveQuery(() => db.sessions.toArray());

    const stats = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;

        const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
        const totalWords = sessions.reduce((acc, s) => acc + s.wordsRead, 0);
        const avgWpm = Math.round(sessions.reduce((acc, s) => acc + s.averageWpm, 0) / sessions.length);

        // Streak Calc (Naive)
        const dates = sessions.map(s => new Date(s.startTime).toDateString());
        const uniqueDates = new Set(dates);

        return {
            totalTime: (totalSeconds / 60).toFixed(1),
            totalWords,
            avgWpm,
            daysActive: uniqueDates.size
        };
    }, [sessions]);

    // Simple Graph Logic (Last 10 sessions WPM)
    const graphData = sessions?.slice(-10).map(s => s.averageWpm) || [];
    const maxGraph = Math.max(...graphData, 800);

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-redshift-red selection:text-white">
            <header className="mb-12">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-xs font-mono uppercase tracking-widest">Return to Neural Interface</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-redshift-red/20 rounded flex items-center justify-center border border-redshift-red/50">
                        <Activity className="w-6 h-6 text-redshift-red" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter">THE DOJO</h1>
                        <p className="text-[10px] text-redshift-red uppercase tracking-[0.3em] font-bold">Performance Analytics</p>
                    </div>
                </div>
            </header>

            {!stats ? (
                <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-xl">
                    <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No Combat Data Logged</p>
                    <Link href="/library" className="mt-4 text-redshift-red text-xs font-bold hover:underline">START TRAINING SESSION</Link>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Stat Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <StatCard icon={Zap} label="Neural Velocity" value={stats.avgWpm} unit="WPM" />
                        <StatCard icon={Flame} label="Total Volume" value={(stats.totalWords / 1000).toFixed(1)} unit="k WORDS" />
                        <StatCard icon={Activity} label="Time in Flow" value={stats.totalTime} unit="MINUTES" />
                        <StatCard icon={Trophy} label="Consistency" value={stats.daysActive} unit="DAYS LOGGED" />
                    </div>

                    {/* SVG Graph */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6">Recent Performance (Last 10 Sessions)</h3>
                        <div className="h-40 flex items-end justify-between gap-2">
                            {graphData.map((val, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                    <div
                                        className="w-full bg-redshift-red opacity-50 group-hover:opacity-100 transition-all rounded-t"
                                        style={{ height: `${(val / maxGraph) * 100}%` }}
                                    />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 text-xs font-mono bg-black px-2 py-1 rounded border border-white/20 opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                                        {val} WPM
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, unit }: any) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl hover:border-redshift-red/50 transition-colors shadow-lg"
        >
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{label}</span>
                <Icon className="w-4 h-4 text-redshift-red" />
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{value}</span>
                <span className="text-[10px] text-gray-400 font-bold">{unit}</span>
            </div>
        </motion.div>
    );
}
