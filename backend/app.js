import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


import healthCheckRouter from "./src/routes/healthcheck.route.js"
import userRouter from "./src/routes/user.routes.js"
import friendRouter from "./src/routes/friends.routes.js"

import expenseRouter from "./src/routes/expense.routes.js";

app.use("/api/v1/expenses", expenseRouter);
app.use("/api/v1/healthCheck" , healthCheckRouter);
app.use("/api/v1/users" , userRouter);
app.use("/api/v1/friends", friendRouter);



export { app };
