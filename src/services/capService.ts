import axios from "axios";
import { getServiceToken } from "../utils/tokenManager";
import { buildCapUrl, getCapHeaders } from "./capServiceHelpers";
import { handleCapError } from "./capErrorHandler";

/**
 * Get data from CAP service
 */
export async function capGet(endpoint: string) {
  let url: string;

  try {
    url = buildCapUrl(endpoint);
  } catch (error) {
    // Configuration error - pass through with helpful message
    throw handleCapError(error, `GET ${endpoint}`);
  }

  try {
    const token = await getServiceToken();

    console.log(`📡 GET ${url}`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    const response = await axios.get(url, {
      headers: getCapHeaders(token),
      timeout: 30000,
    });

    console.log(`✅ CAP GET ${endpoint} succeeded (${response.status})`);
    return response;
  } catch (error) {
    throw handleCapError(error, `GET ${endpoint}`, url);
  }
}

/**
 * Post data to CAP service
 */
export async function capPost(endpoint: string, data: any) {
  let url: string;

  try {
    url = buildCapUrl(endpoint);
  } catch (error) {
    // Configuration error - pass through with helpful message
    throw handleCapError(error, `POST ${endpoint}`);
  }

  try {
    const token = await getServiceToken();

    console.log(`📡 POST ${url}`);

    const response = await axios.post(url, data, {
      headers: getCapHeaders(token),
      timeout: 30000,
    });

    return response;
  } catch (error) {
    throw handleCapError(error, `POST ${endpoint}`, url);
  }
}

