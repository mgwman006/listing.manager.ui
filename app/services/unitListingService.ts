import { NotificationInstance } from "antd/es/notification/interface";
import { propertyManagerApi } from "../api/propertyManagerApi";
import { viewingApi } from "../api/api";
import { rentalProfileApi } from "../api/api";
import {
    CreateViewingBookingDTO,
    ListedUnitsQuery,
    PageDTO,
    PropertySummaryDTO,
    UnitDetailsDTO,
    ViewingBookingDetailsDTO,
} from "../models/property";
import { ApiError } from "../models/error";
import { RentalProfileDetailsDTO } from "../models/rentalProfile";

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

export const getPaginatedUnits = async (
    query: ListedUnitsQuery,
    signal: AbortSignal,
): Promise<PageDTO> => propertyManagerApi.getUnits(query, signal);

export const getUnitById = (unitId: number, signal?: AbortSignal) =>propertyManagerApi.getUnitById(unitId, signal);


export const getRentalProfileById = (
    rentalProfileId: number,
    token: string,
): Promise<RentalProfileDetailsDTO> => rentalProfileApi.getById(rentalProfileId, token);

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
