# School Payments Microservice Backend

A robust Node.js/Express/MongoDB-based microservice for handling school fee payments integrated with the Edviron payment gateway.

## Deployed Backend and Frontend

- **Backend URL**: [https://school-payment-microservice-v1.onrender.com](https://school-payment-microservice-v1.onrender.com)
- **Frontend URL**: [https://school-payment-microservice-v1.vercel.app/](https://school-payment-microservice-v1.vercel.app/)
- **Backend Health Check**: [https://school-payment-microservice-v1.onrender.com/](https://school-payment-microservice-v1.onrender.com/)

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration files including database connection
│   ├── controllers/    # Business logic for handling requests
│   │   ├── payment/    # Payment-specific controllers
│   │   └── ...         # Other controller modules
│   ├── middleware/     # Express middleware including authentication
│   ├── models/         # Mongoose data models
│   ├── routes/         # API route definitions
│   ├── app.js          # Express app configuration
│   └── server.js       # Server startup
├── .env                # Environment variables
└── package.json        # Project dependencies and scripts
```

## Prerequisites

- Node.js v18 or newer
- MongoDB account or local MongoDB instance
- Edviron API credentials (for payment processing)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Akshaygupta0409/school-payment-microservice-v1.git
   cd school-payment-microservice-v1/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following configuration:
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

## Running the Server

- **Development mode** (with auto-restart on file changes):
  ```bash
  npm run dev
  ```

- **Production mode**:
  ```bash
  npm start
  ```

## API Endpoints

### Authentication

- **POST /api/auth/login** - User login
  ```json
  // Request body
  {
    "email": "user@example.com",
    "password": "yourpassword"
  }
  
  // Success response (200 OK)
  {
    "token": "jwt_token_here"
  }
  
  // Error response (400 Bad Request)
  {
    "message": "Invalid credentials"
  }
  ```

### Users

- **POST /api/users/register** - Register a new user
  ```json
  // Request body
  {
    "email": "newuser@example.com",
    "password": "securepassword",
    "role": "trustee" // Optional, defaults to "trustee"
  }
  
  // Success response (201 Created)
  {
    "message": "User created successfully",
    "userId": "user_id_here"
  }
  ```

- **GET /api/users** - Get all users (requires authentication)
- **GET /api/users/:id** - Get user by ID (requires authentication)
- **PUT /api/users/:id** - Update user (requires authentication)
- **DELETE /api/users/:id** - Delete user (requires authentication)

### Payments

- **POST /api/payments/create-payment** - Create a new payment (requires authentication)
  ```json
  // Request body
  {
    "amount": 1000,
    "description": "School fees",
    "studentName": "Student Name",
    "studentId": "S123456",
    "className": "Class X",
    "section": "A"
  }
  
  // Success response (200 OK)
  {
    "paymentUrl": "https://payment-gateway-url",
    "orderId": "order_id_here"
  }
  ```

- **GET /api/payments/status/:id** - Check payment status (requires authentication)
- **GET /api/payments/callback** - Payment callback (redirect from payment gateway)
- **POST /api/payments/webhook** - Payment webhook for notifications
- **GET /api/payments/transaction-status/:custom_order_id** - Check transaction status

### Transactions

- **GET /api/transactions** - Get all transactions with filtering and pagination (requires authentication)
  ```
  // Query parameters
  ?page=1&page_size=10&sort_by=created_at&sort_direction=desc
  ```

- **GET /api/transactions/school/:schoolId** - Get transactions by school ID (requires authentication)

## Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API uses standard HTTP status codes:

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

Error responses include a message describing what went wrong.

## Load Capacity

The backend is designed to handle:
- Up to 1000 concurrent users
- Processing 100+ transactions per minute
- 500+ API requests per minute

## Testing with Postman

1. Import the [Postman Collection](https://api.postman.com/collections/school-payments-api) for testing all endpoints
2. Create an environment with variables:
   - `base_url`: https://school-payment-microservice-v1.onrender.com
   - `token`: (after login, store the JWT token here)

## Deployment

The service is currently deployed on Render.com.

1. Create a new Web Service on Render
2. Connect to your GitHub repository
3. Set the build command: `npm install`
4. Set the start command: `npm start`
5. Add all environment variables

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature-name`
5. Open a pull request
