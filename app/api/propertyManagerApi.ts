import axios from "axios";
import { ApiResponse } from "../models/common";
import { ApiError } from "../models/error";
import { ListedUnitDTO, ListedUnitsPageDTO, ListedUnitsQuery } from "../models/property";

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const readUnits = (page: Record<string, unknown>): ListedUnitDTO[] | undefined => {
    const units = page.content ?? page.units ?? page.listedUnits ?? page.items ?? page.results;
    if (!Array.isArray(units)) return undefined;
    return units as ListedUnitDTO[];
};

const normalizeListedUnitsPage = (
    payload: unknown,
    requestedPage: number,
    requestedSize: number,
): ListedUnitsPageDTO => {
    if (!isRecord(payload)) {
        throw new ApiError({
            message: "INVALID_LISTING_RESPONSE",
            data: "The property manager returned an invalid listings page.",
            statusCode: 0,
        });
    }

    const nestedPage = isRecord(payload.page) ? payload.page : undefined;
    const content = readUnits(payload) ?? (nestedPage && readUnits(nestedPage));
    if (!content) {
        throw new ApiError({
            message: "INVALID_LISTING_RESPONSE",
            data: "The listings response must include a content, units, items, or results array.",
            statusCode: 0,
        });
    }

    const totalElements = Number(
        payload.totalElements ?? payload.totalItems ?? payload.total ?? nestedPage?.totalElements,
    );
    const totalPages = Number(payload.totalPages ?? nestedPage?.totalPages);
    const number = Number(
        payload.number
            ?? payload.pageNumber
            ?? (typeof payload.page === "number" ? payload.page : nestedPage?.number),
    );
    const size = Number(payload.size ?? payload.pageSize ?? nestedPage?.size);

    return {
        content,
        totalElements: Number.isFinite(totalElements) ? totalElements : content.length,
        totalPages: Number.isFinite(totalPages)
            ? totalPages
            : Math.ceil(content.length / requestedSize),
        number: Number.isFinite(number) ? number : requestedPage,
        size: Number.isFinite(size) ? size : requestedSize,
    };
};

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
    getListedUnits: async (
        query: ListedUnitsQuery,
        signal?: AbortSignal,
    ): Promise<ListedUnitsPageDTO> => {
        const response = await propertyManagerApiClient.get<ApiResponse<unknown>>(
            "/units",
            { params: query, signal },
        );

        if (!response.data.success) {
            throw new ApiError({
                message: response.data.message ?? "UNIT_RETRIEVAL_FAILED",
                data: null,
                statusCode: response.status,
            });
        }

        return normalizeListedUnitsPage(response.data.data, query.page, query.size);
    },
};
