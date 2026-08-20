// generatePaymentAccessToken.ts
import axios, { AxiosResponse, AxiosError } from 'axios';
import https from 'https'

export const generateAccessToken = async (): Promise<string> => {
  try {
    const api_key = process.env.PG_API_KEY;
    const baseURL = process.env.PG_BASE_URL;
    console.log({ api_key: Boolean(api_key), baseURL });

    if (!baseURL) {
      throw new Error("Environment variable PG_BASE_URL is not set");
    }

    const url = `${baseURL}/identity/auth/access-token`;

    // Create axios instance with IPv4 force and timeout
    const axiosInstance = axios.create({
      timeout: 10000,
      family: 4, // Force IPv4
    });


    // Create custom agent for IPv4
    const httpsAgent = new https.Agent({
      family: 4, // Force IPv4
    });

    const response: AxiosResponse = await axiosInstance.post(
      url,
      {}, // empty body for POST request
      {
        headers: {
          'Content-Type': 'application/vnd.ni-identity.v1+json',
          'Authorization': `basic ${api_key}`,
        },
        httpsAgent,
      }
    );

    return response.data?.access_token as string;

  } catch (err: any) {
    // Handle Axios errors
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError;
      
      // Handle timeout specifically
      if (err.code === 'ECONNABORTED') {
        throw new Error('Request timed out');
      }

      const clean = {
        message: axiosError.message,
        name: axiosError.name,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        code: axiosError.code,
      };
      
      // Log the error for debugging
      console.error('Axios error:', clean);
      
      throw {
        message: `HTTP ${axiosError.response?.status || 'Unknown'}`,
        name: "AxiosError",
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      };
    }

    // Handle non-Axios errors
    const clean = {
      message: err?.message,
      name: err?.name,
      status: err?.status,
      data: err?.data,
      code: err?.code,
    };
    
    console.error('Non-Axios error:', clean);
    throw err;
  }
};