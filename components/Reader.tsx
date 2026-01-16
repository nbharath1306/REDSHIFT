"use client";

import React from "react";

interface ReaderProps {
  word: string;
  prevWord?: string;
  nextWord?: string;
  settings: {
    fontSize: number;
    textColor: string;
    focalColor: string;
    shadowOpacity: number;
    bgColor: string; 
    guideAxis: 'none' | 'horizontal' | 'vertical' | 'crosshair';
    guideStyle: 'solid' | 'dashed' | 'dotted';
    guideColor: string;
    guideOpacity: number;
  };
}

export const Reader: React.FC<ReaderProps> = ({ word, prevWord, nextWord, settings }) => {
  if (!word) return <div style={{ height: `${settings.fontSize}rem` }} />;

  const len = word.length;
  const orpIndex = Math.floor(len * 0.35);

  const prefix = word.substring(0, orpIndex);
  const focal = word[orpIndex];
  const suffix = word.substring(orpIndex + 1);

  // We place shadow words *inside* the flex containers to strictly prevent overlap.
  // Left Container (Right Aligned): [ShadowPrev] [Spacer] [Prefix] -> |Focal|
  // Right Container (Left Aligned): |Focal| -> [Suffix] [Spacer] [ShadowNext]
  
  return (
    <div 
        className="relative flex items-center justify-center font-mono leading-none select-none w-full max-w-[100vw] overflow-hidden"
        style={{ fontSize: `${settings.fontSize}rem` }}
    >
      {/* Visual Guides */}
      {settings.guideAxis !== 'none' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {/* Vertical Center Line */}
          {(settings.guideAxis === 'vertical' || settings.guideAxis === 'crosshair') && (
            <div 
                className="absolute left-1/2 -translate-x-1/2 h-full w-px"
                style={{ 
                    borderLeft: `2px ${settings.guideStyle} ${settings.guideColor}`, 
                    opacity: settings.guideOpacity 
                }}
            />
          )}
          
          {/* Horizontal Lines (Top and Bottom of text approximately) */}
          {(settings.guideAxis === 'horizontal' || settings.guideAxis === 'crosshair') && (
             <>
                 {/* Top Line */}
                <div 
                    className="absolute left-0 w-full"
                    style={{ 
                        top: '15%', // Approximate top of cap height for most fonts
                        borderTop: `2px ${settings.guideStyle} ${settings.guideColor}`, 
                        opacity: settings.guideOpacity 
                    }}
                />
                 {/* Baseline */}
                 <div 
                    className="absolute left-0 w-full"
                    style={{ 
                        bottom: '20%', // Approximate baseline
                        borderBottom: `2px ${settings.guideStyle} ${settings.guideColor}`, 
                        opacity: settings.guideOpacity 
                    }}
                />
             </>
          )}
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex min-w-0 w-full items-baseline" aria-label={word}>
        {/* Left Side: Prefix + Prev Word */}
        <div 
            className="flex-1 text-right whitespace-nowrap"
            style={{ color: settings.textColor }}
        >
          {prevWord && settings.shadowOpacity > 0 && (
            <span 
                className="inline-block mr-[1ch]"
                style={{ opacity: settings.shadowOpacity }}
            >
                {prevWord}
            </span>
          )}
          <span>{prefix}</span>
        </div>

        {/* Focal Point */}
        <div 
            className="font-bold mx-0.5"
            style={{ color: settings.focalColor }}
        >
            {focal}
        </div>

        {/* Right Side: Suffix + Next Word */}
        <div 
            className="flex-1 text-left whitespace-nowrap"
            style={{ color: settings.textColor }}
        >
          <span>{suffix}</span>
          {nextWord && settings.shadowOpacity > 0 && (
            <span 
                className="inline-block ml-[1ch]"
                style={{ opacity: settings.shadowOpacity }}
            >
                {nextWord}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
