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

The unit browser calls `GET /property-manager/v1/units` with paging, sorting, and
optional search filters. For testing, it omits `listed` and `status` so the
property-manager service returns listed and unlisted units across all statuses.
The service treats an omitted `listed` filter as unrestricted; explicit
`listed=true` or `listed=false` still filters results.

The page response is `ApiResponse<ListedUnitsPageDTO>` with `items`, `page`,
`size`, `totalElements`, `totalPages`, `hasNext`, and `hasPrevious`. The UI
normalizes this response for rendering. Remove the unrestricted behavior before
making this endpoint available as a production public listing feed.

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
