
export interface LocationDetailsDTO{
  latitude:number,
  longitude:number,
  address:AddressDTO
}

export interface UnitImageDTO {
  id: number;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  primaryImage: boolean;
}

export interface AddressDTO {
    postalCode?: number;
    streetNumber?: number;
    streetName?: string;
    ward?: string;
    city?: string;
    region?: string;
    country?: string;
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
    status?: UnitStatus | null;
    roomSize?: number;
    sizeUnit: string;
    isListed?: boolean;
    building:BuildingSummaryDTO;
    floorNumber: number;
    images?: UnitImageDTO[];
}

export interface UnitSummaryDTO{
  id : number;
  unitNumber : string;
  numberOfBedrooms: number;
  numberOfBathrooms: number;
  numberParkingSpots: number;
  rentAmount: number;
  type: UnitType;
  status: UnitStatus;
  roomSize: number;
  sizeUnit: string;
  isListed : boolean;
  buildingId: number;
  propertyName: string;
  location: LocationDetailsDTO;
  floorNumber: number;
  images?: UnitImageDTO[];
}

export interface BuildingSummaryDTO{
  id:number;
  name:string,
  number:number,
  code:string,
  description:string,
  numberOfFloors: number,
  property:PropertySummaryDTO
}

export interface PropertySummaryDTO{
  id:number,
  name:string,
  code:string,
  description:string,
  landSize:number,
  landSizeUnit:string,
  location:LocationDetailsDTO,
  type:PropertyType,
  developmentStatus:DevelopmentStatus,
  images:Array<PropertyImageDTO>
}

export interface PropertyImageDTO {
  id: number;
  url: string;
  fileName: string;
  contentType: string;
  size: number;
  primaryImage: boolean;
}





// export interface BuildingDetailsDTO {
//     id: number;
//     propertyId: number;
//     name: string;
//     number: number;
//     code: string;
//     description: string;
//     numberOfFloors: number;
//     units: ListedUnitDTO[];
// }

// export interface PropertyDetailsDTO {
//     id: number;
//     code: string;
//     description: string;
//     name: string;
//     landSize: number;
//     landSizeUnit: string;
//     type: string;
//     developmentStatus: string;
//     location?: {
//         latitude?: number;
//         longitude?: number;
//         address?: AddressDTO;
//     };
//     buildings: BuildingDetailsDTO[];
//     images?: Array<{ id: number; url?: string; fileName?: string }>;
// }

export interface PageDTO {
    items: UnitSummaryDTO[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface ListedUnitsQuery {
    page: number;
    size: number;
    sortBy: "rentAmount";
    direction: "asc" | "desc";
    isListed?: boolean;
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

export enum PropertyStatus
{
  ACTIVE = "Active",
  INACTIVE = "Inactive"
}
export enum DevelopmentStatus
{
  PLANNING = "Planning",
  UNDER_CONSTRUCTION = "Under Construction",
  COMPLETED = "Completed",
  OPERATIONAL = "Operational"
}

export enum PropertyType
{
  LAND = "Land",
  STAND_ALONE_HOUSE = "Stand Alone House",
  APARTMENTS_BUILDING = "Apartments Building",
  COMPOUND = "Compound",
  COMPLEX = "Complex"
}