import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import {ClerkProvider} from "@clerk/nextjs";
import {AuthProvider} from "@/components/providers/AuthProvider";
import {ToastProvider} from "@/components/providers/ToastProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Removed invalid GeistSans import and usage

export const metadata: Metadata = {
	title: "Wavy ai | AI-Powered Workflow Builder",
	description: "Turn your creative vision into scalable LLM workflows. Access Gemini and other AI models in one node-based platform.",
	openGraph: {
	  title: "Wavy ai | Artistic Intelligence for AI Workflows",
	  description: "Build powerful, scalable workflows with Google Gemini integration, Trigger.dev executions, and professional node-based editing.",
	  images: [
		{
		  url: "/og-image.jpg", 
		  width: 1200,
		  height: 630,
		  alt: "AI Node-Based Workflow Canvas",
		},
	  ],
	  type: "website",
	},
  };
export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider
			appearance={{
				elements: {
					rootBox: "mx-auto",
				},
			}}
		>
			<html lang="en">
				<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
					<AuthProvider>
						{children}
						<ToastProvider />
					</AuthProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
