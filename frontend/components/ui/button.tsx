"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
    size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-white text-black hover:bg-gray-200 border-transparent",
            secondary: "bg-gray-800 text-white hover:bg-gray-700 border-transparent",
            outline: "bg-transparent text-white border-gray-700 hover:border-white hover:bg-white/5",
            ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-white/5 border-transparent",
            destructive: "bg-redshift-red text-white hover:bg-red-600 border-transparent",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-16 px-10 text-base font-bold",
            icon: "h-10 w-10 p-2",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-sm border transition-all duration-200 uppercase tracking-widest font-mono disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-redshift-red focus:ring-offset-2 focus:ring-offset-black",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
