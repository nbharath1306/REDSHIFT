import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { sfx } from "@/lib/sounds";
import { Trophy, Star } from "lucide-react";

interface LevelUpModalProps {
    show: boolean;
    level: number;
    rank: string;
    onClose: () => void;
}

export function LevelUpModal({ show, level, rank, onClose }: LevelUpModalProps) {
    useEffect(() => {
        if (show) {
            sfx.playLevelUp();
        }
    }, [show]);

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, y: -20 }}
                        className="relative z-10 bg-black border-2 border-redshift-red rounded-2xl p-12 text-center max-w-sm w-full shadow-[0_0_50px_rgba(255,49,49,0.5)] overflow-hidden"
                    >
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,49,49,0.2)_0%,transparent_70%)] animate-pulse" />

                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <motion.div
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                                className="w-24 h-24 bg-redshift-red rounded-full flex items-center justify-center shadow-[0_0_30px_#FF3131]"
                            >
                                <Trophy className="w-12 h-12 text-black fill-black" />
                            </motion.div>

                            <div className="space-y-2">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-3xl font-black italic tracking-tighter text-white"
                                >
                                    LEVEL UP!
                                </motion.h2>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="text-6xl font-black text-redshift-red font-mono"
                                >
                                    {level}
                                </motion.div>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                    className="px-4 py-1 bg-white/10 rounded-full border border-white/20 inline-block"
                                >
                                    <span className="text-xs font-bold uppercase tracking-widest text-gray-300">{rank}</span>
                                </motion.div>
                            </div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 }}
                                onClick={onClose}
                                className="mt-4 text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest hover:underline"
                            >
                                [ Continue Evolution ]
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
