"use client";

import React from "react";
import { Settings2, X } from "lucide-react";

export interface AppSettings {
  fontSize: number; // in rem
  bgColor: string;
  textColor: string;
  focalColor: string;
  shadowOpacity: number;
  guideAxis: 'none' | 'horizontal' | 'vertical' | 'crosshair';
  guideStyle: 'solid' | 'dashed' | 'dotted';
  guideColor: string;
  guideOpacity: number;
}

interface SettingsMenuProps {
  settings: AppSettings;
  onUpdate: (newSettings: AppSettings) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  settings,
  onUpdate,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: string | number) => {
    onUpdate({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-mono font-bold text-white mb-6 flex items-center gap-2">
          <Settings2 size={24} /> Appearance
        </h2>

        <div className="space-y-6">
          {/* Visual Guides */}
          <div className="space-y-3 pb-6 border-b border-zinc-800">
            <label className="text-sm font-bold text-zinc-300 font-mono">Visual Guides</label>
            
            {/* Axis Selector */}
            <div className="grid grid-cols-4 gap-2">
               {['none', 'horizontal', 'vertical', 'crosshair'].map((axis) => (
                   <button
                        key={axis}
                        onClick={() => handleChange('guideAxis', axis)}
                        className={`text-xs p-2 rounded border font-mono capitalize ${settings.guideAxis === axis ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-200'}`}
                   >
                       {axis}
                   </button>
               ))}
            </div>

            {settings.guideAxis !== 'none' && (
                <>
                    {/* Style Selector */}
                    <div className="grid grid-cols-3 gap-2">
                    {['solid', 'dashed', 'dotted'].map((style) => (
                        <button
                                key={style}
                                onClick={() => handleChange('guideStyle', style)}
                                className={`text-xs p-2 rounded border font-mono capitalize ${settings.guideStyle === style ? 'bg-zinc-100 text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}
                        >
                            {style}
                        </button>
                    ))}
                    </div>
                    
                    {/* Opacity & Color */}
                    <div className="flex gap-4 items-center">
                        <input
                            type="range"
                            min="0.05"
                            max="1"
                            step="0.05"
                            value={settings.guideOpacity}
                            onChange={(e) => handleChange("guideOpacity", parseFloat(e.target.value))}
                            className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                        />
                         <input
                            type="color"
                            value={settings.guideColor}
                            onChange={(e) => handleChange("guideColor", e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer bg-transparent border border-zinc-700 p-1"
                        />
                    </div>
                </>
            )}
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
                <label>Font Size</label>
                <span>{settings.fontSize}rem</span>
            </div>
            <input
              type="range"
              min="2"
              max="10"
              step="0.5"
              value={settings.fontSize}
              onChange={(e) => handleChange("fontSize", parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Shadow Opacity */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
                <label>Shadow Word Opacity</label>
                <span>{Math.round(settings.shadowOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={settings.shadowOpacity}
              onChange={(e) => handleChange("shadowOpacity", parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-4">
             <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono text-center block">Background</label>
                <input
                    type="color"
                    value={settings.bgColor}
                    onChange={(e) => handleChange("bgColor", e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-transparent border border-zinc-700 p-1"
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono text-center block">Text</label>
                <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => handleChange("textColor", e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-transparent border border-zinc-700 p-1"
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs text-zinc-500 font-mono text-center block">Focal</label>
                <input
                    type="color"
                    value={settings.focalColor}
                    onChange={(e) => handleChange("focalColor", e.target.value)}
                    className="w-full h-10 rounded cursor-pointer bg-transparent border border-zinc-700 p-1"
                />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
