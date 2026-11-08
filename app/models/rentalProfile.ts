export interface RentalProfileDetailsDTO {
    id: number;
    name: string;
    phoneNumber: string | null;
    email: string | null;
    userId: number | null;
    organizationId: number | null;
    type: RentalProfileType;
}

export enum RentalProfileType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS",
    ENTERPRISE = "ENTERPRISE"
}
