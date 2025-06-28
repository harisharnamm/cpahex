// Re-export database types for backward compatibility
export type {
  Client,
  Document,
  Vendor,
  IRSNotice as Notice,
  ChatMessage,
  Task,
  AIInsight,
  PaymentTransaction
} from '../lib/database';