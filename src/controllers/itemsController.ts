import { Response } from "express";
import { capGet } from "../services/capService";
import { AuthenticatedRequest } from "../middleware/auth";
import { sendSuccessResponse, sendErrorResponse } from "../utils/errorHandler";

export const getItems = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await capGet("/Items");
    sendSuccessResponse(res, response.data);
  } catch (err: any) {
    console.error("❌ Error fetching items:", err.message);
    sendErrorResponse(res, err);
  }
};
