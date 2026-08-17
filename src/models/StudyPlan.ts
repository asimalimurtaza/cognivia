import { Schema, Document, models, model } from "mongoose";

export interface IStudyTask {
  _id?: string;
  title: string;
  courseTitle?: string;
  priority: "high" | "medium" | "low";
  scheduledDate: string; // YYYY-MM-DD
  recommendedMinutes: number;
  completed: boolean;
}

export interface IStudyPlan extends Document {
  userId: string;
  weekStartDate: Date;
  tasks: IStudyTask[];
  createdAt: Date;
  updatedAt: Date;
}

const StudyTaskSchema = new Schema<IStudyTask>({
  title: { type: String, required: true },
  courseTitle: { type: String, default: "General Study" },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  scheduledDate: { type: String, required: true },
  recommendedMinutes: { type: Number, default: 30 },
  completed: { type: Boolean, default: false },
});

const StudyPlanSchema = new Schema<IStudyPlan>(
  {
    userId: { type: String, required: true, index: true },
    weekStartDate: { type: Date, default: Date.now },
    tasks: [StudyTaskSchema],
  },
  { timestamps: true }
);

const StudyPlan =
  models.StudyPlan || model<IStudyPlan>("StudyPlan", StudyPlanSchema);

export default StudyPlan;
