import { app } from "./app.js";
import dotenv from "dotenv";
import { connectDB } from "./src/db/index.js";

dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

app.get("/", (req, res) => {
  res.send("hello rj....");
});

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