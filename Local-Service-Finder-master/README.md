# Instavaliable — Local Services · On Demand

![Instavaliable Logo](./client/src/assets/logo.jpeg)

**Instavaliable** is an on-demand local services marketplace connecting customers with nearby freelancers, skilled tradesmen, and service professionals. 

Designed for speed, trust, and flexibility, Instavaliable removes payment gateway friction by integrating direct **WhatsApp click-to-chat** booking enquiries, transparent pricing, unique **Request IDs** (`INS-2026-XXXXXX`), and real-time **Socket.io** status alerts.

---

## Brand & Core Pillars

Instavaliable brings together four key pillars:

1. **Freelancers (Earn)**: Independent digital and creative service providers offering flexible services.
2. **Professionals (Grow)**: Verified tradesmen, plumbers, electricians, carpenters, and technicians expanding their local reach.
3. **Customers (Get Service)**: Effortless service discovery with no upfront payment gateway hurdles.
4. **Nearby (Fast & Easy)**: Localized matching and instant communication via WhatsApp and real-time alerts.

**Color Identity:**
- Primary Green: `#10B981` (Emerald)
- Secondary Blue: `#2563EB` (Royal Blue)
- Dark Slate / Navy: `#0B1020` & `#0F172A`
- Crisp Accents: `#F8FAFC`, `#FFFFFF`, `#E2E8F0`

---

## Key Features

- **Unique Request ID Format**: Every booking receives an auto-generated identifier in the format `INS-2026-000123`.
- **WhatsApp Click-to-Chat Integration**: 1-click WhatsApp buttons with pre-filled message templates detailing the request ID, service title, customer name, date/time, and notes.
- **Zero Payment Gateway Lock-In**: Customers and professionals communicate and coordinate scope and payments directly.
- **Real-Time Push Alerts (Socket.io)**: Instant audio-visual notifications on incoming requests (`new_booking`) and status changes (`booking_status`).
- **Role-Based Access Control**:
  - **Customer (Client)**: Search services, auto-detect location, create bookings, chat via WhatsApp, track booking status.
  - **Freelancer / Professional (Worker)**: Manage services, receive instant requests, update status (accepted, rejected, completed), contact clients directly.
  - **Admin**: Platform oversight, user management, worker verification, booking audit logs, and analytics.

---

## Tech Stack

### Backend
- **Node.js** & **Express 4.18**
- **MongoDB** & **Mongoose 8**
- **JWT Authentication** (`jsonwebtoken`)
- **Socket.io 4.8** (Real-time events)
- **bcryptjs** (Password hashing)
- **express-validator** (Request validation)

### Frontend
- **React 18** + **Vite 5**
- **Tailwind CSS 3.3**
- **Zustand** (Authentication state management)
- **Axios** (API requests with JWT interceptor)
- **Socket.io-client 4.8**
- **lucide-react** (Modern iconography)
- **react-hot-toast** (Live feedback & alerts)

---

## Project Structure

```
Local-Service-Finder-master/
├── client/                      # React Frontend (Vite)
│   ├── public/
│   │   ├── logo.jpeg            # Official Instavaliable brand logo
│   │   └── favicon.ico
│   ├── src/
│   │   ├── assets/              # Logo and brand images
│   │   ├── components/          # Reusable UI (Logo, WhatsAppButton, etc.)
│   │   ├── layouts/             # PublicLayout, DashboardLayout
│   │   ├── pages/               # Home, Services, ServiceDetail, Auth, Dashboards
│   │   ├── services/            # API & Socket client configuration
│   │   ├── store/               # Zustand authStore
│   │   └── utils/               # WhatsApp helper, date/currency formatters
│   └── tailwind.config.js
└── server/                      # Express Backend
    ├── config/                  # Database connection (Mongoose)
    ├── controllers/             # Auth, Service, Booking, Worker, Admin controllers
    ├── middleware/              # Auth, Role, Validation, Error handlers
    ├── models/                  # User, WorkerProfile, Service, Booking
    ├── routes/                  # Express API routes
    ├── seed/                    # Admin initialization script
    └── server.js                # Express & Socket.io server entry point
```

---

## Quick Start & Setup

### 1. Prerequisites
- **Node.js**: v18.x or later
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI

### 2. Backend Setup
```bash
cd server
npm install
```

Configure `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/instavaliable
JWT_SECRET=instavaliable_secure_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
NODE_ENV=development
WHATSAPP_BUSINESS_NUMBER=+1234567890
```

Seed the default Admin account:
```bash
node seed/createAdmin.js
```
> Default Admin credentials: `admin@instavaliable.com` / `admin123`

Start backend server:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
```

Configure `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WHATSAPP_NUMBER=+1234567890
```

Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:3000` (or the Vite dev server port shown).

---

## API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Create client or worker account
- `POST /api/auth/login` — Sign in and obtain JWT
- `GET /api/auth/me` — Get authenticated user details

### Services (`/api/services`)
- `GET /api/services` — Browse & search services (keyword, category, location)
- `GET /api/services/:id` — Service details & worker profile
- `POST /api/services` — Create service (Worker only)
- `PUT /api/services/:id` — Update service (Worker only)
- `DELETE /api/services/:id` — Remove service (Worker only)

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Create booking request (Generates `INS-2026-XXXXXX` and pushes real-time socket event)
- `GET /api/bookings` — Fetch bookings for current client or worker
- `GET /api/bookings/:id` — Booking details
- `PUT /api/bookings/:id/status` — Accept / Reject / Complete booking (Worker only)
- `PUT /api/bookings/:id/cancel` — Cancel booking (Client only)

### Admin (`/api/admin`)
- `GET /api/admin/stats` — Dashboard metrics & chart distributions
- `GET /api/admin/users` — User management (filter by role)
- `PUT /api/admin/workers/:id/verify` — Verify service provider
- `PUT /api/admin/users/:id/suspend` — Suspend / unsuspend user
- `GET /api/admin/bookings` — Audit all bookings with `requestId`

---

## License & Copyright

© 2026 **Instavaliable** — *Local Services · On Demand*. All rights reserved.
