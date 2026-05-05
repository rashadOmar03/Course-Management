Name: Omar Mohamed Rashad
ID: 211003802

# Course Management — Full Stack

A full-stack Course Management application built with **ASP.NET Core 8 Web API** (backend) and **React + Vite + Axios** (frontend).

It demonstrates:

- A clean React project structure (`components/`, `pages/`, `services/`)
- Client-side routing with **React Router v6**
- State management with **`useState`** / `useEffect` hooks
- API communication with **Axios** (including a JWT auth interceptor)
- Controlled forms with validation, loading states, and success/error feedback
- A real backend with **CRUD** operations, EF Core, SQL Server, and JWT auth

---

## Project Structure

```
CourseManagement/
├── backend/                ← ASP.NET Core Web API
│   ├── Auth/               ← JwtService
│   ├── Controllers/        ← Auth, Course, Instructor, Student
│   ├── Data/               ← AppDbContext
│   ├── DTOs/               ← Request/response DTOs
│   ├── Migrations/         ← EF Core migrations
│   ├── Models/             ← Course, Student, Instructor, ...
│   ├── Services/           ← CourseService, StudentService
│   ├── Program.cs
│   └── CourseManagement.csproj
│
├── frontend/               ← React (Vite) app
│   ├── src/
│   │   ├── components/     ← Navbar, ProtectedRoute, Loader, Alert
│   │   ├── pages/          ← Home, Login, Courses*, Students*, NotFound
│   │   ├── services/       ← api.js, courseService.js, studentService.js, authService.js
│   │   ├── styles/         ← global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Screenshots/
└── README.md
```

---

## Tech Stack

**Backend**

- ASP.NET Core 8 Web API
- Entity Framework Core (SQL Server)
- JWT Authentication (`Microsoft.AspNetCore.Authentication.JwtBearer`)
- Swashbuckle (Swagger UI)
- CORS configured for the Vite dev server

**Frontend**

- React 18
- Vite 5
- React Router v6
- Axios (with request/response interceptors)
- Plain CSS (custom design system, no external UI lib)

---

## Setup Instructions

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download)
- [Node.js 18+](https://nodejs.org/) (project tested on Node 22)
- SQL Server (LocalDB / SQL Express / full SQL Server)

### 1) Backend

```bash
cd backend

# Update the connection string in appsettings.json if needed
# Default: Server=.;Database=CourseDB;Trusted_Connection=True;TrustServerCertificate=True;

# Apply migrations (creates the CourseDB database)
dotnet ef database update

# Run the API
dotnet run
```

The API will start at:

- HTTP: `http://localhost:5063`
- HTTPS: `https://localhost:7075`
- Swagger UI: `http://localhost:5063/swagger`

A default admin user is seeded on first run:

- **username:** `omar`
- **password:** `1234`

### 2) Frontend

In a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`.

The base URL the frontend uses is configurable via `frontend/.env`:

```
VITE_API_URL=http://localhost:5063/api
```

> Make sure the backend is running at the URL above (or update `.env`) before opening the app.

---

## Frontend Routes

| Path              | Page             | Description                                      |
| ----------------- | ---------------- | ------------------------------------------------ |
| `/`               | Home             | Welcome page with navigation                     |
| `/login`          | Login            | JWT login form (admin: `omar` / `1234`)          |
| `/courses`        | Courses list     | All courses, with edit/delete actions            |
| `/courses/new`    | Create course    | Form to add a new course                         |
| `/courses/:id`    | Edit course      | View & edit a single course; delete it           |
| `/students`       | Students list    | **Protected** — requires login                   |
| `/students/new`   | Create student   | **Protected** — form to add a new student        |
| `/students/:id`   | Edit student     | **Protected** — view, edit, delete a student     |
| `*` (unmatched)   | 404 Not Found    | Fallback                                         |

---

## API Routes

Base URL: `http://localhost:5063/api`

### Auth

| Method | Route          | Auth | Body                              | Description                |
| ------ | -------------- | ---- | --------------------------------- | -------------------------- |
| POST   | `/Auth/login`  | —    | `{ username, password }`          | Returns `{ token, ... }`   |

### Courses (public)

| Method | Route             | Body                          | Description       |
| ------ | ----------------- | ----------------------------- | ----------------- |
| GET    | `/Course`         | —                             | List all courses  |
| GET    | `/Course/{id}`    | —                             | Get one course    |
| POST   | `/Course`         | `{ title, instructorId }`     | Create course     |
| PUT    | `/Course/{id}`    | `{ title, instructorId }`     | Update course     |
| DELETE | `/Course/{id}`    | —                             | Delete course     |

### Students (require `Authorization: Bearer <token>`)

| Method | Route              | Body                | Description       |
| ------ | ------------------ | ------------------- | ----------------- |
| GET    | `/Student`         | —                   | List all students |
| GET    | `/Student/{id}`    | —                   | Get one student   |
| POST   | `/Student`         | `{ name, email }`   | Create student    |
| PUT    | `/Student/{id}`    | `{ name, email }`   | Update student    |
| DELETE | `/Student/{id}`    | —                   | Delete student    |

### Instructors

| Method | Route          | Description           |
| ------ | -------------- | --------------------- |
| GET    | `/Instructor`  | List all instructors  |

---

## How It Demonstrates Each Requirement

- **React file structure** → `src/{components,pages,services,styles}` separation
- **React Router** → 9 routes, including parameterized routes (`/courses/:id`, `/students/:id`) and a 404 fallback
- **State management** → `useState` for form values, loading flags, errors, success messages, lists; `useEffect` for data fetching
- **Axios** → centralized `services/api.js` instance with a JWT request interceptor and a 401-handling response interceptor; one service file per resource
- **Controlled forms** → every input/select is bound to component state; `onSubmit` uses Axios; validation, loading state, and success/error alerts are shown to the user
- **Navigation** → `<Navbar />` with `NavLink`s and an active-state highlight; the in-page links use `<Link>` for client-side routing
- **CRUD against your own backend** → list/get/create/update/delete for both Courses and Students

---

## Screenshots

Screenshots live in the `Screenshots/` folder at the repo root.

---

## Login Credentials

Seeded automatically on first run:

- **username:** `omar`
- **password:** `1234`

These are required to access the Students pages (the `StudentController` is `[Authorize]`).
