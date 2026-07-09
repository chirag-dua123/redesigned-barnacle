# AeroCommand

AeroCommand is an airport operations dashboard built with Node.js, Express, MongoDB, and EJS. The system is meant to support staff who manage flights, gates, and refueling activity through authenticated and role-protected workflows.

This README is now the single source of truth for the repo. It replaces the old split between a lightweight project description and a separate checklist.

## Project Objective

Build a working MVC-style application that can:

1. register airport staff users
2. authenticate them with JWT-based sessions
3. protect routes with authentication middleware
4. enforce role-based authorization
5. manage flights and gate assignments
6. log refueling operations
7. render server-side dashboards with EJS and hand-written CSS

The project should be built in a stable order. Infrastructure, schema consistency, and auth come before UI.

## Current Repository State

The repository is now feature-complete across all ten phases:

- `bin/seed.js` — seed script for flights, gates, and users
- `bin/verify.js` — automated Phase 9 verification suite
- `config/db.js` — MongoDB connection helper (wired into `index.js`)
- `index.js` — Express entry point with DB startup
- `.env.example`
- `controllers/authController.js` — register / login / logout
- `controllers/trafficController.js` — flight listing and status updates
- `controllers/groundController.js` — gate matrix, gate assignment, refueling
- `middleware/authMiddleware.js` — JWT cookie verification
- `middleware/roleMiddleware.js` — RBAC guard
- `middleware/errorHandler.js` — centralized error handler
- `middleware/validateRequest.js` — reusable validation helpers
- `models/user.js`
- `models/flight.js`
- `models/gate.js`
- `models/fuel_log.js`
- `routes/authRoutes.js`
- `routes/trafficRoutes.js`
- `routes/groundRoutes.js`
- `routes/viewRoutes.js`
- `views/login.ejs` — login and registration page
- `views/dashboard-atc.ejs` — ATC controller dashboard
- `views/dashboard-ground.ejs` — ground staff dashboard
- `views/partials/header.ejs`
- `views/partials/navbar.ejs`
- `views/partials/footer.ejs`
- `public/css/output.css` — design system stylesheet
- `public/js/login.js` — client-side auth handling
- `public/js/dashboard-atc.js` — live flight board and status updates
- `public/js/dashboard-ground.js` — live gate matrix, assignment, and refueling
- `tailwind.config.js`
- `postcss.config.js`
- `README.md`

## Target Architecture

```text
probable-fishstick/
|-- bin/
|   |-- seed.js
|   `-- verify.js
|-- config/
|   `-- db.js
|-- controllers/
|   |-- authController.js
|   |-- trafficController.js
|   `-- groundController.js
|-- middleware/
|   |-- authMiddleware.js
|   |-- roleMiddleware.js
|   |-- errorHandler.js
|   `-- validateRequest.js
|-- models/
|   |-- user.js
|   |-- flight.js
|   |-- gate.js
|   `-- fuel_log.js
|-- routes/
|   |-- authRoutes.js
|   |-- trafficRoutes.js
|   |-- groundRoutes.js
|   `-- viewRoutes.js
|-- public/
|   |-- css/
|   |   `-- output.css
|   `-- js/
|       |-- login.js
|       |-- dashboard-atc.js
|       `-- dashboard-ground.js
|-- views/
|   |-- partials/
|   |   |-- header.ejs
|   |   |-- navbar.ejs
|   |   `-- footer.ejs
|   |-- login.ejs
|   |-- dashboard-atc.ejs
|   `-- dashboard-ground.ejs
|-- .env
|-- .env.example
|-- index.js
|-- package.json
|-- tailwind.config.js
|-- postcss.config.js
`-- README.md
```

## Baseline Technical Decisions

These decisions should stay fixed unless there is a deliberate requirement change.

### 1. Entry Point

Use `index.js` as the entry point. Do not document `server.js` unless that file actually exists.

### 2. Password Hashing Library

The repo uses `bcrypt`. The user model imports `bcrypt` and hashes passwords in a pre-save hook.

### 3. Role Names

Use explicit domain roles:

- `controller`
- `ground_staff`

Do not mix these with generic role names like `user` and `admin` unless a real admin role is added later.

### 4. Auth Strategy

Start simple:

- `register` creates a user
- `login` verifies credentials and sets an HTTP-only JWT cookie
- `logout` clears that cookie

Do not add refresh tokens in the first pass. Refresh tokens require extra design:

- refresh endpoint
- expiry policy
- storage or revocation strategy
- consistent cookie rules

