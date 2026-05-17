# Course Management — Complete Project Guide

This document explains **what every part of this project does**, in plain English, and goes file-by-file through the backend and the frontend so you understand exactly how a request travels from the browser, through the API, into the database, and back.

---

## 1. The 30-second mental model

There are **three pieces** that work together:

1. **Frontend** — what the user sees in the browser.
   A React app running on `http://localhost:5173`. It has buttons, forms, tables, and pages. It can't talk to the database directly. When the user clicks "Enroll" or "Login", the frontend sends a network request (HTTP) to the backend.

2. **Backend** — the brains that actually do the work.
   An ASP.NET Core 8 Web API running on `http://localhost:5063`. It exposes URLs (like `/api/Auth/login`) that the frontend calls. For each request it: validates the input, checks who you are (JWT), enforces who's allowed to do what (Admin/Student/Instructor), reads/writes the database, and returns JSON.

3. **Database** — long-term memory.
   A SQL Server database called `CourseDB`. It stores users, students, instructors, courses, and enrollments in tables. The backend talks to it through **Entity Framework Core** (an ORM), so we never write raw SQL — we just say "give me this object" or "save this object" in C#.

```
Browser (React)  ──HTTP/JSON──▶  Backend (ASP.NET Core)  ──EF Core──▶  SQL Server (CourseDB)
       ▲                                  │                                 │
       └──────── JSON responses ──────────┴──────── rows / objects ─────────┘
```

---

## 2. The big features

The app has **three roles**:

- **Admin** — manages everything: courses, students, instructors, enrollments, and other admins.
- **Student** — signs themselves up, browses the course catalog, enrolls/unenrolls themselves, and sees their own profile.
- **Instructor** — signs themselves up (must be approved by an admin first), then sees the courses they teach and the students enrolled in each.

Login is the **first page** any unauthenticated user sees. After login, the frontend looks at your role and sends you to the right dashboard.

---

## 3. The Database

### How it's stored
- **Engine**: SQL Server (LocalDB, SQL Express, or full SQL Server).
- **Connection string**: `backend/appsettings.json` → `Server=.;Database=CourseDB;Trusted_Connection=True;TrustServerCertificate=True;`.
- **Schema is created by EF Core migrations** — small C# files in `backend/Migrations/` that contain `CREATE TABLE` / `ALTER TABLE` instructions. Running `dotnet ef database update` walks through them and brings your DB up to date.

### The tables (and why they exist)

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `Users` | Login accounts. Every signed-in person has one row here. | `Id`, `Username` (unique), `PasswordHash` (BCrypt), `Role`, `StudentId?`, `InstructorId?` |
| `Students` | Domain entity for a student (a person who can enroll in courses). | `Id`, `Name`, `Email` (unique) |
| `Instructors` | Domain entity for a teacher. | `Id`, `Name`, `Email` (unique), `IsApproved` |
| `InstructorProfiles` | Optional bio for an instructor (1:1 with `Instructors`). | `Id`, `Bio`, `InstructorId` |
| `Courses` | A class that students can enroll in, taught by one instructor. | `Id`, `Title`, `InstructorId` |
| `Enrollments` | Junction table — which students are in which courses (many-to-many). | `StudentId` + `CourseId` (composite PK), `IsApproved` (bool), `Grade` (nvarchar(5), nullable) |

### Why `User` is separate from `Student` / `Instructor`
- **`User` = login credentials + role.** Anyone who can sign in has a `User` row.
- **`Student` / `Instructor` = the domain person.**
- A `User` of role `Student` is **linked** to a `Student` row via `StudentId`. Same for instructors. Admins don't have either link — they're login accounts with no domain entity.

This separation means you could (in theory) have a `Student` row with no login, or change a person's email without touching their login username, etc.

### Relationships at a glance

```
Users (Admin)              ←  no link
Users (Student)  ──StudentId──▶  Students  ──┐
                                              ├──▶  Enrollments  ◀──┐
Users (Instructor) ──InstructorId──▶  Instructors  ──▶  Courses  ──┘
                                       ▲
                                       │
                             InstructorProfiles (1:1)
```

---

## 4. Backend — file by file

The backend lives in `backend/`. It's a single ASP.NET Core Web API project (`CourseManagement.csproj`).

### 4.1 Project plumbing

#### `backend/CourseManagement.csproj`
The project definition. Lists NuGet package references (libraries the project pulls in):

