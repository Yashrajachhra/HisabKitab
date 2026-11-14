import bcrypt from 'bcryptjs';
import mongoose, { Schema, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

type UserFields = InferSchemaType<typeof userSchema>;

export type UserMethods = {
  verifyPassword: (password: string) => Promise<boolean>;
};

userSchema.methods.verifyPassword = async function verifyPassword(
  this: HydratedDocument<UserFields>,
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export type UserDocument = HydratedDocument<UserFields, UserMethods>;

export const User: Model<UserFields, Record<string, never>, UserMethods> = mongoose.model<
  UserFields,
  Model<UserFields, Record<string, never>, UserMethods>
>('User', userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
