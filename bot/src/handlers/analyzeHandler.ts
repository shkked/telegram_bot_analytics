import { Context } from "telegraf"
import { UserModel } from "../models/UserModel"
import { GeminiService } from "../services/GeminiService"

export async function onAnalyzeCommand(ctx: Context): Promise<void> {
	try {
		if (!ctx.message) {
			return
		}

		// Get the argument (username or user ID)
		const text = "text" in ctx.message ? ctx.message.text : ""
		let targetUsername: string | null = null
		let targetUser = null

		// Parse command arguments
		const parts = text.split(/\s+/)

		if (parts.length > 1) {
			// User provided username or @username
			targetUsername = parts[1].replace("@", "")
			targetUser = await UserModel.findByUsername(targetUsername)
		} else if ((ctx.message as any).reply_to_message) {
			// Reply to a message - analyze that user
			const repliedMessage = (ctx.message as any).reply_to_message
			if (repliedMessage.from) {
				targetUser = await UserModel.findByTelegramId(repliedMessage.from.id)
			}
		} else {
			await ctx.reply(
				"💬 Usage:\n/analyze @username - analyze user by username\nReply to a message with /analyze - analyze message author",
			)
			return
		}

		if (!targetUser) {
			await ctx.reply(
				`User ${targetUsername || "not found"} has no messages in this chat`,
			)
			return
		}

		// Show loading message
		const loadingMsg = await ctx.reply("🔄 Analyzing user...")

		try {
			const analysis = await GeminiService.analyzeUser(targetUser.id, 30)

			const userName = targetUser.username
				? `@${targetUser.username}`
				: targetUser.first_name || "User"
			let message = `🔍 <b>Analysis of ${userName}</b>\n\n`
			message += `<b>Style:</b> ${analysis.style}\n`
			message += `<b>Tone:</b> ${analysis.tone}\n`
			message += `<b>Topics:</b> ${
				analysis.topics.join(", ") || "Not identified"
			}\n`
			message += `<b>Activity Pattern:</b> ${analysis.activity_pattern}\n`
			message += `<b>Features:</b> ${analysis.features}\n\n`
			message += `<i>Based on ${analysis.message_count} messages from last ${analysis.days_period} days</i>`

			await ctx.telegram.editMessageText(
				ctx.chat!.id,
				loadingMsg.message_id,
				undefined,
				message,
				{ parse_mode: "HTML" },
			)
		} catch (err) {
			console.error("Analysis error:", err)
			await ctx.telegram.editMessageText(
				ctx.chat!.id,
				loadingMsg.message_id,
				undefined,
				"❌ Analysis failed",
			)
		}
	} catch (error) {
		console.error("Error in analyze command:", error)
		await ctx.reply("Failed to process analyze command")
	}
}
