import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const memberSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    displayName: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const splitSchema = new Schema(
  {
    userId: { type: String, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const expenseSchema = new Schema(
  {
    clientId: { type: String, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    paidBy: { type: String, required: true },
    splitType: {
      type: String,
      enum: ['equal', 'custom', 'percentage'],
      required: true,
    },
    splits: { type: [splitSchema], required: true },
    note: { type: String, default: null },
    date: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const settlementSchema = new Schema(
  {
    clientId: { type: String, required: true },
    fromMember: { type: String, required: true },
    toMember: { type: String, required: true },
    amountMinor: { type: Number, required: true, min: 0 },
    date: { type: String, required: true },
    note: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const groupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [memberSchema], default: [] },
    expenses: { type: [expenseSchema], default: [] },
    settlements: { type: [settlementSchema], default: [] },
  },
  { timestamps: true },
);

export type GroupDocument = InferSchemaType<typeof groupSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Group = mongoose.model('Group', groupSchema);