### 5. File Naming

Keep filenames and imports lowercase so the app behaves the same on Windows, Linux, and cloud hosts.

## Getting Started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)

### Installation

```bash
git clone <repo-url>
cd probable-fishstick
npm install
```

### Configuration

Create a root `.env` file (see `.env.example`):

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/aerocommand?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_real_secret_at_least_32_chars
NODE_ENV=development
```

### Seed the Database

```bash
npm run seed
```

This creates:

- 4 flights (AC101, AC202, AC303, AC404)
- 5 gates (A1, A2, B1, B2, C1) with pre-assigned flights
- 2 users:
  - **Controller:** `controller@aerocommand.local` / `Password123!`
  - **Ground staff:** `ground@aerocommand.local` / `Password123!`

### Start the Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the login page.

### Run Verification

With the server running in another terminal:

```bash
npm run verify
```

This exercises every Phase 9 checklist item end-to-end.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Server port (default: 3000) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (≥ 32 chars) |
| `NODE_ENV` | No | `development` or `production` |

## Data Model Plan

### User

- `name`: string, required
- `email`: string, required, unique, lowercase, trimmed
- `password`: string, required, hashed in a pre-save hook
- `role`: string, enum: `["controller", "ground_staff"]`

Notes:

- Keep password hashing in the model hook, not the controller.
- Never return the stored password hash in API responses.
- This repo uses `name` only for now. Add `username` later only if the product actually needs a separate login/display identifier.

### Flight

- `flightNumber`: string, required, unique
- `airline`: string, required
- `origin`: string, required
- `destination`: string, required
- `status`: string, enum: `["scheduled", "boarding", "departed", "arrived", "cancelled"]`
- `eta`: Date, required
- `etd`: Date, required
- `passengerCount`: number, required, min: 0

### Gate

- `gateId`: string, required, unique
- `terminal`: string, required
- `status`: string, enum: `["available", "occupied", "maintenance"]`
- `currentFlight`: ObjectId ref to Flight, default: null

### Fuel Log

- `flightId`: ObjectId ref to Flight, required
- `gallonsFueled`: number, required, min: 0
- `loggedBy`: string, required (plain string for now)
- `timestamp`: Date, default: now

## API Plan

### Authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Create a user account |
| `POST` | `/api/auth/login` | Verify credentials and set auth cookie |
| `POST` | `/api/auth/logout` | Clear auth cookie |

### Traffic

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/traffic/flights` | Fetch flight data |
| `PATCH` | `/api/traffic/status/:id` | Update flight status |

