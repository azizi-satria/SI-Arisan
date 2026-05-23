import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  periodId: mongoose.Types.ObjectId;
  description: string;
  amount: number;
  date: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, default: 0, min: 0 },
    date: { type: String, required: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ periodId: 1 });

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
