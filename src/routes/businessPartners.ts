import { Router } from "express";
import { getBusinessPartners } from "../controllers/businessPartnersController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All routes require authentication
router.get("/", authenticate, getBusinessPartners);

export default router;
