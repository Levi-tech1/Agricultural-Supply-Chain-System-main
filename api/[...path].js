/**
 * Vercel serverless: proxy /api/* → BACKEND_URL/api/*
 * Repo root deploy. Logic in ./proxyCore.cjs
 */
const { proxyHandler } = require("./proxyCore.cjs");

module.exports = proxyHandler;
