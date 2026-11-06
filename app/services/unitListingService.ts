import { NotificationInstance } from "antd/es/notification/interface";
import { propertyManagerApi } from "../api/propertyManagerApi";
import { viewingApi } from "../api/api";
import {
    CreateViewingBookingDTO,
    ListedUnitsPageDTO,
    ListedUnitsQuery,
    ViewingBookingDetailsDTO,
} from "../models/property";
import { ApiError } from "../models/error";

const notifyApiError = (
    notificationApi: NotificationInstance,
    error: unknown,
    title: string,
    fallback: string,
) => {
    const apiError = error instanceof ApiError ? error : null;
    const details = apiError?.details;
    notificationApi.error({
        title: apiError?.message ?? title,
        description: details
            ? typeof details === "string"
                ? details
                : JSON.stringify(details)
            : fallback,
    });
};

export const getListedUnits = async (
    query: ListedUnitsQuery,
    signal: AbortSignal,
): Promise<ListedUnitsPageDTO> => propertyManagerApi.getListedUnits(query, signal);

export const createViewingBooking = async (
    request: CreateViewingBookingDTO,
    token: string,
    notificationApi: NotificationInstance,
): Promise<ViewingBookingDetailsDTO | null> => {
    try {
        return await viewingApi.createBooking(request, token);
    } catch (error: unknown) {
        notifyApiError(
            notificationApi,
            error,
            "Unable to request a viewing",
            "Please try again in a moment.",
        );
        return null;
    }
};
