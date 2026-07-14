# AeroCommand

AeroCommand is an airport operations dashboard built with Node.js, Express, MongoDB, and EJS. It supports authenticated, role-based workflows for air traffic controllers and ground staff.

## Features

- JWT cookie-based authentication (register/login/logout)
- Role-based access control (`controller`, `ground_staff`)
- Flight status management
- Gate assignment and gate matrix view
- Refueling log tracking
- Server-rendered EJS dashboards

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- EJS
- Tailwind CSS

## Project Structure

```text
/home/runner/work/redesigned-barnacle/redesigned-barnacle
├── bin/
│   ├── seed.js
│   ├── start-in-memory.js
│   └── verify.js
├── config/
│   └── db.js
├── controllers/
├── middleware/
├── models/
├── public/
│   ├── css/
│   └── js/
├── routes/
├── views/
│   └── partials/
├── index.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/aerocommand?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_real_secret_at_least_32_chars
NODE_ENV=development
```

### Seed Data

```bash
npm run seed
```

### Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

### Verification Script

With the server running in another terminal:

```bash
npm run verify
```

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Traffic

- `GET /api/traffic/flights`
- `PATCH /api/traffic/status/:id`

### Ground

- `GET /api/ground/gates`
- `POST /api/ground/assign-gate`
- `POST /api/ground/refuel`

## NPM Scripts

- `npm run dev` — Start with nodemon
- `npm start` — Start in production mode
- `npm run seed` — Seed flights, gates, and users
- `npm run verify` — Run verification checks
- `npm run build:css` — Build Tailwind CSS output

## Notes

- `npm test` is currently a placeholder and exits with an error by default.
- If `npm run build:css` fails with `tailwindcss: not found`, run `npm install` first.
