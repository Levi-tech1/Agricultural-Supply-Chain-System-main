import { Router } from "express";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken, authMiddleware } from "../middleware/auth.js";
import { seedOwner } from "../seedOwner.js";

const router = Router();

const roleToChain = { farmer: 1, buyer: 2, distributor: 3, retailer: 4, inspector: 5, transporter: 3, warehouse: 3, consumer: 2 };
const allowedRoles = ["farmer", "buyer", "distributor", "retailer", "transporter", "warehouse", "consumer", "admin", "inspector"];

router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("walletAddress").optional().isString().trim(),
    body("role").isIn(allowedRoles),
    body("name").trim().notEmpty(),
    body("location").optional().trim(),
    body("mobile").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const normalizedEmail = (req.body.email || "").toString().toLowerCase().trim();
      if (normalizedEmail) {
        const existingByEmail = await User.findOne({ email: normalizedEmail });
        if (existingByEmail) return res.status(400).json({ error: "Email already registered" });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const first = errors.array()[0];
        return res.status(400).json({ error: first?.msg || "Invalid request", errors: errors.array() });
      }
      const { email, password, walletAddress, role, name, location, mobile } = req.body;
      if (role === "admin") return res.status(400).json({ error: "Admin cannot self-register" });
      const wallet = (walletAddress || "").toString().trim().toLowerCase();
      if (wallet) {
        const existingByWallet = await User.findOne({ walletAddress: wallet });
        if (existingByWallet) return res.status(400).json({ error: "Wallet already registered" });
      }
      const user = await User.create({
        email: normalizedEmail || email,
        password,
        walletAddress: wallet || "",
        role,
        name,
        location: location || "",
        mobile: mobile || "",
        chainRole: roleToChain[role] ?? null,
      });
      const token = signToken(user);
      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          location: user.location,
          mobile: user.mobile,
          registeredOnChain: user.registeredOnChain,
          kycStatus: user.kycStatus,
          verificationStatus: user.verificationStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").exists().withMessage("Password is required")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const first = errors.array()[0];
        return res.status(400).json({ error: first?.msg || "Invalid request", errors: errors.array() });
      }
      const email = (req.body.email || "").toString().toLowerCase().trim();
      const password = req.body.password;

      let user = await User.findOne({ email });
      if (!user) {
        const ownerEmail = process.env.OWNER_EMAIL?.trim()?.toLowerCase();
        const ownerPassword = process.env.OWNER_PASSWORD;
        if (ownerEmail && ownerPassword && email === ownerEmail && password === ownerPassword) {
          try {
            await seedOwner();
          } catch (seedErr) {
            console.warn("Seed owner failed on login:", seedErr.message);
          }
          user = await User.findOne({ email });
        }
        // If still no user, try demo admin credentials (create/reset on first use)
        if (!user && email === "admin@agrichain.com" && password === "Admin@123") {
          try {
            await seedOwner();
          } catch (seedErr) {
            console.warn("Seed demo admin failed on login:", seedErr.message);
          }
          user = await User.findOne({ email });
          if (!user) {
            await new Promise((r) => setTimeout(r, 300));
            user = await User.findOne({ email });
          }
        }
      }
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      let passwordOk = false;
      try {
        passwordOk = await user.comparePassword(password);
      } catch (_) {
        passwordOk = false;
      }
      if (!passwordOk) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const token = signToken(user);
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          name: user.name,
          location: user.location,
          mobile: user.mobile,
          registeredOnChain: user.registeredOnChain,
          kycStatus: user.kycStatus,
          verificationStatus: user.verificationStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch("/registered-on-chain", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, { registeredOnChain: true }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ registeredOnChain: user.registeredOnChain });
  } catch (err) {
    next(err);
  }
});

export default router;
