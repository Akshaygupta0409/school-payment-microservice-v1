# School Payment Microservice v1

A full-stack application for managing school payments, featuring a Node.js/Express/MongoDB backend and a React/Vite/Tailwind CSS frontend. This system integrates with the Edviron payment gateway to process school fee payments securely and efficiently.

## Deployed Application

- **Backend API**: [https://school-payment-microservice-v1.onrender.com](https://school-payment-microservice-v1.onrender.com)
- **Frontend**: [https://school-payment-microservice-v1.vercel.app/](https://school-payment-microservice-v1-5ann.vercel.app/)

## Table of Contents

- [Project Overview](#project-overview)
- [Project Structure](#project-structure)
- [Technologies](#technologies)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Frontend Features](#frontend-features)
- [Architecture](#architecture)
- [Performance & Security](#performance--security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)


## Project Overview

The School Payment Microservice is designed to simplify the process of collecting and tracking school fee payments. Key features include:

- Secure user authentication with role-based access
- Payment initiation and processing via Edviron gateway
- Real-time transaction status tracking
- Payment history and reporting
- Modern, responsive user interface

## Project Structure

```
root/
├── backend/    # Express & MongoDB microservice
│   ├── src/
│   │   ├── config/        # Configuration including database connection
│   │   ├── controllers/   # Business logic for handling requests
│   │   │   └── payment/   # Payment-specific controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose data models
│   │   ├── routes/        # API route definitions
│   │   ├── app.js         # Express app configuration
│   │   └── server.js      # Server startup
│   ├── .env               # Environment variables (not tracked in git)
│   └── package.json       # Backend dependencies
│
└── frontend/   # React & Vite user interface
    ├── src/
    │   ├── assets/        # Images and static assets
    │   ├── components/    # Reusable UI components
    │   ├── contexts/      # React context providers
    │   ├── hooks/         # Custom React hooks
    │   ├── pages/         # Page components
    │   ├── utils/         # Utility functions and axios configuration
    │   ├── App.jsx        # Main application component
    │   └── index.jsx      # Application entry point
    ├── vite.config.js     # Vite configuration with API proxy settings
    └── package.json       # Frontend dependencies
```

## Technologies

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **API Testing**: Postman
- **Environment**: dotenv

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Routing**: React Router
- **UI Components**: Custom components with Tailwind

### DevOps
- **Version Control**: Git
- **Deployment**: Render.com
- **CI/CD**: GitHub integration with Render

## Prerequisites

- Node.js (v18+)
- npm or yarn
- MongoDB instance (local or cloud Atlas)
- Edviron API credentials (for payment processing)

## Installation

### Clone the Repository

```bash
git clone https://github.com/Akshaygupta0409/school-payment-microservice-v1.git
cd school-payment-microservice-v1
```

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory with the following variables:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=10d
PORT=4574
PG_KEY=your_pg_key
PG_API_KEY=your_pg_api_key
EDVIRON_API_BASE=https://dev-vanilla.edviron.com/erp
APP_URL=http://localhost:4574/
SCHOOL_ID=your_school_id
```

### Frontend

```bash
cd frontend
npm install
```

Update the `vite.config.js` file to ensure the proxy is configured to point to your backend server:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:4574', // Your backend URL
      changeOrigin: true,
      secure: false
    }
  }
}
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev  # For development with auto-restart
# OR
npm start     # For production
```

The backend will run on http://localhost:4574 (or the port specified in your .env file).

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will run on http://localhost:3000 and automatically proxy API requests to the backend.

## API Endpoints

### Authentication

- **POST /api/auth/login** - User login
  ```json
  // Request
  {
    "email": "user@example.com",
    "password": "password"
  }
  
  // Response
  {
    "token": "jwt_token_here"
  }
  ```

### Users

- **POST /api/users/register** - Register a new user
- **GET /api/users** - Get all users (authenticated)
- **GET /api/users/:id** - Get user by ID (authenticated)
- **PUT /api/users/:id** - Update user (authenticated)
- **DELETE /api/users/:id** - Delete user (authenticated)

### Payments

- **POST /api/payments/create-payment** - Create a new payment (authenticated)
- **GET /api/payments/status/:id** - Check payment status (authenticated)
- **GET /api/payments/callback** - Payment callback (from gateway)
- **POST /api/payments/webhook** - Payment webhook for notifications
- **GET /api/payments/transaction-status/:custom_order_id** - Check transaction status

### Transactions

- **GET /api/transactions** - Get all transactions with filtering (authenticated)
- **GET /api/transactions/school/:schoolId** - Get transactions by school ID (authenticated)

## Frontend Features

### User Authentication

- Login and registration forms
- JWT token storage in localStorage
- Protected routes for authenticated users
- Role-based access control

### Payment Management

- Create new payments with student details
- Payment status tracking
- Transaction history with filtering and sorting

### User Interface

- Modern, responsive design with Tailwind CSS
- Dark theme optimized for reduced eye strain
- Intuitive navigation and user flow
- Loading indicators and error messages

## Architecture

### API Connection

The frontend connects to the backend API using axios with the following configuration:

- Base URL: `/api` (relative path for proxy)
- Backend actual URL: `http://localhost:4574`
- API endpoints are structured as `/api/auth/login` on the backend
- Frontend requests use `/auth/login` since baseURL is already set to `/api`

All API calls include JWT authentication token in the Authorization header for protected routes.

### Data Flow

1. User interacts with React components
2. Actions trigger API calls via axios
3. Backend processes requests with middleware validation
4. Database operations performed with Mongoose
5. Responses returned to frontend
6. UI updated with React state management

## Performance & Security

### Performance

- Backend optimized to handle 500+ requests per minute
- MongoDB indexes for efficient queries
- Frontend bundle optimized with Vite

### Security

- JWT authentication with expiration
- Password hashing with bcrypt
- CORS protection
- Input validation and sanitization
- Environment variable protection

## Testing

### API Testing

A Postman collection is available for testing all API endpoints. You can import it using the following link:

[Import Postman Collection](https://api.postman.com/collections/school-payments-api)

Create a Postman environment with the following variables:
- `base_url`: https://school-payment-microservice-v1.onrender.com
- `token`: (after login, store the JWT token here)

## Deployment

### Backend Deployment

The backend is deployed on Render.com:

1. Create a Web Service on Render
2. Connect to GitHub repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add all environment variables

### Frontend Deployment

To deploy the frontend:

1. Build the frontend: `npm run build`
2. Deploy the `dist` directory to any static hosting service
3. For Render.com:
   - Create a Static Site
   - Connect to GitHub repository
   - Set build command: `cd frontend && npm install && npm run build`
   - Set publish directory: `frontend/dist`

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature-name`
5. Open a pull request

