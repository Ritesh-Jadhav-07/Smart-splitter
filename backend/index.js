import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./src/db/index.js";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
dotenv.config({ path: "./.env" });

// 1️⃣ CORS config
const corsOptions = {
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true, 
};

app.use(cors(corsOptions));




// 4️⃣ Test route
app.get("/", (req, res) => {
  res.send("hello rj....");
});

// 5️⃣ Start server after DB connection
const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  });