import mongoose, { Schema, Document } from 'mongoose';

export interface IWinner extends Document {
  periodId: mongoose.Types.ObjectId;
  memberId: string; // Stored as a string representation of Member ID
  name: string;
  date: string;
  round: number;
  isPaid: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const WinnerSchema: Schema = new Schema(
  {
    periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
    memberId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    round: { type: Number, required: true, min: 1 },
    isPaid: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

WinnerSchema.index({ periodId: 1 });

export default mongoose.model<IWinner>('Winner', WinnerSchema);
