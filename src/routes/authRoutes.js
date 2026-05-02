import { Router } from "express";
import {
    deleteAccount,
    googleAuth,
    linkedinCallback,
    linkedinStart,
    login,
    me,
    requestPasswordReset,
    requestPhoneOtp,
    resetPassword,
    signup,
    updateProfile,
    uploadAvatar,
    verifyPhoneOtp
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const avatarDirectory = path.resolve("uploads", "avatars");

if (!fs.existsSync(avatarDirectory)) {
    fs.mkdirSync(avatarDirectory, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDirectory),
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const safeName = file.originalname.replace(/\s+/g, "-");
        cb(null, `${timestamp}-${safeName}`);
    }
});

const avatarUpload = multer({ storage: avatarStorage });

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleAuth);
router.get("/linkedin/start", linkedinStart);
router.get("/linkedin/callback", linkedinCallback);
router.post("/forgot-password/request", requestPasswordReset);
router.post("/forgot-password/reset", resetPassword);
router.get("/me", requireAuth, me);
router.patch("/profile", requireAuth, updateProfile);
router.post("/avatar", requireAuth, avatarUpload.single("avatar"), uploadAvatar);
router.post("/phone/request-otp", requireAuth, requestPhoneOtp);
router.post("/phone/verify-otp", requireAuth, verifyPhoneOtp);
router.delete("/account", requireAuth, deleteAccount);

export default router;
