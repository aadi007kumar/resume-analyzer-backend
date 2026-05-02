import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { Analysis } from "../models/Analysis.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function buildAuthResponse(user) {
    return {
        token: generateToken(user._id.toString()),
        user: {
            id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            provider: user.provider,
            phoneNumber: user.phoneNumber,
            phoneVerified: user.phoneVerified,
            avatarUrl: user.avatarUrl
        }
    };
}

export async function signup(req, res) {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !email || !password) {
        return res.status(400).json({ message: "First name, email, and password are required." });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
        firstName,
        lastName: lastName || "",
        email: email.toLowerCase(),
        passwordHash,
        provider: "Email"
    });

    return res.status(201).json(buildAuthResponse(user));
}

export async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.json(buildAuthResponse(user));
}

export async function googleAuth(req, res) {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: "Google credential is required." });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.status(400).json({ message: "Google OAuth is not configured on the backend." });
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();

    if (!payload?.email) {
        return res.status(400).json({ message: "Google account email is unavailable." });
    }

    let user = await User.findOne({ email: payload.email.toLowerCase() });

    if (!user) {
        user = await User.create({
            firstName: payload.given_name || payload.name?.split(" ")[0] || "Google",
            lastName: payload.family_name || payload.name?.split(" ").slice(1).join(" ") || "",
            email: payload.email.toLowerCase(),
            provider: "Google",
            googleId: payload.sub || ""
        });
    } else if (user.provider !== "Google" && !user.googleId) {
        user.googleId = payload.sub || "";
        await user.save();
    }

    return res.json(buildAuthResponse(user));
}

export async function requestPasswordReset(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return res.status(404).json({ message: "No account was found for that email." });
    }

    const resetCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    user.resetCode = resetCode;
    user.resetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.json({
        message: "Password reset code generated.",
        resetCode
    });
}

export async function resetPassword(req, res) {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.resetCode !== code || !user.resetCodeExpiresAt || user.resetCodeExpiresAt < new Date()) {
        return res.status(400).json({ message: "Reset code is invalid or expired." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetCode = "";
    user.resetCodeExpiresAt = null;
    await user.save();

    return res.json({ message: "Password updated successfully." });
}

export async function me(req, res) {
    return res.json({
        user: {
            id: req.user._id.toString(),
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            provider: req.user.provider,
            phoneNumber: req.user.phoneNumber,
            phoneVerified: req.user.phoneVerified,
            avatarUrl: req.user.avatarUrl,
            memberSince: req.user.createdAt,
            memberSinceLabel: new Date(req.user.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            })
        }
    });
}

export async function updateProfile(req, res) {
    const { firstName, lastName, phoneNumber } = req.body;

    if (!firstName) {
        return res.status(400).json({ message: "First name is required." });
    }

    req.user.firstName = firstName.trim();
    req.user.lastName = (lastName || "").trim();

    if (typeof phoneNumber === "string" && phoneNumber.trim() !== req.user.phoneNumber) {
        req.user.phoneNumber = phoneNumber.trim();
        req.user.phoneVerified = false;
    }

    await req.user.save();
    return res.json({
        message: "Profile updated successfully.",
        user: {
            id: req.user._id.toString(),
            firstName: req.user.firstName,
            lastName: req.user.lastName,
            email: req.user.email,
            provider: req.user.provider,
            phoneNumber: req.user.phoneNumber,
            phoneVerified: req.user.phoneVerified,
            avatarUrl: req.user.avatarUrl
        }
    });
}

export async function uploadAvatar(req, res) {
    if (!req.file) {
        return res.status(400).json({ message: "Avatar image is required." });
    }

    req.user.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await req.user.save();

    return res.json({
        message: "Profile picture updated.",
        avatarUrl: req.user.avatarUrl
    });
}

export async function requestPhoneOtp(req, res) {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
        return res.status(400).json({ message: "Phone number is required." });
    }

    const otpCode = `${Math.floor(100000 + Math.random() * 900000)}`;
    req.user.phoneNumber = phoneNumber.trim();
    req.user.phoneVerified = false;
    req.user.phoneOtpCode = otpCode;
    req.user.phoneOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();

    return res.json({
        message: "OTP generated for mobile verification.",
        otpCode
    });
}

export async function verifyPhoneOtp(req, res) {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
        return res.status(400).json({ message: "Phone number and OTP are required." });
    }

    if (
        req.user.phoneNumber !== phoneNumber.trim() ||
        req.user.phoneOtpCode !== code ||
        !req.user.phoneOtpExpiresAt ||
        req.user.phoneOtpExpiresAt < new Date()
    ) {
        return res.status(400).json({ message: "OTP is invalid or expired." });
    }

    req.user.phoneVerified = true;
    req.user.phoneOtpCode = "";
    req.user.phoneOtpExpiresAt = null;
    await req.user.save();

    return res.json({
        message: "Phone number verified successfully.",
        phoneVerified: true
    });
}

export async function deleteAccount(req, res) {
    await Analysis.deleteMany({ user: req.user._id });
    await User.deleteOne({ _id: req.user._id });

    return res.json({ message: "Account deleted successfully." });
}

export function linkedinStart(_req, res) {
    if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_REDIRECT_URI) {
        return res.status(400).json({ message: "LinkedIn OAuth is not configured on the backend." });
    }

    const state = jwt.sign({ provider: "linkedin" }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");

    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", process.env.LINKEDIN_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", process.env.LINKEDIN_REDIRECT_URI);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("scope", "openid profile email");

    return res.redirect(authUrl.toString());
}

export async function linkedinCallback(req, res) {
    const { code, state } = req.query;

    if (!code || !state) {
        return res.status(400).json({ message: "LinkedIn callback is missing code or state." });
    }

    try {
        jwt.verify(state, process.env.JWT_SECRET);
    } catch {
        return res.status(400).json({ message: "Invalid LinkedIn OAuth state." });
    }

    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code: String(code),
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
        })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
        return res.status(400).json({ message: tokenData.error_description || "LinkedIn token exchange failed." });
    }

    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`
        }
    });
    const linkedInUser = await userInfoResponse.json();

    if (!userInfoResponse.ok || !linkedInUser.sub) {
        return res.status(400).json({ message: "Unable to retrieve LinkedIn user profile." });
    }

    const email = linkedInUser.email || `${linkedInUser.sub}@linkedin.local`;
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        user = await User.create({
            firstName: linkedInUser.given_name || linkedInUser.name?.split(" ")[0] || "LinkedIn",
            lastName: linkedInUser.family_name || linkedInUser.name?.split(" ").slice(1).join(" ") || "",
            email: email.toLowerCase(),
            provider: "LinkedIn"
        });
    }

    const token = generateToken(user._id.toString());
    const frontendUrl = new URL("/auth.html", process.env.FRONTEND_APP_URL);
    frontendUrl.searchParams.set("oauth", "linkedin");
    frontendUrl.searchParams.set("token", token);
    frontendUrl.searchParams.set("firstName", user.firstName);
    frontendUrl.searchParams.set("lastName", user.lastName || "");
    frontendUrl.searchParams.set("email", user.email);
    frontendUrl.searchParams.set("provider", "LinkedIn");

    return res.redirect(frontendUrl.toString());
}
