export interface IUser {
	id: number
	telegram_id: number
	username?: string
	first_name?: string
	last_name?: string
	created_at: Date
}

export interface IChat {
	id: number
	telegram_id: number
	title: string
	created_at: Date
}

export interface IMessage {
	id: number
	chat_id: number
	user_id: number
	text: string
	created_at: Date
}

export interface IMessageWithUser extends IMessage {
	username?: string
	first_name?: string
}

export interface IStats {
	user_id: number
	username?: string
	first_name?: string
	message_count: number
}

export interface ICacheConfig {
	ttl: number 
}

export interface IGeminiAnalysis {
	style: string
	topics: string[]
	message_length: string
	activity_pattern: string
	tone: string
	features: string
	message_count: number
	days_period: number
}
