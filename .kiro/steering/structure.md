# Project Structure

## Root Layout

```
/
├── backend/          # Express.js API server
├── frontend/         # Next.js application
├── node_modules/     # Root-level shared dependencies
└── package.json      # Root package with shared dependencies
```

## Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js                    # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Login, signup, token refresh
│   │   ├── queueController.js       # Queue and appointment logic
│   │   ├── profileController.js     # User profile management
│   │   └── notificationController.js # Notification CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── roleMiddleware.js        # Role-based access control
│   ├── models/
│   │   ├── User.js                  # User schema (role, name, email, etc.)
│   │   ├── Queue.js                 # Service/queue schema with appointments
│   │   ├── QueueEntry.js            # Queue participation records
│   │   ├── Appointment.js           # Appointment bookings
│   │   └── Notification.js          # Notification records
│   ├── routes/                      # Express route definitions
│   └── services/
│       └── notificationService.js   # Notification business logic
├── uploads/
│   └── profiles/                    # User profile images
└── server.js                        # Entry point with Socket.io setup
```

## Frontend Structure

```
frontend/
├── app/
│   ├── admin/
│   │   └── dashboard/               # Admin dashboard
│   ├── organizer/
│   │   ├── dashboard/               # Organizer service management
│   │   ├── appointments/[id]/       # Appointment details
│   │   └── service/[id]/            # Service queue management
│   ├── user/
│   │   ├── dashboard/               # User service browser
│   │   ├── appointments/            # User's appointments
│   │   └── service/[id]/            # Join queue/book appointment
│   ├── components/
│   │   ├── Navbar.js                # Navigation with role-based links
│   │   ├── ProtectedRoute.jsx       # Auth guard for protected pages
│   │   ├── PublicRoute.jsx          # Guard for login/signup pages
│   │   └── InfiniteScroll.js        # Pagination component
│   ├── context/
│   │   ├── Authcontext.js           # Authentication state
│   │   ├── LanguageContext.js       # i18n language selection
│   │   └── ThemeContext.js          # Dark/light theme
│   ├── providers/
│   │   ├── I18nProvider.jsx         # i18next initialization
│   │   └── ThemeProvider.jsx        # Theme provider wrapper
│   ├── utils/
│   │   └── api.js                   # Axios instance with auth headers
│   ├── login/                       # Login page
│   ├── signup/                      # Signup page
│   ├── profile/                     # User profile page
│   ├── layout.js                    # Root layout with providers
│   └── page.js                      # Landing page
├── components/
│   └── notifications/
│       ├── NotificationBell.js      # Notification UI component
│       └── NotificationProvider.js  # Socket.io notification handler
├── lib/
│   └── socket.js                    # Socket.io client setup
└── public/                          # Static assets
```

## Key Conventions

### Routing
- Next.js App Router with file-based routing
- Dynamic routes use `[id]` folder convention
- Role-based route prefixes: `/admin/*`, `/organizer/*`, `/user/*`

### API Structure
- RESTful endpoints under `/api/*` prefix
- Controllers handle business logic
- Middleware for auth and role checks applied in routes
- Models define Mongoose schemas with validation

### State Management
- React Context for global state (auth, theme, language)
- Socket.io for real-time updates
- Local state with useState/useEffect for component-specific data

### File Naming
- Backend: camelCase for files (e.g., `authController.js`)
- Frontend: PascalCase for components, camelCase for utilities
- Models: PascalCase singular (e.g., `User.js`, `Queue.js`)

### Authentication Flow
- JWT stored in localStorage (frontend)
- Auth middleware validates token on protected routes
- Role middleware checks user role for organizer/admin endpoints
- Socket.io rooms use userId for targeted notifications
