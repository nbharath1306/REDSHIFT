"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    valueDisplay?: string | number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
    ({ className, label, valueDisplay, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                <div className="flex justify-between text-xs uppercase tracking-widest text-gray-500 font-mono">
                    <span>{label}</span>
                    <span className="text-redshift-red">{valueDisplay}</span>
                </div>
                <input
                    type="range"
                    className={cn(
                        "w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-redshift-red hover:bg-gray-700 transition-colors focus:outline-none focus:ring-1 focus:ring-redshift-red",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
