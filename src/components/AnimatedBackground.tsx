import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

export const AnimatedBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDark, setIsDark] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 1. Mouse movement tracking for parallax offsets
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 2. Dynamic theme observer to adapt backgrounds, blobs, and particles
  useEffect(() => {
    const checkTheme = () => {
      const dark = document.documentElement.classList.contains("dark") || document.body.classList.contains("dark");
      setIsDark(dark);
    };
    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // 3. High-performance canvas particle network
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Handle resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Track mouse position for gravitational pull
    const realMouse = { x: -1000, y: -1000, active: false };
    const handleRealMouseMove = (e: MouseEvent) => {
      realMouse.x = e.clientX;
      realMouse.y = e.clientY;
      realMouse.active = true;
    };
    const handleMouseLeave = () => {
      realMouse.active = false;
    };

    // Click ripples
    interface Ripple {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
    }
    let ripples: Ripple[] = [];

    const handleCanvasClick = (e: MouseEvent) => {
      ripples.push({
        x: e.clientX,
        y: e.clientY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.25,
        alpha: 0.5,
      });
    };

    window.addEventListener("mousemove", handleRealMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("click", handleCanvasClick);

    // Generate particles
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseColor: string;
    }
    const particleCount = Math.min(55, Math.floor((width * height) / 22000));
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isDark ? 0.45 : 0.6), // Slightly faster in light mode for dynamic feel
        vy: (Math.random() - 0.5) * (isDark ? 0.45 : 0.6),
        size: isDark ? (Math.random() * 2 + 1) : (Math.random() * 3 + 1.5), // Larger in light mode for visibility
        baseColor: i % 2 === 0 ? "indigo" : "cyan",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw active ripples
      ripples = ripples.filter((r) => {
        r.radius += 3.5;
        r.alpha -= 0.008;
        if (r.alpha <= 0) return false;

        ctx.strokeStyle = isDark
          ? `rgba(99, 102, 241, ${r.alpha})`
          : `rgba(79, 70, 229, ${r.alpha * 0.85})`;
        ctx.lineWidth = isDark ? 1.5 : 2.5;
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.stroke();
        return true;
      });

      // Update and draw particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off bounds
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Attract to mouse cursor
        if (realMouse.active) {
          const dx = realMouse.x - p.x;
          const dy = realMouse.y - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 220) {
            const force = (220 - dist) / 220;
            p.x += (dx / dist) * force * (isDark ? 0.65 : 0.85);
            p.y += (dy / dist) * force * (isDark ? 0.65 : 0.85);
          }
        }

        // Color based on theme
        let pColor = "";
        if (isDark) {
          pColor = p.baseColor === "indigo" ? "rgba(99, 102, 241, 0.45)" : "rgba(34, 211, 238, 0.45)";
        } else {
          pColor = p.baseColor === "indigo" ? "rgba(79, 70, 229, 0.75)" : "rgba(6, 182, 212, 0.75)";
        }

        ctx.fillStyle = pColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting web lines (larger distance and higher visibility in light mode)
        const lineDist = isDark ? 110 : 135;
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p2.x - p.x, p2.y - p.y);
          if (dist < lineDist) {
            const alpha = ((lineDist - dist) / lineDist) * (isDark ? 0.09 : 0.22);
            ctx.strokeStyle = isDark
              ? `rgba(255, 255, 255, ${alpha})`
              : `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = isDark ? 0.5 : 0.75;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleRealMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("click", handleCanvasClick);
    };
  }, [isDark]);

  // Gentle parallax shifts for the organic blobs
  const blobXOffset1 = mousePos.x * 50;
  const blobYOffset1 = mousePos.y * 50;
  const blobXOffset2 = mousePos.x * -40;
  const blobYOffset2 = mousePos.y * -40;
  const blobXOffset3 = mousePos.x * 30;
  const blobYOffset3 = mousePos.y * -30;

  return (
    <div 
      id="app-live-background" 
      className="fixed inset-0 -z-50 overflow-hidden select-none pointer-events-none transition-colors duration-1000"
      style={{
        backgroundColor: isDark ? "#020204" : "#f1f5f9",
      }}
    >
      {/* 1. Cinematic gradient base (adapts dynamically to light/dark mode) */}
      <div 
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: isDark
            ? "radial-gradient(circle at 50% 50%, #000c24 0%, #000411 60%, #000000 100%)"
            : "radial-gradient(circle at 50% 50%, #f0fdf4 0%, #eff6ff 45%, #e0e7ff 80%, #fae8ff 100%)",
        }}
      />

      {/* 2. Fluid ambient mesh wrapper moving very slowly */}
      <motion.div 
        className="absolute inset-0 opacity-80"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "linear"
        }}
        style={{
          backgroundImage: isDark
            ? "linear-gradient(220deg, #000000, #000c24, #0f2a66, #000514, #1d4ed8, #000000, #00123c, #000000)"
            : "linear-gradient(220deg, #f8fafc, #dbeafe, #e0f2fe, #f1f5f9, #e0e7ff, #f3e8ff, #fae8ff, #f8fafc)",
          backgroundSize: "300% 300%",
        }}
      />

      {/* 3. Interactive Organic Fluid Blobs shifted gently by mouse coordinates */}
      <div className="absolute inset-0 filter blur-[80px] sm:blur-[110px] opacity-75 md:opacity-70">
        {/* Cobalt / Indigo Blue Fluid Mass */}
        <motion.div
          animate={{
            x: [blobXOffset1, blobXOffset1 + 70, blobXOffset1 - 80, blobXOffset1],
            y: [blobYOffset1, blobYOffset1 - 90, blobYOffset1 + 70, blobYOffset1],
            scale: [1, 1.2, 0.95, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute top-[5%] left-[5%] w-[400px] h-[400px] sm:w-[650px] sm:h-[650px] rounded-full transition-colors duration-1000 ${
            isDark ? "bg-blue-600/30" : "bg-indigo-400/30 border border-indigo-400/20"
          }`}
        />

        {/* Neon Cyan / Light Mint Fluid Mass */}
        <motion.div
          animate={{
            x: [blobXOffset2, blobXOffset2 - 90, blobXOffset2 + 100, blobXOffset2],
            y: [blobYOffset2, blobYOffset2 + 100, blobYOffset2 - 60, blobYOffset2],
            scale: [1, 0.95, 1.1, 1],
          }}
          transition={{
            duration: 32,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute bottom-[10%] right-[10%] w-[350px] h-[350px] sm:w-[600px] sm:h-[600px] rounded-full transition-colors duration-1000 ${
            isDark ? "bg-cyan-600/20" : "bg-cyan-400/25 border border-cyan-400/15"
          }`}
        />

        {/* Royal Blue / Warm Amber Fluid Mass */}
        <motion.div
          animate={{
            x: [blobXOffset3 - 30, blobXOffset3 + 40, blobXOffset3 - 25, blobXOffset3 - 30],
            y: [blobYOffset3 + 50, blobYOffset3 - 40, blobYOffset3 + 30, blobYOffset3 + 50],
            scale: [0.95, 1.05, 0.98, 0.95],
          }}
          transition={{
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute top-[35%] left-[30%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full transition-colors duration-1000 ${
            isDark ? "bg-indigo-700/20" : "bg-purple-400/25 border border-purple-400/15"
          }`}
        />
      </div>

      {/* 4. Canvas for high-performance interactive nodes & click ripples */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* 5. High-Fidelity Dot Matrix Overlay */}
      <div 
        className={`absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] transition-opacity duration-1000 ${
          isDark ? "opacity-[0.03]" : "opacity-[0.015]"
        }`}
        style={{
          maskImage: "radial-gradient(circle at 50% 50%, black 70%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, black 70%, transparent 100%)"
        }}
      />

      {/* 6. Live Organic Light Sweep Effect */}
      <motion.div
        id="live-scanline"
        className={`absolute left-0 right-0 h-[2px] pointer-events-none transition-colors duration-1000 ${
          isDark 
            ? "bg-gradient-to-r from-transparent via-cyan-400/20 via-blue-500/25 via-sky-400/20 to-transparent"
            : "bg-gradient-to-r from-transparent via-blue-400/10 via-indigo-400/15 via-purple-400/10 to-transparent"
        }`}
        animate={{
          top: ["-5%", "105%"]
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </div>
  );
};
