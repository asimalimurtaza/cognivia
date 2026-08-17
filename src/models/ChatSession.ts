import { Schema, Document, models, model } from "mongoose";

export interface IChatMessage {
  sender: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface IChatSession extends Document {
  userId: string;
  title: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  sender: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, default: "New Chat" },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

const ChatSession =
  models.ChatSession || model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSession;
