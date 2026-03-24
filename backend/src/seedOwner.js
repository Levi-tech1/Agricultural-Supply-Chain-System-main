import User from "./models/User.js";

/** Demo admin credentials shown on login page – ensure this account exists so login works out of the box */
const DEMO_ADMIN_EMAIL = "admin@agrichain.com";
const DEMO_ADMIN_PASSWORD = "Admin@123";

/**
 * Ensure demo admin exists and password is Admin@123 (so login hint on frontend always works).
 * If the user already exists (e.g. wrong password), we reset password to the demo value.
 */
async function seedDemoAdmin() {
  const email = DEMO_ADMIN_EMAIL.toLowerCase();
  try {
    let user = await User.findOne({ email });
    if (user) {
      user.password = DEMO_ADMIN_PASSWORD;
      user.role = "admin";
      user.name = user.name || "Demo Owner";
      user.kycStatus = "verified";
      user.verificationStatus = "verified";
      await user.save();
      console.log("Demo admin password reset:", DEMO_ADMIN_EMAIL);
      return;
    }
    await User.create({
      email,
      password: DEMO_ADMIN_PASSWORD,
      walletAddress: "0x0000000000000000000000000000000000000001",
      role: "admin",
      name: "Demo Owner",
      location: "",
      kycStatus: "verified",
      verificationStatus: "verified",
    });
    console.log("Demo admin created:", DEMO_ADMIN_EMAIL, "- use this to sign in.");
  } catch (err) {
    console.error("Demo admin seed failed:", err.message);
  }
}

/**
 * Create owner (admin) account from env if OWNER_EMAIL and OWNER_PASSWORD are set
 * and no user with that email exists. Owner can then log in via the login page.
 */
export async function seedOwner() {
  // 1) Ensure demo admin exists so "admin@agrichain.com / Admin@123" always works
  await seedDemoAdmin();

  const email = process.env.OWNER_EMAIL?.trim();
  const password = process.env.OWNER_PASSWORD;
  const name = (process.env.OWNER_NAME || "Owner").trim();
  const wallet = (process.env.OWNER_WALLET || "0x0000000000000000000000000000000000000001").toLowerCase();

  if (!email || !password) {
    return;
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (existing.role === "admin") {
      console.log("Owner (admin) already exists:", email);
    } else {
      console.log("User with OWNER_EMAIL already exists with role:", existing.role, "- not overwriting.");
    }
    return;
  }

  try {
    await User.create({
      email: email.toLowerCase(),
      password,
      walletAddress: wallet,
      role: "admin",
      name: name || "Owner",
      location: "",
      kycStatus: "verified",
      verificationStatus: "verified",
    });
    console.log("Owner (admin) account created for:", email);
  } catch (err) {
    console.error("Owner seed failed (server will still start):", err.message);
  }
}
