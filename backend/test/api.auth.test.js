import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import express from "express";
import cors from "cors";
import authRoutes from "../src/routes/auth.js";
import { errorHandler } from "../src/middleware/error.js";

let mongoServer;
let app;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use(errorHandler);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

describe("Auth API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a farmer", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "farmer@test.com",
          password: "password123",
          walletAddress: "0x1234567890123456789012345678901234567890",
          role: "farmer",
          name: "Test Farmer",
          location: "Iowa",
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user).toMatchObject({
        email: "farmer@test.com",
        role: "farmer",
        name: "Test Farmer",
        location: "Iowa",
      });
    });

    it("should reject duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "dup@test.com",
          password: "password123",
          walletAddress: "0x1234567890123456789012345678901234567891",
          role: "farmer",
          name: "First",
          location: "",
        });
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "dup@test.com",
          password: "other",
          walletAddress: "0x1234567890123456789012345678901234567892",
          role: "retailer",
          name: "Second",
          location: "",
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already registered/i);
    });

    it("should reject invalid role for self-register", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "admin@test.com",
          password: "password123",
          walletAddress: "0x1234567890123456789012345678901234567893",
          role: "admin",
          name: "Admin",
          location: "",
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/admin/i);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send({
          email: "login@test.com",
          password: "secret123",
          walletAddress: "0x1234567890123456789012345678901234567894",
          role: "retailer",
          name: "Retailer",
          location: "Chicago",
        });
    });

    it("should login with valid credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "secret123" });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.user.email).toBe("login@test.com");
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "login@test.com", password: "wrong" });
      expect(res.status).toBe(401);
    });
  });
});
