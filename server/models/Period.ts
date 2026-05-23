import mongoose, { Schema, Document } from 'mongoose';

export interface IPeriod extends Document {
  name: string;
  targetMembers: number;
  nominalArisan: number;
  nominalKonsumsi: number;
  currentRound: number;
  isClosed: boolean;
  initialSisaKas: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PeriodSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    targetMembers: { type: Number, required: true, default: 10, min: 1 },
    nominalArisan: { type: Number, required: true, default: 0, min: 0 },
    nominalKonsumsi: { type: Number, required: true, default: 0, min: 0 },
    currentRound: { type: Number, required: true, default: 1, min: 1 },
    isClosed: { type: Boolean, required: true, default: false },
    initialSisaKas: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IPeriod>('Period', PeriodSchema);
