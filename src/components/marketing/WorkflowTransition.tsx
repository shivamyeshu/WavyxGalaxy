"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, useTransform, AnimatePresence } from "framer-motion";
import Image from "next/image";

// --- DATA SOURCE ---
export const workflowAppModeData = {
    heading: {
        part1: "From Workflow",
        part2: "to App Mode",
        subtitle: "Maximize your team ability, by automatically generating a simplified UI",
    },
    workflowMode: {
        nodes: [
            {
                id: 1,
                type: "PROMPT",
                label: "PROMPT",
                position: { top: "8%", left: "5%" },
                size: { width: "280px", height: "auto" },
                content: {
                    text: "A transparent, green-tinted mechanical weave machine. It has a cylindrical component on the left, which seems to be rotating, producing thin, white strands that flow downwards. Cinematic",
                },
                // Updated Background Color
                bgColor: "#FEF3C7", 
            },
            {
                id: 2,
                type: "IMAGE",
                label: "IMAGE REFERENCE",
                position: { top: "55%", left: "25%" },
                size: { width: "140px", height: "auto" },
                image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b7678811e48ff42f7db_Frame%20427321160.avif",
                bgColor: "#2A2A2A",
            },
            {
                id: 3,
                type: "IMAGE",
                label: "IMAGE",
                sublabel: "BRIA",
                position: { top: "12%", left: "42%" },
                size: { width: "180px", height: "auto" },
                image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b76a834003529b7f5d7_Group%207798.avif",
            },
            {
                id: 4,
                type: "IMAGE",
                label: "IMAGE",
                sublabel: "GEMINI V2",
                position: { top: "48%", left: "48%" },
                size: { width: "160px", height: "auto" },
                image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b761ffbb948a3e6f9e0_Frame%20427321155.avif",
            },
            {
                id: 5,
                type: "IMAGE",
                label: "IMAGE",
                position: { top: "62%", left: "68%" },
                size: { width: "140px", height: "auto" },
                image: "https://cdn.prod.website-files.com/681b040781d5b5e278a69989/68262b7668cc066c00b3d2a2_Frame%20427321159.avif",
            },
        ],
    },
    appMode: {
        nodes: [
            {
                id: 2,
                type: "OUTPUT",
                label: "OUTPUT",
                position: { top: "12%", right: "8%" },
                size: { width: "320px", height: "auto" },
                image: "/wave.png",
                // Updated Background Color
                bgColor: "#FEF3C7", 
                featured: true,
            },
        ],
    },
};

