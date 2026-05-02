import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            trim: true,
            required: true
        },
        lastName: {
            type: String,
            trim: true,
            default: ""
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            required: true,
            unique: true
        },
        passwordHash: {
            type: String,
            default: ""
        },
        provider: {
            type: String,
            enum: ["Email", "Google", "LinkedIn"],
            default: "Email"
        },
        googleId: {
            type: String,
            default: ""
        },
        phoneNumber: {
            type: String,
            default: ""
        },
        phoneVerified: {
            type: Boolean,
            default: false
        },
        phoneOtpCode: {
            type: String,
            default: ""
        },
        phoneOtpExpiresAt: {
            type: Date,
            default: null
        },
        avatarUrl: {
            type: String,
            default: ""
        },
        resetCode: {
            type: String,
            default: ""
        },
        resetCodeExpiresAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
