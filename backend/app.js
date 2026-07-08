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
import settlementRouter from "./src/routes/settlement.routes.js";
import dashboardRouter from "./src/routes/dashboard.routes.js";
import groupRouter from "./src/routes/group.routes.js";

app.use("/api/v1/users", userRouter);

app.use("/api/v1/friends", friendRouter);

app.use("/api/v1/groups", groupRouter);

app.use("/api/v1/expenses", expenseRouter);

app.use("/api/v1/settlements", settlementRouter);

app.use("/api/v1/dashboard", dashboardRouter);



export { app };
