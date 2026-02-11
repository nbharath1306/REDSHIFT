"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { IngestionService } from "@/lib/ingest";
import { useState, useRef } from "react";
import { Upload, Search, BookOpen, Plus, Loader2, Library as LibraryIcon } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { useRouter } from "next/navigation";
import { StreakHUD } from "@/components/StreakHUD";

export default function LibraryPage() {
    const router = useRouter();
    const books = useLiveQuery(() => db.books.toArray());
    const [isIngesting, setIsIngesting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const { search, results, isSearching } = useSemanticSearch();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsIngesting(true);
        try {
            await IngestionService.processBook(file, file.name.replace(/\.[^/.]+$/, ""), "Unknown Author");
        } catch (error) {
            console.error("Ingestion failed:", error);
            alert("Failed to ingest book.");
        } finally {
            setIsIngesting(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            search(searchQuery);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-redshift-red selection:text-white">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/" className="group">
                        <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center group-hover:bg-redshift-red transition-colors">
                            <LibraryIcon className="w-6 h-6 text-white" />
                        </div>
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tighter">THE VAULT</h1>
                        <p className="text-[10px] text-redshift-red uppercase tracking-[0.3em] font-bold">Local Knowledge Repository</p>
                    </div>
                </div>

                <div className="hidden md:block">
                    <StreakHUD />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-redshift-red hover:bg-red-600 text-black font-bold uppercase tracking-widest rounded transition-all shadow-[0_0_20px_rgba(255,49,49,0.3)] flex items-center gap-2"
                        disabled={isIngesting}
                    >
                        {isIngesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        {isIngesting ? "INGESTING..." : "ADD DATA"}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".txt,.pdf,.md"
                        onChange={handleFileUpload}
                    />
                </div>
            </header>

            {/* Semantic Search */}
            <div className="mb-12 relative max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-redshift-red/20 to-blue-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                    <input
                        type="text"
                        placeholder="QUERY NEURAL DATABASE (e.g., 'Concepts about Time')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-4 pl-12 pr-4 text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-redshift-red transition-all relative z-10"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                </form>

                {/* Search Results */}
                <AnimatePresence>
                    {(results.length > 0 || isSearching) && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-4 bg-black/90 border border-white/10 rounded-lg p-4 z-50 backdrop-blur-xl"
                        >
                            <h3 className="text-xs font-bold text-redshift-red uppercase tracking-widest mb-4">Neural Matches</h3>
                            {isSearching ? (
                                <div className="flex items-center gap-2 text-gray-500 font-mono text-xs">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Scanning Embeddings...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {results.map((res, i) => (
                                        <div key={i} className="p-3 bg-white/5 rounded border border-white/5 hover:border-redshift-red/30 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/?bookId=${res.node.sourceBookIds[0]}`)}
                                        >
                                            <p className="text-sm text-gray-300 line-clamp-2">"{res.node.snippet}"</p>
                                            <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase">
                                                <span>Match: {Math.round(res.score * 100)}%</span>
                                                <span className="text-redshift-red">JUMP TO SOURCE</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Book Grid */}
            {!books ? (
                <div className="text-center text-gray-500 font-mono animate-pulse">CONNECTING TO VAULT...</div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-lg">
                    <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-mono uppercase tracking-widest">Vault Empty</p>
                    <button onClick={() => fileInputRef.current?.click()} className="mt-4 text-redshift-red hover:underline text-sm">Initiate First Ingestion</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {books.map(book => (
                        <Link href={`/?bookId=${book.id}`} key={book.id}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden aspect-[3/4] flex flex-col hover:border-redshift-red/50 transition-all shadow-lg hover:shadow-[0_0_30px_rgba(255,49,49,0.1)]"
                            >
                                <div className="flex-1 p-6 flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
                                    {/* Cyberpunk Decorator */}
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                                    <div className="text-center z-10">
                                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-3 leading-tight">{book.title}</h3>
                                        <p className="text-xs text-gray-400 font-mono uppercase tracking-wide">{book.author}</p>
                                    </div>
                                </div>

                                <div className="p-4 bg-black/40 border-t border-white/10 flex justify-between items-center">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase">
                                        {(book.wordCount / 1000).toFixed(1)}k WORDS
                                    </span>
                                    <span className="text-[10px] font-bold text-redshift-red opacity-0 group-hover:opacity-100 transition-opacity">
                                        ACCESS DATA &rarr;
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
