import { Router } from "express";
import { createOrder } from "../controllers/ordersController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.post("/", authenticate, createOrder);

export default router;
