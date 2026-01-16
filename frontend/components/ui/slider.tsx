"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SliderProps = {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    valueDisplay?: string | number;
};

export function Slider({ value, min, max, step, onChange, label, valueDisplay }: SliderProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                {label && (
                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                        {label}
                    </label>
                )}
                {valueDisplay && (
                    <span className="text-redshift-red font-mono font-bold text-lg">
                        {valueDisplay}
                    </span>
                )}
            </div>
            <div className="relative h-6 flex items-center">
                {/* Track */}
                <div className="absolute w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-redshift-red transition-all duration-75"
                        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
                    />
                </div>
                {/* Thumb (Native Input Overlay) */}
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onChange}
                    className="absolute w-full h-full opacity-0 cursor-pointer"
                />
                {/* Custom Thumb Visual (optional, mostly rely on logic) */}
                <div
                    className="absolute h-4 w-4 bg-white rounded-full shadow-[0_0_10px_#FF3131] pointer-events-none transition-all duration-75"
                    style={{
                        left: `${((value - min) / (max - min)) * 100}%`,
                        transform: 'translateX(-50%)'
                    }}
                />
            </div>
        </div>
    );
}
