import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Loader2, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { llm } from "@/lib/llm-service";

interface MentorModalProps {
    isOpen: boolean;
    onClose: () => void;
    contextText: string; // The text chunk to analyze
}

export function MentorModal({ isOpen, onClose, contextText }: MentorModalProps) {
    const [summary, setSummary] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && contextText) {
            setLoading(true);
            setSummary("");

            // Limit text context to avoid token limits (first 500 chars for now)
            const safeContext = contextText.slice(0, 1000);

            llm.summarize(safeContext).then(res => {
                setSummary(res);
                setLoading(false);
            });
        }
    }, [isOpen, contextText]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="relative z-10 w-full max-w-lg bg-black/90 border border-purple-500/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.2)]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-purple-900/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/20 rounded-lg">
                                    <Brain className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white tracking-tight">THE MENTOR</h3>
                                    <p className="text-[10px] text-purple-400 uppercase tracking-widest font-mono">Neural Analysis Node</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 min-h-[200px] flex items-center justify-center">
                            {loading ? (
                                <div className="flex flex-col items-center gap-4 animate-pulse">
                                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                                    <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Synthesizing Concepts...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <Lightbulb className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                                        <p className="text-lg leading-relaxed text-gray-200 font-medium">
                                            "{summary}"
                                        </p>
                                    </div>
                                    <div className="h-px w-full bg-white/10 my-4" />
                                    <p className="text-xs text-gray-500 font-mono text-center">
                                        GENERATED LOCALLY VIA FLAN-T5-78M
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
