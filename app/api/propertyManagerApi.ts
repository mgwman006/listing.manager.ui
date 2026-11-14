import axios from "axios";
import { ApiResponse } from "../models/common";
import { ApiError } from "../models/error";
import {
    ListedUnitsQuery,
    PageDTO,
    UnitDetailsDTO,
} from "../models/property";


const propertyManagerApiUrl = import.meta.env.VITE_PROPERTY_MANAGER_API_URL;
const propertyManagerApiClient = axios.create({
    baseURL: `${propertyManagerApiUrl}/property-manager/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

propertyManagerApiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { message, data, statusCode } = error.response.data ?? {};
            return Promise.reject(
                new ApiError({
                    message: message ?? "SERVER_ERROR",
                    data: data ?? null,
                    statusCode: statusCode ?? error.response.status,
                }),
            );
        }

        if (error.request) {
            return Promise.reject(
                new ApiError({
                    message: "NETWORK_ERROR",
                    data: "No response from property manager service",
                    statusCode: 0,
                }),
            );
        }

        return Promise.reject(
            new ApiError({
                message: "CLIENT_ERROR",
                data: "Unexpected property manager client error",
                statusCode: 0,
            }),
        );
    },
);

export const propertyManagerApi = {

    getUnitById: async (
        unitId: number,
        signal?: AbortSignal,
    ): Promise<UnitDetailsDTO> => {
        const response = await propertyManagerApiClient.get<ApiResponse<UnitDetailsDTO>>(
            `/units/${unitId}`,
            { signal },
        );

        return handleResponse(response.data);
    },

    getUnits: async (
        query: ListedUnitsQuery,
        signal?: AbortSignal,
    ): Promise<PageDTO> => {
        const response = await propertyManagerApiClient.get<ApiResponse<PageDTO>>(
            "/units",
            { params: query, signal },
        );

        return handleResponse(response.data);
    },
};

export function handleResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message ?? "Request failed");
  }

  return response.data;
}
