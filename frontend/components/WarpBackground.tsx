"use client";

import { useEffect, useRef } from "react";

type Star = {
    x: number;
    y: number;
    z: number;
    pz: number; // Previous Z (for trails)
};

export default function WarpBackground({ speed }: { speed: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const animationFrameRef = useRef<number>(0);

    useEffect(() => {
        // Initialize stars
        const stars: Star[] = new Array(800).fill(0).map(() => ({
            x: Math.random() * 2000 - 1000,
            y: Math.random() * 2000 - 1000,
            z: Math.random() * 2000,
            pz: 0, // Will settle in first frame
        }));
        starsRef.current = stars;
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let cx = 0;
        let cy = 0;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            cx = width / 2;
            cy = height / 2;
        };
        resize();
        window.addEventListener("resize", resize);

        // Animation Loop
        const render = () => {
            // Clear with trail effect if moving fast
            ctx.fillStyle = speed > 2 ? "rgba(0, 0, 0, 0.3)" : "black";
            ctx.fillRect(0, 0, width, height);

            // Base speed factor: 0.2 (idle) to 50 (warp)
            // If speed prop is 0 (idle), we want subtle movement not 0
            const warpFactor = speed > 0 ? speed * 2 : 0.05;

            starsRef.current.forEach((star) => {
                // Move star closer
                star.z -= 10 * warpFactor;

                // Reset if passed viewer
                if (star.z <= 1) {
                    star.x = Math.random() * 2000 - 1000;
                    star.y = Math.random() * 2000 - 1000;
                    star.z = 2000;
                    star.pz = 2000;
                }

                // Project 3D -> 2D
                const x = (star.x / star.z) * width + cx;
                const y = (star.y / star.z) * height + cy;

                // Calculate size based on depth
                const radius = (1 - star.z / 2000) * 1.5;

                // Logic for warping trails
                if (speed > 1) {
                    // Calculate previous position for line drawing
                    const px = (star.x / (star.z + 10 * warpFactor)) * width + cx;
                    const py = (star.y / (star.z + 10 * warpFactor)) * height + cy;

                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(x, y);

                    // Color Shift (Redshift!)
                    const red = Math.min(255, 150 + speed * 10);
                    ctx.strokeStyle = `rgb(${red}, ${255 - speed * 5}, ${255 - speed * 5})`;
                    ctx.lineWidth = radius;
                    ctx.stroke();
                } else {
                    // Simple Dot
                    ctx.beginPath();
                    ctx.fillStyle = "white";
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }

                star.pz = star.z;
            });

            animationFrameRef.current = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [speed]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
        />
    );
}
