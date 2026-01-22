import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
	title: "Chat Analytics",
	description: "Telegram bot chat analytics and user analysis",
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	)
}
