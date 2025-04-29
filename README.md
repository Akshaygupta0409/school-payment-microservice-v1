# School Payment Microservice v1

A full-stack application for managing school payments, featuring a Node.js/Express/MongoDB backend and a React/Vite/Tailwind CSS frontend.

## Table of Contents
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [License](#license)

## Project Structure
```
root/
├── backend/    # Express & MongoDB microservice
└── frontend/   # React & Vite user interface
```

## Technologies
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, dotenv
- **Frontend**: React, Vite, Tailwind CSS
- **Communication**: RESTful API via Axios
- **Tooling**: ESLint, Prettier, Nodemon

## Prerequisites
- Node.js (v18+)
- npm
- MongoDB instance (local or cloud)

## Installation

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## Environment Variables

In `backend/.env`, define:
```
PORT=4000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret>
```

## Running the Application

### Start Backend
```bash
cd backend
npm run dev
```

### Start Frontend
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api

## API Endpoints
- `POST /api/users/register` – Register a new user
- `POST /api/users/login` – Authenticate user
- `GET /api/payments` – List payments
- `POST /api/payments` – Create a new payment

(See `backend/src/routes` for full list.)

## License
MIT License
