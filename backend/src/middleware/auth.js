import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "agri-supply-chain-secret-change-in-production";

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.walletAddress = decoded.walletAddress;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (req.role !== "admin" && req.role !== "owner") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

export async function attachUser(req, res, next) {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function signToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      walletAddress: user.walletAddress,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
