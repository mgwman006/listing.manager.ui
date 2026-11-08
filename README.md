# Tante Property Listings

Public-facing rental listings with filters, pagination, and authenticated viewing requests.

## Run locally

```sh
npm install
npm run dev
```

Configure these Vite environment variables before starting the app:

- `VITE_PROPERTY_MANAGER_API_URL` — property-manager service origin.
- `VITE_RENT_MANAGER_API_URL` — rent-manager service origin.
- `VITE_AUTH_URL` — sign-in page URL.
- `VITE_RENT_MANAGER_URL` — default post-sign-in destination for the rent-manager authentication flow.
- `VITE_TENANT_UI_URL` — destination for the tenant app link in the shared navigation.
- `VITE_AGENT_LANDLORD_UI_URL` — destination for the agent/landlord app link in the shared navigation.

The unit browser calls `GET /property-manager/v1/units` with
`isListed=true`, `status=AVAILABLE`, paging, sorting, and optional search filters.

The page response is `ApiResponse<ListedUnitsPageDTO>` with `items`, `page`,
`size`, `totalElements`, `totalPages`, `hasNext`, and `hasPrevious`. The UI
normalizes this response for rendering. Unit details load from
`GET /property-manager/v1/units/{unitId}`; the endpoint returns details only for
listed units. Agency details (called rental profiles internally by the
services) are fetched from the rent-manager when the renter is signed in.

Viewing requests require a signed-in renter and call
`POST /rent-manager/v1/viewings/bookings` with a bearer token. The frontend
currently sends `{ unitId, startTime, endTime, notes }`, with date-times formatted
as local ISO date-time strings (no timezone suffix). Confirm these request field
names and the page DTO against the service contracts when they are finalized.

## Validate

```sh
npm run build
npx tsc --noEmit
```
