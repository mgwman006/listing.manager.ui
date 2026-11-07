export interface AddressDTO {
    postalCode?: number;
    streetNumber?: number;
    streetName?: string;
    ward?: string;
    city?: string;
    region?: string;
    country?: string;
    displayName?: string;
}

export interface ListedUnitDTO {
    id: number;
    unitNumber: string;
    rentalProfileId: number;
    numberOfBedrooms: number;
    numberOfBathrooms: number;
    numberParkingSpots: number;
    rentAmount: number;
    type: UnitType;
    status?: UnitStatus | null;
    size?: number;
    roomSize?: number;
    sizeUnit: string;
    buildingId: number;
    listed?: boolean;
    description?: string;
    listingTitle?: string;
    buildingName?: string;
    propertyName?: string;
    address?: AddressDTO;
    propertyAddress?: AddressDTO;
    location?: { address?: AddressDTO };
    building?: {
        name?: string;
        property?: { name?: string; location?: { address?: AddressDTO } };
    };
    property?: { name?: string; location?: { address?: AddressDTO } };
    images?: Array<{ id: number; imageUrl?: string; url?: string }>;
}

export interface ListedUnitsPageDTO {
    content: ListedUnitDTO[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ListedUnitsQuery {
    page: number;
    size: number;
    sortBy: "rentAmount";
    direction: "asc" | "desc";
    listed?: boolean;
    status?: UnitStatus;
    type?: UnitType;
    city?: string;
    minBedrooms?: number;
    minRent?: number;
    maxRent?: number;
    query?: string;
}

export interface CreateViewingBookingDTO {
    unitId: number;
    startTime: string;
    endTime: string;
    notes?: string;
}

export interface ViewingBookingDetailsDTO {
    id: number;
    rentalProfileId: number;
    propertyId: number;
    startTime: string;
    endTime: string;
    requesterUserId: number;
    status: string;
    serviceFee: number;
    feePaid: boolean;
    notes?: string;
}

export enum UnitType {
    FLAT = "FLAT",
    HOUSE = "HOUSE",
    ROOM = "ROOM",
    OFFICE = "OFFICE",
    SHOP = "SHOP",
}

export enum UnitStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    MAINTENANCE = "MAINTENANCE",
    RESERVED = "RESERVED",
}
