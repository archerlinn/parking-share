import mongoose, { Document, Schema } from "mongoose";
import bcryptjs from "bcryptjs";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
  userType: 'owner' | 'renter';
  verifiedEmail: boolean;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    userType: {
      type: String,
      enum: ["owner", "renter"],
      required: [true, "User type is required"],
    },
    verifiedEmail: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema); 