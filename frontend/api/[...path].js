/**
 * Vercel serverless when Root Directory is `frontend`. Logic in ./proxyCore.cjs
 */
const { proxyHandler } = require("./proxyCore.cjs");

module.exports = proxyHandler;
