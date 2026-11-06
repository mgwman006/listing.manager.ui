# LA Unit Listings

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
- `VITE_RENT_MANAGER_URL` — default post-sign-in destination used by the existing auth flow.

The unit browser calls `GET /property-manager/v1/units` with `listed=true`,
`status=AVAILABLE`, paging, sorting, and optional search filters. It expects
`ApiResponse<ListedUnitsPageDTO>` where the page has `content`, `totalElements`,
`totalPages`, `number`, and `size`.

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
