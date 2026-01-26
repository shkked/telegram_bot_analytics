import { GoogleGenAI } from "@google/genai"
import { MessageModel } from "../models/MessageModel"
import { UserModel } from "../models/UserModel"
import { IGeminiAnalysis } from "../types"

const apiKey = process.env.GEMINI_API_KEY || ""
if (!apiKey) {
	throw new Error("Нет ключа GEMINI_API_KEY")
}
const ai = new GoogleGenAI({ apiKey })

export class GeminiService {
	// TODO Решить проблему Analysis error: Error: Failed to analyze user with Gemini
	// Gemini API error: Error: exception TypeError: fetch failed sending request
	// Error:  end to JSON
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

		const prompt = `Проанализируй	следующие сообщения Telegram от пользователя и предоставь инсайты в формате JSON со следующей структурой:
{
  "Стиль общения": "Описание стиля общения пользователя (формальный/неформальный/круглый)",
  "Основные темы, которые поднимает пользователь": ["Список", "основных", "тем"],
  "Средняя длина сообщений": "Описание средней длины сообщений (короткие/средние/длинные)",
  "Активность по времени суток": "Описание активности пользователя по времени суток (утро/день/вечер/ночь)",
  "Тональность": "Описание общей тональности сообщений (позитивная/негативная/нейтральная)",
  "Частые слова или выражения": "Описание частых слов или выражений, используемых пользователем"
}

Сообщения для анализа:
${messagesText}

Пришли только JSON без дополнительного текста.`

		try {
			const result = await ai.models.generateContent({
				model: "gemini-3-flash-preview",
				contents: prompt,
			})
			const responseText = result.text || ""

			// Extract JSON from response (handle markdown code blocks)
			let jsonText = responseText
			const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
			// console.log({ result, jsonText, jsonMatch })
			if (jsonMatch) {
				jsonText = jsonMatch[1]
			}
			// console.log("Extracted JSON:", jsonText)
			const parsed = JSON.parse(jsonText)

			return {
				style: parsed["Стиль общения"] || "Неизвестно",
				topics: Array.isArray(
					parsed["Основные темы, которые поднимает пользователь"],
				)
					? parsed["Основные темы, которые поднимает пользователь"]
					: [],
				message_length: parsed["Средняя длина сообщений"] || "Неизвестно",
				activity_pattern: parsed["Активность по времени суток"] || "Неизвестно",
				tone: parsed["Тональность"] || "Нейтральная",
				features:
					parsed["Частые слова или выражения"] ||
					"Нет особых слов или выражений",
				message_count: messages.length,
				days_period: daysAgo,
			}
		} catch (error) {
			console.error("Gemini API error:", error)
			throw new Error("Failed to analyze user with Gemini")
		}
	}
}
