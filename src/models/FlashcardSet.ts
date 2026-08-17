import { Schema, Document, models, model } from "mongoose";

export interface IFlashcard {
  _id?: string;
  front: string;
  back: string;
  box: number; // 1 to 5 for Leitner Box system
  lastReviewed?: Date;
  nextReviewDate?: Date;
}

export interface IFlashcardSet extends Document {
  userId: string;
  title: string;
  subject: string;
  cards: IFlashcard[];
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>({
  front: { type: String, required: true },
  back: { type: String, required: true },
  box: { type: Number, default: 1, min: 1, max: 5 },
  lastReviewed: { type: Date },
  nextReviewDate: { type: Date, default: Date.now },
});

const FlashcardSetSchema = new Schema<IFlashcardSet>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    subject: { type: String, default: "General" },
    cards: [FlashcardSchema],
  },
  { timestamps: true }
);

const FlashcardSet =
  models.FlashcardSet || model<IFlashcardSet>("FlashcardSet", FlashcardSetSchema);

export default FlashcardSet;
