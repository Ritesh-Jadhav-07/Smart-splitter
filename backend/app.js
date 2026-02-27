import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(cookieParser());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));


import healthCheckRouter from "./src/routes/healthcheck.route.js"
import userRouter from "./src/routes/user.routes.js"

app.use("/api/v1/healthCheck" , healthCheckRouter);
app.use("/api/v1/users" , userRouter);



export { app };
