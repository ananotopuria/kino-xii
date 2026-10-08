# Kino XII 🎬

A cinema discovery and ticket-booking web application built with **React, TypeScript, and Vite** as a Redberry bootcamp project. Explore films and screenings, choose seats, and follow the booking flow from seat reservation to ticket confirmation.

**[Live demo](https://kino-xii-dun.vercel.app/)** · **[Source code](https://github.com/ananotopuria/kino-xii)** · **[API documentation](https://api.kinoxii.redberryinternship.ge/docs)**

## Features

- **Movie discovery:** featured movies, Now Playing and Coming Soon sections, movie details, search, and Recently Viewed.
- **Screening discovery:** browse sessions and filter available screenings.
- **Account management:** registration, login, session restoration, and profile editing. Booking is gated by authentication and profile completion.
- **Seat selection:** API-driven auditorium layouts, seat availability, ticket types, seat-selection limits, and pricing.
- **Reservations and checkout:** temporary seat holds with a countdown, checkout form validation, booking confirmation, and recovery from reservation errors.
- **Tickets:** view purchased tickets and request refunds when the API marks an order as refundable.
- **Notifications:** authenticated users can request notifications about Coming Soon movies.

The application uses the **Kino XII API** for catalogue, sessions, authentication, reservations, orders, and tickets. It does not include its own backend.

## Tech stack

| Area                    | Technology           |
| ----------------------- | -------------------- |
| UI                      | React 19, TypeScript |
| Tooling                 | Vite 8               |
| Styling                 | Tailwind CSS 4       |
| Routing                 | React Router 7       |
| API requests            | Axios                |
| Server-state management | TanStack Query 5     |
| Forms and validation    | React Hook Form, Yup |
| Icons                   | Lucide React         |
| Deployment              | Vercel               |

## Getting started

**Prerequisites:** Node.js and npm, plus access to the Kino XII API.

```bash
git clone https://github.com/ananotopuria/kino-xii.git
cd kino-xii
npm ci
```

Create a local environment file:

```bash
cp .env.example .env
```

Set the API base URL in `.env`:

```dotenv
VITE_API_URL=https://api.kinoxii.redberryinternship.ge
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite (typically `http://localhost:5173`).

> **Note:** Vite exposes variables prefixed with `VITE_` to browser code. Never put API secrets or private credentials in these variables.

## Available commands

| Command                        | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                  | Start Vite's development server                             |
| `npm run build`                | Run TypeScript project build and generate production assets |
| `npm run preview`              | Preview the built app locally                               |
| `npm run lint`                 | Run ESLint                                                  |
| `node --test tests/*.test.mjs` | Run the repository's Node.js test files                     |

There is currently **no `npm test` script** in `package.json`.

## Application routes

| Route                  | Page                              |
| ---------------------- | --------------------------------- |
| `/`                    | Home and movie discovery          |
| `/movies/:slug`        | Movie details and screening dates |
| `/sessions`            | Screening listings and filters    |
| `/sessions/:sessionId` | Seat selection and booking        |
| `/profile`             | Profile and ticket management     |

Authentication and account-completion requirements are enforced when users enter protected flows.

## Project structure

```text
src/
├── api/          # API client and endpoint modules
├── assets/       # Application assets
├── components/   # Shared UI and feature components
├── features/     # Auth and data-fetching hooks / feature logic
├── lib/          # Shared infrastructure, including QueryClient
├── pages/        # Route-level pages
├── router/       # React Router configuration
├── types/        # TypeScript types
└── utils/        # Reusable helpers
tests/            # Node.js test files
public/           # Static public assets
vercel.json       # Vercel SPA rewrite configuration
```

## Deployment

The frontend is deployed on **Vercel**:

**https://kino-xii-dun.vercel.app/**

Deployment configuration:

- Framework preset: **Vite**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL` (pointing to the Kino XII API base URL)
- `vercel.json` contains the SPA rewrite so client-side routes work on direct navigation and refresh.

The deployed site depends on the availability of the external API.

## About

Developed by [Anano Topuria](https://github.com/ananotopuria) as a frontend bootcamp project. The application integrates the provided Kino XII API and focuses on movie discovery, stateful seat reservations, validation, and ticket management.
