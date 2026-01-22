"use client";

import {useState} from "react";
import Link from "next/link";
import {motion, useMotionValueEvent, useScroll} from "framer-motion";
import {useUser} from "@clerk/nextjs";

export default function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const {scrollY} = useScroll();
	const {user, isLoaded} = useUser();

	// Monitor scroll position to toggle state
	useMotionValueEvent(scrollY, "change", (latest) => {
		if (latest > 100 && !isScrolled) {
			setIsScrolled(true);
		} else if (latest <= 50 && isScrolled) {
			setIsScrolled(false);
		}
	});

	return (
		<motion.header
			className="fixed w-full top-0 z-50 border-transparent bg-transparent"
			style={{
				height: isScrolled ? "60px" : "100px",
			}}
			transition={{duration: 0.3, ease: "easeInOut"}}>
			<div className="mx-auto h-full flex items-start justify-between">
			{/* Left: Logo Group */}
			<div className="flex items-center gap-5">
				{/* The Icon */}
				<div className="flex flex-col gap-1 ml-auto">
					{/* Upper Section (3 bars) */}
					<div className="flex items-end gap-0.75 justify-end">
						<div className="w-2.5 h-7 bg-black"></div>
						<div className="w-2.5 h-7 bg-black"></div>
						<div className="w-2.5 h-7 bg-black"></div>
					</div>
					
				</div>
				{/* Brand Name & Tagline */}
					<div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
						<span className="font-semibold text-2xl tracking-tight leading-none">Weavy</span>

						{/* The vertical divider line */}
						<div className="hidden md:block h-5 w-px bg-black/10"></div>

						<span className="text-[10px] md:text-[9px] font-semibold tracking-widest text-black/60 uppercase leading-none mt-0.5">
							Artistic
							<br className="md:hidden" /> Intelligence
						</span>
					</div>
				</div>

				{/* Right Side Container */}
				<div className="flex items-start gap-4 ml-auto">
					{/* Navigation Links - Hidden on mobile */}
					<nav className="flex items-center text-[13px] text-black/70 tracking-wide">
					<div className="flex gap-4 mt-2">
							{isLoaded && user ? (
								<Link href="/workflows" className="hover:text-black transition-colors font-medium">
									{user.firstName || user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "User"}
								</Link>
							) : (
								<Link href="/sign-in" className="hover:text-black transition-colors font-medium">
									SIGN IN
								</Link>
							)}
						</div>

					</nav>

					{/* Big "Start Now" Button - Animates Size */}
					<motion.div
						animate={{
							scale: isScrolled ? 0.9 : 1,
						}}
						transition={{duration: 0.3}}
						className="flex items-center">
						<Link
							href="/workflows"
							className={`
    transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
    hover:bg-[#d5d7cf] active:scale-95
    cursor-pointer select-none
    font-normal text-black rounded-md
    bg-[#FEF3C7] flex items-end justify-start whitespace-nowrap h-full
    ${isScrolled ? "h-12 py-2 text-lg leading-none" : "h-[89.9px] w-50.5 pt-2.5 pb-[7.92px] pl-[12.76px] pr-[24.36px] text-[40px] leading-[60px]"}
  `}
							style={{
								boxSizing: "border-box",
								maxWidth: "100%",
								WebkitFontSmoothing: "antialiased",
							}}>
							<motion.span
								animate={{
									marginTop: isScrolled ? 0 : 24, // 24px ≈ mt-6
								}}
								transition={{duration: 0.3, ease: "easeInOut"}}
								className="block w-full text-left mx-1.5">
								Start Now
							</motion.span>
						</Link>
					</motion.div>
				</div>
			</div>
		</motion.header>
	);
}