export default function WorkflowTransition() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isAppMode, setIsAppMode] = useState(false);

    const promptNode = workflowAppModeData.workflowMode.nodes.find((n) => n.type === "PROMPT");
    const outputNode = workflowAppModeData.appMode.nodes.find((n) => n.featured === true);
    const floatingNodes = workflowAppModeData.workflowMode.nodes.filter((n) => n.type !== "PROMPT");

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setIsAppMode(latest > 0.4);
    });

    const toggleX = useTransform(scrollYProgress, [0.35, 0.45], [0, 24]);
    const bgOpacity = useTransform(scrollYProgress, [0.35, 0.45], [0, 1]);
    const yFloat = useTransform(scrollYProgress, [0, 0.4], [0, -80]);

    return (
        <section ref={containerRef} className="h-[200vh] relative bg-[#FBFBFB]">
            {/* Sticky Viewport - Added min-height to prevent jumping */}
            <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-center items-center py-10">
                
                {/* --- 1. HEADER --- */}
                <div className="text-center relative z-30 mb-10 px-4 w-full">
                    <p className="text-gray-500 mb-4 text-xs font-medium uppercase tracking-widest">
                        {workflowAppModeData.heading.subtitle}
                    </p>
                    <div className="flex items-center justify-center gap-4 md:gap-8">
                        <h2 className={`text-4xl md:text-6xl font-medium tracking-tight transition-colors duration-500 ${isAppMode ? "text-gray-300" : "text-black"}`}>
                            {workflowAppModeData.heading.part1}
                        </h2>

                        <div className="relative w-14 h-8 rounded-full bg-black/10 p-1 flex items-center">
                            <motion.div style={{ opacity: bgOpacity }} className="absolute inset-0 bg-[#FEF3C7] rounded-full" />
                            <motion.div style={{ x: toggleX }} className="relative z-10 w-6 h-6 bg-black rounded-full shadow-sm" />
                        </div>

                        <h2 className={`text-4xl md:text-6xl font-medium tracking-tight transition-colors duration-500 ${isAppMode ? "text-black" : "text-gray-300"}`}>
                            {workflowAppModeData.heading.part2}
                        </h2>
                    </div>
                </div>

                {/* --- 2. CANVAS --- */}
                <div className="relative w-full max-w-[1200px] flex-1 flex items-center justify-center px-6">
                    <motion.div
                        layout
                        className={`w-full h-[500px] flex transition-all duration-700 ease-in-out ${
                            isAppMode ? "flex-row gap-6 items-stretch" : "relative block"
                        }`}
                    >
                        {/* KEY ELEMENT: PROMPT */}
                        {promptNode && (
                            <motion.div
                                layout
                                className={`shadow-sm rounded-2xl flex flex-col z-20 overflow-hidden ${
                                    isAppMode ? "w-1/2 relative h-full" : "absolute"
                                }`}
                                style={{
                                    backgroundColor: "#FEF3C7", // Hardcoded per request
                                    ...(!isAppMode && {
                                        top: promptNode.position.top,
                                        left: promptNode.position.left,
                                        width: promptNode.size.width,
                                    }),
                                }}
                            >
                                <motion.div layout="position" className="p-8 flex flex-col h-full">
                                    <span className="text-[10px] font-bold tracking-widest text-black/40 uppercase mb-4">{promptNode.label}</span>
                                    <p className="text-sm md:text-base leading-relaxed font-medium text-black/80">
                                        {promptNode.content?.text}
                                    </p>
                                    {isAppMode && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-auto pt-6 font-bold text-xs uppercase tracking-widest text-black border-t border-black/5 text-left"
                                        >
                                            Generate Now
                                        </motion.button>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}

                        {/* KEY ELEMENT: OUTPUT */}
                        {outputNode && (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ 
                                    opacity: isAppMode ? 1 : (isAppMode ? 1 : 0), 
                                    x: isAppMode ? 0 : 50,
                                    pointerEvents: isAppMode ? "auto" : "none" 
                                }}
                                className={`bg-white rounded-2xl shadow-sm z-20 overflow-hidden ${
                                    isAppMode ? "w-1/2 relative h-full" : "absolute hidden"
                                }`}
                                style={{
                                    // Hidden in workflow mode, takes half width in app mode
                                    display: isAppMode ? "block" : "none"
                                }}
                            >
                                <div className="px-6 py-4 border-b border-gray-50" style={{ backgroundColor: "#FEF3C7" }}>
                                    <span className="text-[10px] font-bold tracking-widest text-black/40 uppercase">{outputNode.label}</span>
                                </div>
                                <div className="relative w-full h-full bg-white flex items-center justify-center p-4">
                                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-black/5">
                                        <Image src={outputNode.image || ""} alt="Output" fill className="object-cover" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* BACKGROUND FLOATING NODES */}
                        <AnimatePresence>
                            {!isAppMode && floatingNodes.map((node, i) => (
                                <motion.div
                                    key={node.id}
                                    style={{
                                        top: node.position.top,
                                        left: node.position.left,
                                        width: node.size.width,
                                        y: yFloat,
                                    }}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5, filter: "blur(15px)" }}
                                    className="absolute rounded-xl overflow-hidden shadow-xl bg-white pointer-events-none z-10 border border-gray-100"
                                >
                                    {node.image && (
                                        <div className="relative w-full aspect-[4/3] bg-gray-50">
                                            <Image src={node.image} alt="Node" width={200} height={150} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}