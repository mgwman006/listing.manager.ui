export type AccountState = {
    accountDetails: AccountDetailsDto | null;
    loading: boolean;
    error: string | null;
    outGoingUrl: string | null;
};

export interface AccountDetailsDto {
    id: number;
    phoneNumber: string;
    email: string;
    enabled: boolean;
    userDetails: UserDetailsDTO;
    token: string;
}

export interface UserDetailsDTO {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export type AccountAction =
    | { type: "FETCH_START" }
    | { type: "FETCH_SUCCESS"; payload: AccountDetailsDto }
    | { type: "FETCH_ERROR"; payload: string }
    | { type: "LOGOUT" }
    | { type: "APPEND_USER"; payload: string }
    | { type: "APPEND_JWT"; payload: string }
    | { type: "ADD_OUTGOING_URL"; outGoingUrl: string | null };