### Ground Operations

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/ground/gates` | Fetch gate data |
| `POST` | `/api/ground/assign-gate` | Assign a gate to a flight |
| `POST` | `/api/ground/refuel` | Record a refueling action |

### API Response Format

All API responses use a consistent envelope:

```json
{
  "success": true,
  "message": "Description of what happened",
  "data": "..."
}
```

Error responses include `"success": false` and an appropriate HTTP status code.

## NPM Scripts

| Script | Command | Purpose |
| --- | --- | --- |
| `npm run dev` | `nodemon index.js` | Start with auto-reload |
| `npm start` | `node index.js` | Production start |
| `npm run seed` | `node bin/seed.js` | Seed the database |
| `npm run verify` | `node bin/verify.js` | Run Phase 9 verification |
| `npm run build:css` | `tailwindcss -i ...` | Rebuild Tailwind CSS |

## Master Checklist

This is the working checklist for the entire repo.

### Phase 1: Bootstrap and Cleanup

- [x] Keep `index.js` as the only documented app entry point
- [x] Remove stale `server.js` references from docs and comments
- [x] Add `app.use(express.json())`
- [x] Add `app.use(express.urlencoded({ extended: true }))`
- [x] Add `app.use(cookieParser())`
- [x] Keep `/ping` as a simple health route
- [x] Add a 404 handler after all mounted routes
- [x] Add centralized error middleware after the 404 handler
- [x] Create `.env.example`
- [x] Create missing folders: `routes/`, `views/`, `views/partials/`, `public/css/`, `public/js/`

### Phase 2: Model and Schema Cleanup

- [x] Fix the `bcrypt` vs `bcryptjs` mismatch
- [x] Standardize user roles to `controller` and `ground_staff`
- [x] Decide whether to keep only `name` or add `username`
- [x] Ensure `email` is unique, lowercase, and trimmed
- [x] Keep password hashing inside the user model
- [x] Add timestamps where audit history is useful
- [x] Review whether `FuelLog.loggedBy` should remain a string
- [x] Confirm the flight status enum matches controller and UI expectations

### Phase 3: Auth Controllers

- [x] Consolidate auth logic into `controllers/authController.js`
- [x] Remove or ignore empty split auth files if they will not be used
- [x] Implement `register`
- [x] Validate request body fields
- [x] Reject duplicate email addresses
- [x] Create the user through the Mongoose model
- [x] Exclude password hashes from responses
- [x] Implement `login`
- [x] Find the user by email
- [x] Compare plaintext password to the stored hash
- [x] Sign a JWT using `JWT_SECRET`
- [x] Set an HTTP-only cookie on successful login
- [x] Return only safe user fields
- [x] Implement `logout`
- [x] Clear the auth cookie with matching cookie options

### Phase 4: Auth Middleware and RBAC

- [x] Create `middleware/authMiddleware.js`
- [x] Read the token from `req.cookies`
- [x] Verify the JWT
- [x] Load the user from the database
- [x] Attach sanitized user data to `req.user`
- [x] Return HTTP 401 for missing tokens
- [x] Return HTTP 401 for invalid tokens
- [x] Create `middleware/roleMiddleware.js`
- [x] Export `checkRole(allowedRoles)`
- [x] Return HTTP 403 for authenticated users without permission

### Phase 5: API Routes

- [x] Create `routes/authRoutes.js`
- [x] Add `POST /api/auth/register`
- [x] Add `POST /api/auth/login`
- [x] Add `POST /api/auth/logout`
- [x] Create `routes/trafficRoutes.js`
- [x] Add `GET /api/traffic/flights`
- [x] Add `PATCH /api/traffic/status/:id`
- [x] Protect traffic mutation routes with auth and role middleware
- [x] Create `routes/groundRoutes.js`
- [x] Add `GET /api/ground/gates`
- [x] Add `POST /api/ground/assign-gate`
- [x] Add `POST /api/ground/refuel`
- [x] Mount all route groups in `index.js`

### Phase 6: Domain Controllers

- [x] Create `controllers/trafficController.js`
- [x] Implement `getAllFlights`
- [x] Implement `updateFlightStatus`
- [x] Validate requested status values before updating
- [x] Create `controllers/groundController.js`
- [x] Implement `getGateMatrix`
- [x] Implement `assignGateToFlight`
- [x] Check gate availability before assignment
- [x] Update both related records consistently where required
- [x] Implement `logRefueling`
- [x] Confirm the target flight exists before writing a fuel log

### Phase 7: Seed Data

- [x] Keep `bin/seed.js` for gates and flights
- [x] Add seed users for both roles
- [x] Create seed users through the `User` model so password hashing runs
- [x] Ensure the seed script clears only intended collections
- [x] Ensure the seed script closes the database connection cleanly

### Phase 8: Views and Styling

- [x] Configure EJS as the view engine
- [x] Serve static files from `public/`
- [x] Add Tailwind config files
- [x] Add `public/css/input.css`
- [x] Generate `public/css/output.css`
- [x] Create `views/partials/header.ejs`
- [x] Create `views/partials/navbar.ejs`
- [x] Create `views/partials/footer.ejs`
- [x] Create `views/login.ejs`
- [x] Create `views/dashboard-atc.ejs`
- [x] Create `views/dashboard-ground.ejs`
- [x] Create `routes/viewRoutes.js`
- [x] Protect dashboard routes with auth middleware
- [x] Render the correct dashboard for the logged-in role

### Phase 9: Validation and Error Handling

- [x] Add consistent API error responses
- [x] Add final Express error middleware
- [x] Verify `/ping` works
- [x] Verify registration works for a new user
- [x] Verify duplicate registration is rejected
- [x] Verify login works with valid credentials
- [x] Verify login fails with invalid credentials
- [x] Verify protected routes reject requests without a valid cookie
- [x] Verify role-protected routes reject the wrong role
- [x] Verify gate assignment persists correctly
- [x] Verify fuel log creation persists correctly

### Phase 10: Documentation and Deployment Readiness

- [x] Keep README aligned with the actual folder structure
- [x] Keep role names consistent across docs and code
- [x] Keep endpoint names consistent across docs and code
- [x] Keep dependencies aligned with imports
- [x] Verify the app starts from a clean install
- [x] Check for Linux-safe filename casing
#   r e d e s i g n e d - b a r n a c l e  
 #   r e d e s i g n e d - b a r n a c l e  
 