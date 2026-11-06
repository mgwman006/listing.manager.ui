export interface PropertyCreateDTO {
  description?: string;
  createdByUserId: number;
  name: string;
  landSize?: number | null;
  landSizeUnit?: string | null;
  location: LocationCreateDTO;
  type: PropertyType;
  numberOfBuildings: number;
  developmentStatus?: DevelopmentStatus;
}

export interface LocationCreateDTO {
  name?: string;
  latitude: number;
  longitude: number;
  address: AddressDTO;
}

export interface AddressDTO {
  postalCode: number;
  streetNumber: number;
  streetName: string;
  ward: string;
  city: string;
  region: string;
  country: string;
}

export enum DevelopmentStatus {
  PLANNING = "PLANNING",
  UNDER_CONSTRUCTION = "UNDER_CONSTRUCTION",
  COMPLETED = "COMPLETED",
  OPERATIONAL = "OPERATIONAL",
}

export enum PropertyType {
  STAND_ALONE_HOUSE = "STAND_ALONE_HOUSE",
  APARTMENTS_BUILDING = "APARTMENTS_BUILDING",
  COMPOUND = "COMPOUND",
  COMPLEX = "COMPLEX",
}

export interface UnitDetailsDTO {
  id: number;
  unitNumber: string;
  rentalProfileId: number;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberParkingSpots: number;
  rentAmount: number;
  type: UnitType;
  status: UnitStatus;
  roomSize: number;
  sizeUnit: string;
  buildingId: number;
}

export interface ListedUnitDTO extends UnitDetailsDTO {
  listed?: boolean;
  description?: string;
  listingTitle?: string;
  buildingName?: string;
  propertyName?: string;
  address?: Partial<AddressDTO> & { displayName?: string };
  propertyAddress?: Partial<AddressDTO> & { displayName?: string };
  location?: Partial<LocationDetailsDTO> & {
    address?: Partial<AddressDTO> & { displayName?: string };
  };
  building?: {
    name?: string;
    property?: {
      name?: string;
      location?: Partial<LocationDetailsDTO> & {
        address?: Partial<AddressDTO> & { displayName?: string };
      };
    };
  };
  property?: {
    name?: string;
    location?: Partial<LocationDetailsDTO> & {
      address?: Partial<AddressDTO> & { displayName?: string };
    };
  };
  images?: string[];
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
  listed: boolean;
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

export interface UnitCreateDTO {
  rentalProfileId: number;
  unitNumber: string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberParkingSpots: number;
  rentAmount: number;
  type: UnitType;
  roomSize: number;
  sizeUnit: string;
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

export interface BuildingDetailsDTO {
  id: number;
  code: string;
  name: string;
  description: string;
  propertyId: number;
  units: UnitDetailsDTO[];
}

export interface PropertyDetailsDTO {
  id: number;
  code: string;
  description: string;
  name: string;
  landSize: number;
  landSizeUnit: string;
  type: string;
  developmentStatus: string;
  location: LocationDetailsDTO;
  buildings: BuildingDetailsDTO[];
}

export interface LocationDetailsDTO {
  latitude: number;
  longitude: number;
  address: AddressDTO;
}
