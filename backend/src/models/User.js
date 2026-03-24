import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const ROLES = ["farmer", "transporter", "warehouse", "retailer", "consumer", "admin", "inspector", "buyer", "distributor"];
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  walletAddress: { type: String, default: "", sparse: true }, // optional for farmer registration
  role: { type: String, enum: ROLES, required: true },
  name: { type: String, required: true },
  location: { type: String, default: "" }, // Farm Location for farmers
  mobile: { type: String, default: "" },
  chainRole: { type: Number, default: null }, // 1=Farmer, 2=Buyer, 3=Distributor, 4=Retailer, 5=Inspector
  registeredOnChain: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  verificationStatus: { type: String, enum: ["unverified", "verified"], default: "unverified" },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
