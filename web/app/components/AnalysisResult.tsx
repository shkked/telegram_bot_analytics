import { IGeminiAnalysis } from "../types"

export default function AnalysisResult({ data }: { data: IGeminiAnalysis }) {
	return (
		<div className="analysis-result">
			<h2>📊 Analysis Result</h2>

			<div className="analysis-field">
				<strong>💬 Communication Style:</strong>
				<p>{data.style}</p>
			</div>

			<div className="analysis-field">
				<strong>📌 Main Topics:</strong>
				<div>
					{data.topics && data.topics.length > 0 ? (
						data.topics.map(topic => (
							<span key={topic} className="badge">
								{topic}
							</span>
						))
					) : (
						<p>No specific topics identified</p>
					)}
				</div>
			</div>

			<div className="analysis-field">
				<strong>⏰ Activity Pattern:</strong>
				<p>{data.activity_pattern}</p>
			</div>

			<div className="analysis-field">
				<strong>😊 Tone:</strong>
				<p>{data.tone}</p>
			</div>

			<div className="analysis-field">
				<strong>✨ Special Features:</strong>
				<p>{data.features}</p>
			</div>

			<div
				style={{
					marginTop: "15px",
					paddingTop: "15px",
					borderTop: "1px solid #eee",
				}}
			>
				<small style={{ color: "#999" }}>
					Based on {data.message_count} messages from the last{" "}
					{data.days_period} days
				</small>
			</div>
		</div>
	)
}
