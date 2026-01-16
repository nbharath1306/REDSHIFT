"use client";

import React from "react";
import { Settings2, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export interface ReaderSettings {
    fontSize: number; // in rem
    guideAxis: 'none' | 'horizontal' | 'vertical' | 'crosshair';
    guideOpacity: number;
}

interface ReaderSettingsMenuProps {
    settings: ReaderSettings;
    onUpdate: (newSettings: ReaderSettings) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const ReaderSettingsMenu: React.FC<ReaderSettingsMenuProps> = ({
    settings,
    onUpdate,
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    const handleChange = (key: keyof ReaderSettings, value: string | number) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-black/90 border border-redshift-red/30 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_50px_rgba(255,49,49,0.2)] relative animate-in zoom-in-95 duration-200">

                {/* Scanline Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20 rounded-2xl" />

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-redshift-red transition-colors z-20"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2 relative z-10 tracking-widest">
                    <Settings2 size={24} className="text-redshift-red" />
                    CONFIG_PANEL
                </h2>

                <div className="space-y-8 relative z-10">

                    {/* Font Size Control */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-xs font-bold text-redshift-red uppercase tracking-widest">Text Magnitude</label>
                            <span className="text-xs font-mono text-gray-400">{settings.fontSize} REM</span>
                        </div>
                        <Slider
                            value={settings.fontSize}
                            onChange={(e: any) => handleChange("fontSize", parseFloat(e.target.value))}
                            min={2}
                            max={12}
                            step={0.5}
                            label="" // controlled above
                            valueDisplay={settings.fontSize}
                        />
                    </div>

                    {/* Guide Axis Control */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-redshift-red uppercase tracking-widest block">Reticle Mode</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['none', 'horizontal', 'vertical', 'crosshair'].map((axis) => (
                                <button
                                    key={axis}
                                    onClick={() => handleChange('guideAxis', axis as any)}
                                    className={`text-[10px] uppercase p-3 rounded font-bold tracking-widest transition-all ${settings.guideAxis === axis
                                            ? 'bg-redshift-red text-black shadow-[0_0_15px_rgba(255,49,49,0.6)]'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {axis}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
