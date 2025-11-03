import { Router } from "express";
import { getItems } from "../controllers/itemsController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.get("/", authenticate, getItems);

export default router;
