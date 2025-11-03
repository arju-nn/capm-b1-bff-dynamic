import { Response } from "express";
import { capGet } from "../services/capService";
import { AuthenticatedRequest } from "../middleware/auth";
import { sendSuccessResponse, sendErrorResponse } from "../utils/errorHandler";

export const getBusinessPartners = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const response = await capGet("/BusinessPartners");
    sendSuccessResponse(res, response.data);
  } catch (err: any) {
    console.error("❌ Error fetching business partners:", err.message);
    sendErrorResponse(res, err);
  }
};
