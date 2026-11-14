export interface RentalProfileDetailsDTO {
    id: number;
    name: string;
    phoneNumber: string | null;
    email: string | null;
    userId: number | null;
    organizationId: number | null;
    type: RentalProfileType;
    viewingServiceFee: number;
    rentReceivingAccount: RentReceivingAccountDetailsDTO;
}

export interface RentReceivingAccountDetailsDTO {
    id: number;
    accountNumber: string;
    bankName: string;
    mobileMoneyNumber: string | null;
    mobileMoneyProvider: MobileMoneyProvider | null;
    paymentMethod: PaymentMethod;
    isDefault: boolean;
}

export enum RentalProfileType {
    INDIVIDUAL = "INDIVIDUAL",
    BUSINESS = "BUSINESS",
    ENTERPRISE = "ENTERPRISE"
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  MOBILE_MONEY = "MOBILE_MONEY"
}

export enum MobileMoneyProvider
{
  MIX_BY_YAS = "MIX_BY_YAS",
  MPESA = "MPESA",
  AIRTEL_MONEY = "AIRTEL_MONEY",
  HALOPESA = "HALOPESA"
}