- **`BCrypt.Net-Next`** — hashes passwords so we never store them in plain text.
- **`Microsoft.AspNetCore.Authentication.JwtBearer`** — validates JWT tokens on incoming requests.
- **`Microsoft.EntityFrameworkCore.SqlServer`** — the SQL Server "driver" for EF Core.
- **`Microsoft.EntityFrameworkCore.Tools`** + `Design` — enables `dotnet ef` migration commands.
- **`Swashbuckle.AspNetCore`** — generates the Swagger UI page at `/swagger`.

#### `backend/appsettings.json`
General config, including `ConnectionStrings:DefaultConnection` (where the database lives).

#### `backend/appsettings.Development.json`
Same, but only loaded when `ASPNETCORE_ENVIRONMENT=Development`. Lets you override settings locally.

#### `backend/Properties/launchSettings.json`
Defines `dotnet run` profiles — e.g. which port to use (`5063` for HTTP, `7075` for HTTPS) and whether to open the browser.

#### `backend/CourseManagement.http`
A scratchpad of HTTP requests you can fire from VS / VS Code's REST client. Not part of the running app.

#### `backend/Program.cs` — **the boot script**
This is the single entry point that wires everything up. Reading it top to bottom:

1. **Swagger** — registers OpenAPI generation and adds a Bearer-token field to the Swagger UI so you can paste a JWT and try protected endpoints.
2. **Database** — registers `AppDbContext` and tells it to use SQL Server with our connection string.
3. **Services** — registers the C# service classes (`StudentService`, `CourseService`, `InstructorService`, `EnrollmentService`, `AuthService`, `JwtService`) so controllers can ask the DI container for them by constructor parameter.
4. **CORS** — explicitly allows the React dev server (`localhost:5173`) to call the API. Without this, the browser blocks cross-origin calls.
5. **Authentication** — sets up JWT bearer authentication using a shared secret (`JwtService.SecretKey`). Issuer/audience validation is off (development mode); signature validation is on.
6. **Authorization + Controllers** — turns on `[Authorize]` and `[Authorize(Roles=...)]` and maps controller routes.
7. **Middleware pipeline** — `UseCors → UseAuthentication → UseAuthorization → MapControllers`. Order matters: a request must be authenticated *before* authorization can check roles.
8. **Seed/repair block (the `using (var scope = ...)` part)** — runs once at startup:
   - Re-hashes any plain-text passwords (legacy data from before BCrypt).
   - Patches up legacy instructors that have no email or aren't approved.
   - Creates a default instructor (`Dr. Ahmed`) if none exist.
9. **Swagger UI** — exposed only in Development.
10. **`app.Run()`** — starts listening for HTTP requests.

### 4.2 Auth (`backend/Auth/`)

#### `backend/Auth/JwtService.cs`
Issues JSON Web Tokens. Given a `User`, it signs a token that contains:

