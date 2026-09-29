# DocManager — Document Management System

A full-stack web application where users can sign up, log in, and upload, search, open and delete their personal documents (resume, certificates, college documents, assignments, notes). An admin can view and manage every user's documents.

Built with **Node.js, Express, MongoDB** and a plain **HTML + Bootstrap + JavaScript** frontend that talks to a REST API using `fetch()`.

---

## Features

**Users**
- Sign up, log in and log out (passwords hashed with bcrypt, JWT stored in an HTTP-only cookie)
- Upload a document with a name and category (pdf, jpg, jpeg, png, doc, docx — max 5 MB)
- View only their own documents, newest first
- Search documents by name and filter by category
- Open a document in a new tab
- Delete their own documents (the database record **and** the file on disk)

**Admin**
- View every user's documents, with the owner's name and email
- Delete any document

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Bootstrap 5, JavaScript (`fetch`, `FormData`, DOM) |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | bcrypt, JSON Web Token, cookie-parser |
| File upload | express-fileupload (files stored locally in `uploads/`) |
| Config | dotenv |

---

## How it works

**Signup** — Browser → `fetch` POST `/api/auth/signup` → controller checks the email is not taken → `bcrypt.hash(password, 10)` → `User.create()` → `201` response.

**Login** — `User.findOne({ email })` → `bcrypt.compare()` → `jwt.sign({ id, role })` → token stored in an **HTTP-only cookie** → the browser sends it automatically with every later request.

**Authentication middleware** — reads `req.cookies.token` → `jwt.verify()` → puts the payload in `req.user` → `next()`. Invalid or expired tokens get `401`.

**File upload**
```text
<input type="file"> → FormData.append("file", file) → fetch POST (multipart/form-data)
→ express-fileupload → req.files.file → extension + size check
→ uploadedFile.mv("uploads/<timestamp>-<random>.pdf")
→ Document.create({ name, category, fileName, filePath, uploadedBy: req.user.id })
```
The file itself lives on disk; MongoDB stores only its information and path.

**View documents** — `GET /api/documents` → `auth` → `Document.find({ uploadedBy: req.user.id })` (+ optional `$regex` search and category filter) → JSON → JavaScript builds the Bootstrap table.

**Delete** — `DELETE /api/documents/:id` → `auth` → find the document → **check `uploadedBy` equals `req.user.id`** (else `403`) → delete the record → delete the file with `fs.unlinkSync`.

**Admin** — admin routes use two middleware in a row: `auth` then `isAdmin` (checks `req.user.role === "Admin"`, else `403`). The admin list uses `populate("uploadedBy", "name email")` to show owners.

---

## API

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Create an account |
| POST | `/api/auth/login` | Public | Log in, sets the token cookie |
| POST | `/api/auth/logout` | Public | Clears the token cookie |
| POST | `/api/documents/upload` | User | Upload a document (`multipart/form-data`: `name`, `category`, `file`) |
| GET | `/api/documents` | User | Own documents. Optional `?search=` and `?category=` |
| DELETE | `/api/documents/:id` | User | Delete own document |
| GET | `/api/documents/all` | Admin | All documents with owner details |
| DELETE | `/api/documents/admin/:id` | Admin | Delete any document |

---

## Project structure

```text
├── server.js                  # App setup, middleware, routes, starts the server
├── config/database.js         # MongoDB connection
├── models/
│   ├── User.js                # name, email, password (hashed), role
│   └── Document.js            # name, category, fileName, filePath, uploadedBy
├── controllers/
│   ├── authController.js      # signup, login, logout
│   └── documentController.js  # upload, list, delete, admin list, admin delete
├── middleware/
│   ├── auth.js                # verifies the JWT, sets req.user
│   └── isAdmin.js             # allows only role "Admin"
├── routes/
│   ├── authRoutes.js
│   └── documentRoutes.js
├── uploads/                   # uploaded files (not committed to Git)
└── public/                    # frontend: HTML pages, css/, js/
```

---

## Run it locally

**Requirements:** Node.js 18+ and MongoDB running locally (or a MongoDB Atlas connection string).

```bash
git clone <your-repo-url>
cd document_management
npm install
```

Create a `.env` file (copy `.env.example`):

```env
PORT=5000
MONGODB_URL=mongodb://127.0.0.1:27017/document_management
JWT_SECRET=replace_with_a_long_random_secret
```

Start the server:

```bash
npm run dev     # development (auto-restart with nodemon)
npm start       # normal start
```

Open **http://localhost:5000**.

### Creating an admin

For security, there is no API to become an admin. Sign up normally, then in MongoDB Compass open `document_management` → `users`, change that user's `role` from `"User"` to `"Admin"`, and **log in again** (the role is read into the token at login).

---

## Security measures

- Passwords hashed with **bcrypt** (never stored or returned in plain text)
- **JWT in an HTTP-only, SameSite=Strict cookie** — not readable by JavaScript
- Secrets (`JWT_SECRET`, `MONGODB_URL`) in `.env`, which is git-ignored
- **Ownership checks**: users can only list and delete their own documents; the owner always comes from the verified token, never from the request
- **Role check** middleware for admin routes; signup ignores any `role` sent by the client
- Upload validation: allowed extensions only (checks the *last* extension, so `file.pdf.exe` is rejected), 5 MB limit, category whitelist
- Uploaded files are renamed (`<timestamp>-<random>.<ext>`) to avoid overwriting and unsafe file names
- Frontend builds tables with `textContent`, so user-entered names cannot inject HTML/JavaScript (XSS)
- Search input is escaped before being used in a MongoDB regex

**Known limitation:** uploaded files are served to any logged-in user who has the exact file URL. A route that checks ownership before sending the file is planned for Version 2.

---

## Future improvements (Version 2)

- Serve files through an ownership-checked route
- Cloud file storage with **Cloudinary**
- Email notifications (welcome email, password reset) with **Nodemailer**
- Pagination for large document lists
- Stronger file validation (check the real file type, not only the extension)
- Upload date, file size and document renaming
