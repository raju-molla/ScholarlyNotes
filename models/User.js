import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    institution: { type: String, trim: true, default: "" },
    field: { type: String, trim: true, default: "" }, // research field/discipline
    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Email OTP verification, required before a first login is allowed.
    emailVerified: { type: Boolean, default: false },
    otpCodeHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

UserSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 10);
};

// toJSON: never leak the password hash or OTP hash to the client
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.otpCodeHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
