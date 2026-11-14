import axios from "axios";
import { ApiResponse } from "../models/common";
import { ApiError } from "../models/error";
import { CreateViewingBookingDTO, ViewingBookingDetailsDTO } from "../models/property";
import { RentalProfileDetailsDTO } from "../models/rentalProfile";
import { navigateToAuth } from "../utilities/auth";
import { ACCOUNT_STORAGE_KEY } from "../utilities/constant";
import { removeFromLocalStorage } from "../utilities/localStorage";

const apiUrl = import.meta.env.VITE_RENT_MANAGER_API_URL;
let authRedirectInProgress = false;

export const apiClient = axios.create({
    baseURL: `${apiUrl}/rent-manager/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            if (error.response.status === 401 && !authRedirectInProgress) {
                authRedirectInProgress = true;
                removeFromLocalStorage(ACCOUNT_STORAGE_KEY);
                navigateToAuth("rent-manager", undefined, window.location.href);
            }

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
                    data: "No response from rent manager service",
                    statusCode: 0,
                }),
            );
        }

        return Promise.reject(
            new ApiError({
                message: "CLIENT_ERROR",
                data: "Unexpected rent manager client error",
                statusCode: 0,
            }),
        );
    },
);

export const viewingApi = {
    createBooking: async (
        requestBody: CreateViewingBookingDTO,
        token: string,
    ): Promise<ViewingBookingDetailsDTO> => {
        const response = await apiClient.post<ApiResponse<ViewingBookingDetailsDTO>>(
            "/viewings/bookings",
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!response.data.success) {
            throw new ApiError({
                message: response.data.message ?? "VIEWING_REQUEST_FAILED",
                data: null,
                statusCode: response.status,
            });
        }

        return response.data.data;
    },
};

export const rentalProfileApi = {
    getById: async (
        rentalProfileId: number,
        token: string,
    ): Promise<RentalProfileDetailsDTO> => {
        const response = await apiClient.get<ApiResponse<RentalProfileDetailsDTO>>(
            `/rentalprofiles/${rentalProfileId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        if (!response.data.success) {
            throw new ApiError({
                message: response.data.message ?? "RENTAL_PROFILE_RETRIEVAL_FAILED",
                data: null,
                statusCode: response.status,
            });
        }

        return response.data.data;
    },
};
