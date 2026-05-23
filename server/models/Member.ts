import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment {
  round: number;
  paidInRound: number;
}

export interface IMember extends Document {
  periodId: mongoose.Types.ObjectId;
  name: string;
  payments: IPayment[];
  hasWon: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const PaymentSchema = new Schema({
  round: { type: Number, required: true },
  paidInRound: { type: Number, required: true },
}, { _id: false });

const MemberSchema: Schema = new Schema(
  {
    periodId: { type: Schema.Types.ObjectId, ref: 'Period', required: true },
    name: { type: String, required: true, trim: true },
    payments: { type: [PaymentSchema], default: [] },
    hasWon: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

// Index to optimize search by periodId
MemberSchema.index({ periodId: 1 });

export default mongoose.model<IMember>('Member', MemberSchema);
