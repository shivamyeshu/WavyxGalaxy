"use client";

import {Toaster} from "react-hot-toast";

export function ToastProvider() {
	return (
		<Toaster
			position="top-right"
			reverseOrder={false}
			toastOptions={{
				duration: 4000,
				style: {
					background: "#1a1a1a",
					color: "#fff",
					border: "1px solid rgba(255, 255, 255, 0.1)",
					borderRadius: "12px",
					padding: "16px",
					fontSize: "14px",
				},
				success: {
					duration: 3000,
					iconTheme: {
						primary: "#10b981",
						secondary: "#fff",
					},
					style: {
						border: "1px solid rgba(16, 185, 129, 0.3)",
					},
				},
				error: {
					duration: 5000,
					iconTheme: {
						primary: "#ef4444",
						secondary: "#fff",
					},
					style: {
						border: "1px solid rgba(239, 68, 68, 0.3)",
					},
				},
				loading: {
					style: {
						border: "1px solid rgba(254, 243, 199, 0.3)",
					},
					iconTheme: {
						primary: "#FEF3C7",
						secondary: "#1a1a1a",
					},
				},
			}}
		/>
	);
}
