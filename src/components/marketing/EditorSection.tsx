"use client";

import React, { useRef } from "react";
import Image from "next/image";

const EditorSection = () => {
	const astroRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLDivElement>(null);

	const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
		const { innerWidth, innerHeight } = window;

		const x = (e.clientX / innerWidth - 0.5) * 35;
		const y = (e.clientY / innerHeight - 0.5) * 35;

		// Astro (normal speed)
		if (astroRef.current) {
			astroRef.current.style.transform = `translate(${x}px, ${y}px)`;
		}

		// Text (faster + slightly down)
		if (textRef.current) {
			textRef.current.style.transform = `translate(${x * 1.6}px, ${y * 1.6 + 40}px)`;
		}
	};

	return (
		<section
			onMouseMove={handleMouseMove}
			className="hidden md:block relative w-full py-12 md:py-24 overflow-hidden bg-[#FBFBFB]"
		>
			<div className="relative z-10 w-full max-w-7xl mx-auto px-4 flex flex-col items-center">

				{/* Header */}
				<div className="text-center mb-16 max-w-3xl">
					<h2 className="text-6xl font-medium text-gray-900 mb-6">
						Control the <br /> Outcome
					</h2>
					<p className="text-lg text-gray-600">
						Layers, type, and blends — all the tools to bring your ideas to life.
					</p>
				</div>

				{/* Image Stack */}
				<div className="relative">
					{/* Base Image */}
					<Image
						src="/base.png"
						alt="Editor Workflow"
						width={1200}
						height={675}
						className="rounded-lg shadow-lg border"
					/>

					{/* Astro */}
					<div
						ref={astroRef}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out pointer-events-none"
					>
						<Image
							src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682ee1e4018d126165811a7b_Astro.avif"
							alt="Astro"
							width={950}
							height={900}
						/>
					</div>

					{/* Text (ON TOP) */}
					<div
						ref={textRef}
						className="absolute top-1/2 left-1/2 -translate-x-1/2 transition-transform duration-150 ease-out pointer-events-none"
					>
						<Image
							src="https://cdn.prod.website-files.com/681b040781d5b5e278a69989/682ee1e3553ccb7b1eac8758_text%20-%20in%20astro.svg"
							alt="Text in Astro"
							width={260}
							height={300}
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

export default EditorSection;
