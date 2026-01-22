import { GoogleGenerativeAI } from "@google/generative-ai"
import { MessageModel } from "../models/MessageModel"
import { UserModel } from "../models/UserModel"
import { IGeminiAnalysis } from "../types"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export class GeminiService {
	static async analyzeUser(
		userId: number,
		daysAgo: number = 30,
	): Promise<IGeminiAnalysis> {
		const user = await UserModel.findById(userId)
		if (!user) {
			throw new Error("User not found")
		}

		// Get last 100 messages
		const messages = await MessageModel.getMessagesByUserIdWithTimeFilter(
			userId,
			daysAgo,
			100,
		)

		if (messages.length === 0) {
			throw new Error("No messages found for this user")
		}

		const messagesText = messages.map(m => m.text).join("\n")

		const prompt = `Analyze the following Telegram messages from a user and provide insights in JSON format with the following structure:
{
  "style": "brief description of communication style (formal/informal/casual/etc)",
  "topics": ["list", "of", "main", "topics"],
  "activity_pattern": "description of when user is most active",
  "tone": "positive/neutral/negative or mixed",
  "features": "unique characteristics, emoji usage, question frequency, etc"
}

Messages to analyze:
${messagesText}

Return ONLY valid JSON, no additional text.`

		try {
			const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
			const result = await model.generateContent(prompt)
			const responseText = result.response.text()

			// Extract JSON from response (handle markdown code blocks)
			let jsonText = responseText
			const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
			if (jsonMatch) {
				jsonText = jsonMatch[1]
			}

			const parsed = JSON.parse(jsonText)

			return {
				style: parsed.style || "Unknown",
				topics: Array.isArray(parsed.topics) ? parsed.topics : [],
				activity_pattern: parsed.activity_pattern || "Unknown",
				tone: parsed.tone || "Neutral",
				features: parsed.features || "No specific features",
				message_count: messages.length,
				days_period: daysAgo,
			}
		} catch (error) {
			console.error("Gemini API error:", error)
			throw new Error("Failed to analyze user with Gemini")
		}
	}
}
