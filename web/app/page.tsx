"use client"

import axios from "axios"
import { useState } from "react"
import AnalysisResult from "./components/AnalysisResult"
import { IGeminiAnalysis } from "./types"

export default function Home() {
	const [username, setUsername] = useState("")
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState("")
	const [result, setResult] = useState<IGeminiAnalysis | null>(null)

	const handleAnalyze = async (e: React.FormEvent) => {
		e.preventDefault()
		setError("")
		setResult(null)
		setLoading(true)

		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
			const response = await axios.post(`${apiUrl}/analyze`, {
				username: username.replace("@", ""),
			})

			setResult(response.data)
		} catch (err: any) {
			setError(err.response?.data?.error || "Failed to analyze user")
		} finally {
			setLoading(false)
		}
	}

	return (
		<main className="container">
			<div className="card">
				<h1>🔍 Chat Analytics</h1>
				<p style={{ textAlign: "center", color: "#666" }}>
					Analyze user communication style and patterns
				</p>

				<form onSubmit={handleAnalyze}>
					<div className="input-group">
						<input
							type="text"
							placeholder="Enter username (e.g., john_doe or @john_doe)"
							value={username}
							onChange={e => setUsername(e.target.value)}
							disabled={loading}
						/>
						<button type="submit" disabled={loading || !username.trim()}>
							{loading ? "⏳ Analyzing..." : "🔍 Analyze"}
						</button>
					</div>
				</form>

				{error && <div className="error">{error}</div>}

				{loading && <div className="loading">Analyzing user messages...</div>}

				{result && <AnalysisResult data={result} />}
			</div>
		</main>
	)
}
