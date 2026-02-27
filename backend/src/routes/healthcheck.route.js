import { healthCheck } from "../controller/healthcheck.controller.js";
import {Router} from "express";

const router = Router();

router.route("/").get(healthCheck);

export default router;