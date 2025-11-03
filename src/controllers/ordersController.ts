import { Response } from "express";
import { capPost } from "../services/capService";
import { AuthenticatedRequest } from "../middleware/auth";
import { sendSuccessResponse, sendErrorResponse } from "../utils/errorHandler";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return sendErrorResponse(res, "Request body is required", 400);
    }

    const response = await capPost("/createOrder", req.body);
    sendSuccessResponse(res, response.data, 201);
  } catch (err: any) {
    console.error("❌ Error creating order:", err.message);
    sendErrorResponse(res, err);
  }
};
