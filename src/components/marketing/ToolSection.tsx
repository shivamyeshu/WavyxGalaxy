"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToolSection() {
  const [activeTool, setActiveTool] = useState(1);

  const tools = [
    { name: "Crop", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563af147b5d7c2496ff_Crop%402x.avif" },
    { name: "Inpaint", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682245639e16941f61edcc06_Inpaint%402x.avif" },
    { name: "Upscale", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682245638e6550c59d0bce8f_Upscale%402x.avif" },
    { name: "Outpaint", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6822456436dd3ce4b39b6372_Outpaint%402x.avif" },
    { name: "Mask Extractor", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563d5cb54c747f189ae_Mask%402x.avif" },
    { name: "Relight", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563b4846eaa2d70f69e_Relight%402x.avif" },
    { name: "Invert", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563d93b3ce65b54f07b_Invert%402x.avif" },
    { name: "Image Describer", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/6825ab42a8f361a9518d5a7f_Image%20describer%402x.avif" },
    { name: "Channels", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682245646909d06ed8a17f4d_Channels%402x.avif" },
    { name: "Painter", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563d93b3ce65b54f07b_Invert%402x.avif" },
    { name: "Z Depth Extractor", image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68224563290cc77eba8f086a_z%20depth%402x.avif" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTool((prev) => (prev + 1) % tools.length);
    }, 600000);
    return () => clearInterval(timer);
  }, [tools.length]);

  // Precise scattered coordinates
  const leftButtons = [
    { index: 0, name: "Crop", top: "52%", left: "30%" },
    { index: 6, name: "Invert", top: "28%", left: "32%" },
    { index: 3, name: "Outpaint", top: "45%", left: "12%" },
    { index: 1, name: "Inpaint", top: "68%", left: "18%" },
    { index: 4, name: "Mask Extractor", top: "82%", left: "22%" },
    { index: 2, name: "Upscale", top: "98%", left: "15%" },
  ];

  const rightButtons = [
    { index: 9, name: "Painter", top: "22%", right: "12%" },
    { index: 8, name: "Channels", top: "35%", right: "22%" },
    { index: 7, name: "Image Describer", top: "52%", right: "15%" },
    { index: 5, name: "Relight", top: "72%", right: "10%" },
    { index: 10, name: "Z Depth Extractor", top: "80%", right: "20%" },
  ];

  return (
    <section 
      className="relative w-full min-h-[900px] bg-white flex flex-col items-center py-20 overflow-hidden"
      style={{
        backgroundImage: `radial-gradient(#e0e0e0 0.8px, transparent 0.8px)`,
        backgroundSize: '30px 30px'
      }}
    >
      {/* 1. Static Title Area */}
      <div className="text-center z-20 mb-8">
        <h2 className="text-4xl md:text-6xl font-medium tracking-tight text-black leading-tight">
          With all the professional <br /> tools you rely on
        </h2>
        <p className="text-gray-400 text-lg md:text-xl mt-4">
          In one seamless workflow
        </p>
      </div>

      {/* 2. Main Interactive Workspace */}
      <div className="relative w-full max-w-[1400px] h-[450px] flex items-center justify-center">
        
        {/* Left Side Buttons */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {leftButtons.map((btn) => (
            <button
              key={btn.index}
              onMouseEnter={() => setActiveTool(btn.index)}
              style={{ top: btn.top, left: btn.left, position: 'absolute' }}
              className={`pointer-events-auto px-6 py-2 rounded-2xl text-[14px] font-medium transition-all duration-300
                ${activeTool === btn.index 
                  ? "bg-white text-black shadow-xl ring-1 ring-black/5 scale-110 z-30" 
                  : "bg-white/40 text-gray-400 hover:text-black hover:bg-white z-10 shadow-sm"
                }`}
            >
              {btn.name}
            </button>
          ))}
        </div>

        {/* Center Large Image - Corrected Scaling */}
        <div className="relative w-full max-w-[950px] h-full flex items-center justify-center ">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeTool}
              src={tools[activeTool].image}
              alt={tools[activeTool].name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          </AnimatePresence>
        </div>

        {/* Right Side Buttons */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none">
          {rightButtons.map((btn) => (
            <button
              key={btn.index}
              onMouseEnter={() => setActiveTool(btn.index)}
              style={{ top: btn.top, right: btn.right, position: 'absolute' }}
              className={`pointer-events-auto px-6 py-2 rounded-2xl text-[14px] font-medium transition-all duration-300
                ${activeTool === btn.index 
                  ? "bg-white text-black shadow-xl ring-1 ring-black/5 scale-110 z-30" 
                  : "bg-white/40 text-gray-400 hover:text-black hover:bg-white z-10 shadow-sm"
                }`}
            >
              {btn.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Grid */}
      <div className="lg:hidden w-full flex flex-wrap justify-center gap-2 px-6 pb-10">
          {tools.map((t, i) => (
             <button
              key={i}
              onClick={() => setActiveTool(i)}
              className={`px-4 py-2 rounded-xl text-sm ${activeTool === i ? "bg-black text-white shadow-lg" : "bg-gray-100 text-gray-500"}`}
             >
               {t.name}
             </button>
          ))}
      </div>
    </section>
  );
}