- `NameIdentifier` (the user's `Id`)
- `Name` (username)
- `Role` (`Admin` / `Student` / `Instructor`)
- `studentId` claim (if linked)
- `instructorId` claim (if linked)

The token expires after 8 hours. The client puts this token in the `Authorization: Bearer ...` header on every request, and ASP.NET Core's JWT middleware reads the claims and turns them into `User.Identity` / `User.IsInRole(...)` inside controllers.

The shared **secret key** is also exposed as `JwtService.SecretKey` so `Program.cs` can use the same value to validate incoming tokens. (In production you'd put this in `appsettings.json` and load it with `IConfiguration`.)

### 4.3 Data layer (`backend/Data/` and `backend/Models/`)

#### `backend/Data/AppDbContext.cs`
The EF Core "session" with the database. Key points:

- Declares `DbSet<T>` for each table (e.g. `DbSet<Course> Courses`). EF translates LINQ queries on these into SQL.
- `OnModelCreating(...)` configures fine-grained schema rules:
  - Composite primary key on `Enrollment` (`StudentId` + `CourseId`).
  - Cascade delete: removing a `Student` or `Course` removes their `Enrollment` rows.
  - Unique indexes on `User.Username`, `Student.Email`, `Instructor.Email`.
  - When a `Student` or `Instructor` is deleted, the matching `User.StudentId` / `User.InstructorId` is set to NULL (so the login isn't deleted, just unlinked).

Every controller/service receives a fresh `AppDbContext` per HTTP request via dependency injection.

#### `backend/Models/User.cs`
Login account. Has a `Role` (`Admin` / `Student` / `Instructor`) and optional links to a `Student` or `Instructor` row.

#### `backend/Models/Student.cs`
Represents a student. Has `Name`, `Email`, and a list of `Enrollments` (the courses they're in).

#### `backend/Models/Instructor.cs`
Represents an instructor. Has `IsApproved` — newly signed-up instructors start with `false` and need an admin to approve them before they can be assigned to courses. Has an optional `InstructorProfile` for a bio.

#### `backend/Models/InstructorProfile.cs`
A simple 1:1 child of `Instructor` storing the bio text. Split out so the main `Instructors` table stays small.

#### `backend/Models/Course.cs`
Represents a course. Has a `Title`, an `InstructorId` (foreign key to `Instructor`), and a list of `Enrollments`.

#### `backend/Models/Enrollment.cs`
The bridge between `Student` and `Course`. No `Id` of its own — its primary key is the pair `(StudentId, CourseId)`, which also enforces "a student can't be enrolled in the same course twice."

### 4.4 Migrations (`backend/Migrations/`)

These files are auto-generated by EF Core when you run `dotnet ef migrations add <Name>`. Each one is a recorded change to the schema. They run in chronological order:

| File | What it does |
|------|--------------|
| `20260402191835_InitialCreate` | Creates `Students`, `Courses`, `Instructors`. |
| `20260402200233_AddRelations` | Adds `Enrollments`, `InstructorProfiles`, foreign keys. |
| `20260402201251_AddUsers` | Adds the `Users` table for login. |
| `20260506053004_RolesAndApproval` | Renames `Users.Password` → `PasswordHash`, adds `User.StudentId/InstructorId`, `Instructor.Email`, `Instructor.IsApproved`, plus unique indexes. |
| `20260506093000_EnrollmentApprovalAndGrades` | Adds `Enrollment.IsApproved` (request → admin approval flow) and `Enrollment.Grade` (set by instructor). Existing rows are marked `IsApproved=true` so they aren't blocked. |
| `AppDbContextModelSnapshot.cs` | EF's snapshot of the *current* model. EF compares this to the C# code to know what's new in the next migration. **Don't edit by hand.** |

`dotnet ef database update` applies any unapplied migrations to your DB.

### 4.5 DTOs (`backend/DTOs/`)

DTOs ("Data Transfer Objects") are plain shapes that travel between the API and the client. They're separate from the database models for two reasons:
1. **Hide internals** — never accidentally send `PasswordHash` to the browser.
2. **Validate input** — `[Required]`, `[EmailAddress]`, `[MaxLength]` annotations on DTOs cause ASP.NET Core to reject malformed requests with a 400 before any of your code runs.

| File | Purpose |
|------|---------|
| `LoginDto` | Request body for `POST /api/Auth/login` (`username`, `password`). |
| `SignupStudentDto` | Public student signup payload. |
| `SignupInstructorDto` | Public instructor signup payload (includes `bio`). |
| `CreateAdminDto` | Admin-only: create a new admin (`username`, `password`). |
| `AuthResponseDto` | What login/signup returns: `token`, `userId`, `username`, `role`, optional `studentId` / `instructorId`, `isApprovedInstructor`. |
| `CreateStudentDto` | Update a student (`name`, `email`). |
| `StudentResponseDto` | Student row sent to clients (no internals). |
| `CreateCourseDto` | Create/update a course (`title`, `instructorId`). |
| `CourseResponseDto` | Course shape returned to clients. Includes `instructorName` and `enrollmentCount` for convenience. |
| `CreateInstructorDto` | Admin creates/edits an instructor (`name`, `email`, `bio`). |
| `InstructorResponseDto` | Instructor shape returned to clients. |
| `EnrollDto` | Admin enrollment body (`studentId`, `courseId`). |
| `EnrollmentResponseDto` | Joined enrollment row: student name+email, course title, instructor name, `isApproved`, optional `grade`. |
| `SetGradeDto` | Body for `PUT /api/Enrollment/{studentId}/{courseId}/grade` — single optional `grade` field (max 5 chars). |
| `AdminResponseDto` | List/return shape for admins (`id`, `username`). Never includes the hash. |

### 4.6 Services (`backend/Services/`)

Services hold the **business logic** so controllers stay thin (controllers only handle HTTP; services do the actual work). All of them take an `AppDbContext` in their constructor.

#### `backend/Services/AuthService.cs`
- `Login(username, password)` — looks up the user, runs `BCrypt.Verify`, returns a populated `AuthResponseDto` (with a fresh JWT) on success or null on failure.
- `SignupStudent(dto)` — validates uniqueness (`Username` unused, `Email` unused), creates a `Student` row, then creates a linked `User` with role `Student`. Returns an auth response so the browser is logged in immediately.
- `SignupInstructor(dto)` — same idea, but creates an `Instructor` with `IsApproved = false` (and an optional `InstructorProfile` if a bio was given), then a `User` with role `Instructor`.
- `CreateAdmin / GetAdmins / DeleteAdmin` — admin management. `DeleteAdmin` also refuses to delete the last admin so you can never lock yourself out.
- `BuildResponse(user)` — central helper that turns a `User` into an `AuthResponseDto` with a token.

#### `backend/Services/StudentService.cs`
Plain CRUD for students.
- `GetAll / GetById` — projection straight to `StudentResponseDto`.
- `Update(id, dto)` — guards against another student already using the new email.
- `Delete(id)` — first NULL-out any `User.StudentId` references (so we don't violate FK), then delete the row. EF cascades the enrollments.

#### `backend/Services/InstructorService.cs`
- `GetAll(approvedOnly)` — used by both the public `GET /api/Instructor` (approved-only) and the admin `GET /api/Instructor/all`.
- `GetPending` — instructors with `IsApproved = false`, for the admin queue.
- `Add` — admin-created instructors are pre-approved.
- `Update` — also creates/updates the linked `InstructorProfile` row when bio changes.
- `Approve` — flips `IsApproved` to `true`.
- `Delete` — refuses if the instructor is still assigned to courses (referential safety).

#### `backend/Services/CourseService.cs`
- `GetAll / GetById` — joins `Instructor` and counts enrollments in one EF query.
- `Add / Update` — refuse if the chosen instructor doesn't exist or isn't approved.
- `Delete` — straightforward; EF cascades the enrollments.

#### `backend/Services/EnrollmentService.cs`
- `GetAll`, `GetPending`, `GetByCourse`, `GetByStudent`, `GetByInstructor` — all return the same `EnrollmentResponseDto` (joined view) so the frontend always sees a uniform shape. `GetPending` returns only `IsApproved == false` rows; `GetByCourse`/`GetByInstructor` accept an `approvedOnly` flag (instructors only ever see the approved roster of their courses).
- `Enroll(studentId, courseId, autoApprove)` — validates that both exist and that the pair isn't already enrolled, then inserts. Student self-requests pass `autoApprove=false` (creates a pending request); admin direct enroll passes `autoApprove=true`.
- `Approve(studentId, courseId)` — flips `IsApproved` to `true` for a pending row.
- `SetGrade(studentId, courseId, grade)` — writes the grade on an approved enrollment (refuses to grade a pending one).
- `InstructorTeachesCourse(instructorId, courseId)` — guard used by the controller before instructor-scoped writes.
- `Unenroll(studentId, courseId)` — finds the row by composite key and deletes it. Used for "unenroll" by everyone and for "reject" by admins.

### 4.7 Controllers (`backend/Controllers/`)

Controllers are the HTTP layer. Each one is a thin shell: parse the request, call the right service, return an `IActionResult`. They use ASP.NET Core attributes for routing and authorization.

#### `backend/Controllers/AuthController.cs`
Public + admin auth surface.

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /api/Auth/login` | public | Verify credentials, return JWT. |
| `POST /api/Auth/signup/student` | public | Create student account. |
| `POST /api/Auth/signup/instructor` | public | Create instructor account (pending approval). |
| `GET /api/Auth/me` | any logged-in user | Return current user's profile (incl. linked student/instructor info). |
| `GET /api/Auth/admins` | Admin | List admins. |
| `POST /api/Auth/admins` | Admin | Create another admin. |
| `DELETE /api/Auth/admins/{id}` | Admin | Delete an admin (refuses to delete yourself or the last admin). |

#### `backend/Controllers/CourseController.cs`
- `[Authorize]` at the class level — must be logged in.
- `GET` / `GET {id}` — anyone authenticated can browse.
- `POST` / `PUT` / `DELETE` — `[Authorize(Roles="Admin")]`.

#### `backend/Controllers/StudentController.cs`
- `[Authorize(Roles = "Admin")]` at the class level — admin-only, full stop. Students cannot list, view, or change other students; that's the privacy wall.

#### `backend/Controllers/InstructorController.cs`
- `GET /api/Instructor` — approved instructors, visible to anyone authenticated (so the student catalog can show instructor names).
- `GET /api/Instructor/all` — admin-only, includes pending.
- `GET /api/Instructor/pending` — admin-only.
- `POST` / `PUT` / `DELETE` — admin-only.
- `POST /api/Instructor/{id}/approve` — admin-only.

#### `backend/Controllers/EnrollmentController.cs`
The most nuanced authorization rules:

| Endpoint | Role | Purpose |
|----------|------|---------|
| `GET /api/Enrollment` | Admin | All enrollments (pending + approved). |
| `GET /api/Enrollment/pending` | Admin | The queue of student enrollment requests waiting for approval. |
| `GET /api/Enrollment/by-course/{courseId}` | Admin or owning Instructor | Enrolled students. Admin sees pending+approved; instructor sees only the approved roster of courses they teach. |
| `GET /api/Enrollment/by-student/{studentId}` | Admin | A student's enrollments. |
| `GET /api/Enrollment/me` | Student | My own enrollments incl. status and grade. Reads `studentId` from the JWT claim. |
| `GET /api/Enrollment/teaching` | Instructor | Approved enrollments in courses I teach. Reads `instructorId` from JWT. |
| `POST /api/Enrollment` | Admin | Enroll any student in any course directly (auto-approved). |
| `POST /api/Enrollment/{studentId}/{courseId}/approve` | Admin | Approve a pending request. |
| `DELETE /api/Enrollment/{studentId}/{courseId}` | Admin | Remove that pair (also used to reject pending requests). |
| `POST /api/Enrollment/me/{courseId}` | Student | Request enrollment in a course (creates a pending row). |
| `DELETE /api/Enrollment/me/{courseId}` | Student | Cancel my request / unenroll myself. |
| `PUT /api/Enrollment/{studentId}/{courseId}/grade` | Instructor (owning course) or Admin | Set the grade on an approved enrollment. |
| `DELETE /api/Enrollment/teaching/{studentId}/{courseId}` | Instructor (owning course) | Remove a student from a course I teach. |

The trick that makes "self" endpoints safe is reading `studentId` from the JWT claim — the user can't lie about which student they are, because the token was signed by the server. Same idea for instructor-scoped endpoints: the controller verifies the JWT's `instructorId` actually owns the course before letting the instructor change anything.

---

## 5. Frontend — file by file

The frontend lives in `frontend/`. It's a Vite-powered React app.

### 5.1 Project plumbing

#### `frontend/package.json`
Lists the runtime deps (`react`, `react-dom`, `react-router-dom`, `axios`) and dev deps (`vite`, `@vitejs/plugin-react`). Defines the scripts:
- `npm run dev` — starts the Vite dev server on `http://localhost:5173` with hot-reload.
- `npm run build` — produces an optimized bundle in `dist/`.
- `npm run preview` — serves that bundle locally for a quick prod-like check.

#### `frontend/vite.config.js`
Tiny config: enables the React plugin.

#### `frontend/index.html`
The single HTML page. Contains a `<div id="root"></div>` and loads `src/main.jsx`. React mounts the whole app inside that div.

#### `frontend/.env`
Holds `VITE_API_URL=http://localhost:5063/api`. Vite exposes any `VITE_*` variable to the client code as `import.meta.env.VITE_*`. Change this if your backend isn't on the default port.

### 5.2 Entry point

#### `frontend/src/main.jsx`
Boots React: imports global CSS, wraps the app in `<BrowserRouter>` (so we can use client-side routing), and renders `<App />` into `#root`.

#### `frontend/src/App.jsx`
Defines the route table. Key ideas:

- A `RootRedirect` component handles `/` — if not signed in, send to `/login`; if signed in, send to `/admin`, `/student`, or `/instructor` based on role.
- Public routes: `/login`, `/signup`.
- Admin routes (`/admin/*`) all wrapped in `<ProtectedRoute roles={['Admin']}>`.
- Student routes (`/student/*`) wrapped with `roles={['Student']}`.
- Instructor routes (`/instructor/*`) wrapped with `roles={['Instructor']}`.
- A catch-all `*` that redirects to `/404`.

The result: a student typing `/admin/students` into the URL bar gets bounced back to `/student`. A logged-out user typing anything but `/login` or `/signup` gets bounced to `/login`.

### 5.3 Shared infrastructure

#### `frontend/src/styles/global.css`
The whole design system in one CSS file: CSS variables for colors, layout for navbar/footer/main, button/form/table/alert classes, role tabs on the signup page, the dashboard "feature" cards, badges, the student course-catalog grid, and a few utilities.

### 5.4 Components (`frontend/src/components/`)

#### `frontend/src/components/Navbar.jsx`
The top bar. It listens for an `auth-change` event so it re-renders the moment the user logs in / out. The links shown depend on `user.role`:
- Admin sees: Dashboard, Courses, Students, Instructors, Enrollments, Admins.
- Student sees: Dashboard, Browse, My courses, Profile.
- Instructor sees: Dashboard, Profile.
- Logged out sees: Login, Sign up.

The brand link goes to the right "home" via `homePathForRole(role)`.

#### `frontend/src/components/ProtectedRoute.jsx`
A wrapper component used in `App.jsx`. Logic:
1. Not authenticated → `<Navigate to="/login" />`, remembering the original URL in `location.state.from`.
2. Authenticated but wrong role → `<Navigate to={homePathForRole(user.role)} />`.
3. Otherwise render the child component.

This is **defense-in-depth**: it hides routes from the wrong role, but the *real* security is the backend's `[Authorize(Roles=...)]`. Hiding a button doesn't matter if the API still serves the call — luckily ours doesn't.

#### `frontend/src/components/Alert.jsx`
A tiny component that renders a colored banner if it has children. Used everywhere for error / success / info messages.

#### `frontend/src/components/Loader.jsx`
Tiny "Loading..." card.

### 5.5 Services (`frontend/src/services/`)

These are thin wrappers around `axios` so each page imports a function like `getStudents()` instead of writing the URL inline.

#### `frontend/src/services/api.js`
The shared axios instance.
- Sets `baseURL` from `VITE_API_URL`.
- **Request interceptor**: attaches the JWT from `sessionStorage` to every outgoing request as `Authorization: Bearer ...`.
- **Response interceptor**: if a 401 comes back, clear the token + user from `sessionStorage`, fire an `auth-change` event (so Navbar updates), and redirect to `/login`. This means a kicked-out session can't keep silently failing.

#### `frontend/src/services/authService.js`
Wraps every auth-related call:
- On import, also clears any stale `token`/`user` left in `localStorage` from older builds. Tokens now live **only in `sessionStorage`** so they're scoped to the current browser tab and disappear when the tab closes — they never cross tabs and they aren't reachable from the persistent `localStorage` jar.
- `login(...)`, `signupStudent(...)`, `signupInstructor(...)` — call the API and on success persist `{token, user}` to `sessionStorage`. They fire an `auth-change` event so the navbar rerenders.
- `fetchMe()` — `GET /api/Auth/me`.
- `logout()` — clears `sessionStorage` and fires `auth-change`.
- `getCurrentUser()` / `isAuthenticated()` / `getToken()` / `hasRole(...)` — synchronous helpers other components use.
- `homePathForRole(role)` — single source of truth for "where does this role start?"

#### `frontend/src/services/courseService.js`
Wraps `/api/Course` (`getCourses`, `getCourse`, `createCourse`, `updateCourse`, `deleteCourse`).

#### `frontend/src/services/instructorService.js`
Wraps `/api/Instructor`. Includes the admin-only variants `getAllInstructors`, `getPendingInstructors`, `approveInstructor`, plus the regular CRUD.

#### `frontend/src/services/studentService.js`
Wraps `/api/Student`. Admin-only on the server, but the service file doesn't care — it just makes the call.

#### `frontend/src/services/enrollmentService.js`
Three sets of calls:
- Admin: `getEnrollments`, `getPendingEnrollments`, `getEnrollmentsByCourse`, `getEnrollmentsByStudent`, `enroll` (direct), `approveEnrollment`, `unenroll` (also used as "reject").
- Student: `getMyEnrollments`, `requestEnrollment` (alias `selfEnroll`), `selfUnenroll`.
- Instructor: `getTeachingEnrollments`, `setGrade`, `instructorRemoveStudent`.

#### `frontend/src/services/adminService.js`
Wraps the admin-management endpoints under `/api/Auth/admins`.

### 5.6 Pages (`frontend/src/pages/`)

A "page" is a screen. React Router decides which page to render based on the URL.

#### Public pages

##### `frontend/src/pages/Login.jsx`
- Controlled form with `username` / `password`.
- On submit: calls `login(...)`, which persists the token. Then navigates to either the page the user originally tried to visit (from `location.state.from`) or the role's home.
- If you're already logged in and visit `/login`, it auto-redirects you to your home.
- Has a link to `/signup`.

##### `frontend/src/pages/Signup.jsx`
- Has a tab switcher between "Student" and "Instructor" (purely a `useState`, no routing).
- Different form fields appear depending on tab (instructors get a "Bio" textarea; instructors also see an info banner saying "an admin must approve you").
- On submit: calls the right backend endpoint and persists the JWT, then sends the user to their dashboard.

##### `frontend/src/pages/NotFound.jsx`
The 404. Picks a sensible "Home" link based on whether you're logged in.

#### Admin pages (`frontend/src/pages/admin/`)

##### `AdminDashboard.jsx`
Welcome screen. Loads counts (courses, students, instructors, pending) in parallel and shows them as clickable cards leading to each section.

##### `AdminCourses.jsx`
List of all courses with edit/delete and a "+ New Course" button. Uses `<table>` for compactness.

##### `AdminCourseCreate.jsx`
Form for a new course. Loads approved instructors first to populate a `<select>`. If there are zero approved instructors, the form is disabled and points the admin to the Instructors page.

##### `AdminCourseEdit.jsx`
Edits a course **and** lists its enrolled students underneath. Each student has a "Remove" button that calls `unenroll(studentId, courseId)` so admin can manage enrollments from inside the course view.

##### `AdminStudents.jsx`
Lists all students with edit/delete. Note there's no "create student" page anymore — students sign themselves up.

##### `AdminStudentEdit.jsx`
Edits a student and shows their enrollments with an "Unenroll" button per row.

##### `AdminInstructors.jsx`
Two tables on one page: **Pending approval** (with Approve / Reject buttons) and **Approved instructors** (with Edit / Delete). The pending count appears as a badge on the heading.

##### `AdminInstructorCreate.jsx` / `AdminInstructorEdit.jsx`
Create or edit an instructor. Admin-created instructors are auto-approved.

##### `AdminEnrollments.jsx`
- A "Pending requests" section at the top with **Approve** / **Reject** buttons per row. Empty state when there are none.
- A small inline form to enroll any student into any course directly (skips the request flow — the row is created already approved).
- Below it, a table of approved enrollments with a "Filter by course" dropdown, a Grade column, and a "Remove" button per row.

##### `AdminAdmins.jsx`
Create new admins (username + password) and list/delete existing ones. The admin's own row shows "you" and has no Delete button. The server also refuses `DELETE` on yourself or on the last admin.

#### Student pages (`frontend/src/pages/student/`)

##### `StudentDashboard.jsx`
Welcome + the count of enrollments. Three cards leading to Browse, My courses, Profile.

##### `StudentBrowseCourses.jsx`
Catalog grid. Each course card shows title, instructor, instructor bio, enrollment count, and a button whose label depends on the student's relationship to the course:
- not enrolled → **Request enrollment** (POSTs to `/api/Enrollment/me/{courseId}`, status starts as pending).
- pending request → "Pending approval" badge + **Cancel request**.
- approved → "Enrolled" badge + **Unenroll**.

##### `StudentMyCourses.jsx`
Two sections:
- **Pending requests** — table of rows still waiting for admin approval, each with a Cancel button.
- **Enrolled** — table of approved enrollments showing the course, instructor and the grade column (from `/api/Enrollment/me`). Each row has an Unenroll button.

##### `StudentProfile.jsx`
Read-only view of the student's own profile (`/api/Auth/me`). To change their data, they ask an admin (kept simple on purpose).

#### Instructor pages (`frontend/src/pages/instructor/`)

##### `InstructorDashboard.jsx`
Two modes:
- **If `isApprovedInstructor === false`**: shows a "Awaiting approval" card. Nothing else is loaded.
- **If approved**: loads `/api/Enrollment/teaching` (only approved rows are returned), groups by course, and renders one card per course with the list of enrolled students. For each row the instructor can:
  - **Edit grade** in an inline input + Save button (calls `PUT /api/Enrollment/{studentId}/{courseId}/grade`).
  - **Remove** the student from the course (calls `DELETE /api/Enrollment/teaching/{studentId}/{courseId}`).

##### `InstructorProfile.jsx`
Read-only view of the instructor's own data. Shows status (Approved / Pending).

---

## 6. End-to-end flow examples

### Example 1: a student requests a course, gets approved, gets a grade

1. Browser loads `/student/courses` (`StudentBrowseCourses.jsx`).
2. Component calls `getCourses()`, `getMyEnrollments()`, `getInstructors()` in parallel via the `services/*.js` wrappers.
3. Each call goes through `services/api.js`, which adds the JWT header (read from `sessionStorage`).
4. ASP.NET Core's JWT middleware reads the token, populates `User.Identity`, and routes to the matching controller method (e.g. `CourseController.Get`).
5. The controller calls `CourseService.GetAll()`, which hits `AppDbContext.Courses` and EF emits SQL.
6. SQL Server returns rows; EF turns them into `CourseResponseDto` objects (enrollment count = approved only); the controller serializes them to JSON.
7. axios in the browser parses the JSON and the React component renders cards.
8. User clicks **Request enrollment** → `requestEnrollment(courseId)` → `POST /api/Enrollment/me/123`.
9. `EnrollmentController.SelfEnroll` reads `studentId` from the JWT, calls `EnrollmentService.Enroll(studentId, 123, autoApprove: false)`. EF inserts a row with `IsApproved = false`. Controller returns `200 OK`.
10. The student's catalog card now shows "Pending approval".
11. Admin opens `/admin/enrollments`. The pending row appears at the top. They click **Approve** → `POST /api/Enrollment/{studentId}/{courseId}/approve` → `EnrollmentService.Approve` flips `IsApproved` to `true`.
12. The student now sees "Enrolled" on their card; the instructor's `/instructor` dashboard now shows the student in their course list.
13. Instructor types a grade in the inline input and clicks **Save** → `PUT /api/Enrollment/{studentId}/{courseId}/grade` with `{ grade: "A" }`. The controller verifies the JWT's `instructorId` owns the course before saving.
14. Student opens **My courses**, sees the grade column populated.

### Example 2: an instructor signs up and gets approved

1. Public visits `/signup`, picks the "Instructor" tab, fills in name/email/username/password/bio, submits.
2. `signupInstructor(payload)` → `POST /api/Auth/signup/instructor`.
3. `AuthService.SignupInstructor` checks uniqueness, creates an `Instructor` row with `IsApproved = false` and an `InstructorProfile` for the bio, then a linked `User` with role `Instructor`. Returns a JWT.
4. Frontend persists the token. The user is auto-logged-in and sent to `/instructor`.
5. `InstructorDashboard` reads `me.isApprovedInstructor === false` and renders the "Awaiting approval" card.
6. Meanwhile the admin opens `/admin/instructors`. `AdminInstructors` calls `getAllInstructors()`. The pending instructor appears in the top table.
7. Admin clicks **Approve** → `POST /api/Instructor/{id}/approve` → `InstructorService.Approve` flips `IsApproved` to `true`.
8. Instructor refreshes their dashboard. `fetchMe()` now returns `isApprovedInstructor: true`. The dashboard switches to course-list mode.

---

## 7. How to run the app

```bash
# backend (one terminal)
cd backend
dotnet ef database update    # creates / updates CourseDB
dotnet run                   # listens on http://localhost:5063

# frontend (another terminal)
cd frontend
npm install                  # first time only
npm run dev                  # opens http://localhost:5173
```

The API does not seed a default admin; create admins via your own process (existing data, SQL, etc.).

---
    
## 8. Where to look when something goes wrong

| Symptom | First place to check |
|---------|----------------------|
| Frontend shows blank / 404 in network tab | Is the backend running on `5063`? Is `VITE_API_URL` correct? |
| 401 on every call | Token expired (8h) or you logged out — log in again. |
| 403 on a call | Your role isn't allowed there. Check the `[Authorize(Roles=...)]` on the controller. |
| `Failed to bind to address ... 5063: address already in use` | An old backend is still running. `Stop-Process -Name CourseManagement -Force`. |
| `dotnet ef` says no migrations | Run from the `backend/` folder. |
| Login fails with seeded admin | Old plain-text password not yet re-hashed — start the backend once and the seed block fixes it. |
| Student tries to view another student | Server returns 403; intentional. Only admins can. |

---

## 9. TL;DR

- **Frontend (`frontend/`)** = React + Vite UI in the browser. Talks to the backend over HTTP using axios.
- **Backend (`backend/`)** = ASP.NET Core 8 Web API. Validates JWTs, enforces roles, calls services that read/write the database.
- **Database (`CourseDB`)** = SQL Server. Schema is managed by EF Core migrations.
- **Three roles** (Admin / Student / Instructor) get different dashboards, different routes, and different API permissions. The server is the source of truth for what each role can do; the frontend just hides what it can't show.
