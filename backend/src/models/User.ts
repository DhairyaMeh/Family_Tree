import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserTier = 'free' | 'silver' | 'gold' | 'admin';

export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  tier: UserTier;
  isEmailVerified: boolean;
  emailOtp?: string;
  emailOtpExpiry?: Date;
  googleId?: string;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: String, required: true },
    username: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6,
    },
    tier: { 
      type: String, 
      enum: ['free', 'silver', 'gold', 'admin'],
      default: 'free',
    },
    isEmailVerified: { 
      type: Boolean, 
      default: false,
    },
    emailOtp: { type: String },
    emailOtpExpiry: { type: Date },
    googleId: { type: String },
    profileImage: { type: String },
  },
  { 
    timestamps: true,
    _id: false,
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUser>('User', UserSchema);

