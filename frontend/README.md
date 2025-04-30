# School Payments Microservice Frontend

A modern React/Vite/Tailwind CSS frontend application for the School Payments system, featuring a sleek UI, secure authentication, and payment tracking functionality.

## Project Structure

```
frontend/
u251cu2500u2500 public/           # Static assets
u251cu2500u2500 src/
u2502   u251cu2500u2500 assets/       # Images, icons, and other assets
u2502   u251cu2500u2500 components/    # Reusable UI components
u2502   u251cu2500u2500 contexts/      # React context providers
u2502   u251cu2500u2500 hooks/         # Custom React hooks
u2502   u251cu2500u2500 pages/         # Page components
u2502   u251cu2500u2500 utils/         # Utility functions and helpers
u2502   u251cu2500u2500 App.jsx        # Main application component
u2502   u2514u2500u2500 index.jsx      # Application entry point
u251cu2500u2500 vite.config.js     # Vite configuration
u251cu2500u2500 package.json      # Project dependencies and scripts
u2514u2500u2500 tailwind.config.js # Tailwind CSS configuration
```

## Prerequisites

- Node.js v18 or newer
- npm or yarn
- Backend server running (see backend README)

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Akshaygupta0409/school-payment-microservice-v1.git
   cd school-payment-microservice-v1/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure the application by updating `vite.config.js` to ensure it points to your backend server:
   ```javascript
   // vite.config.js
   export default defineConfig({
     // ...
     server: {
       port: 3000,
       proxy: {
         '/api': {
           target: 'http://localhost:4574', // Update this to your backend URL
           changeOrigin: true,
           secure: false
         }
       }
     },
     // ...
   })
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Access the application at [http://localhost:3000](http://localhost:3000)

## Building for Production

```bash
cd frontend
npm run build
```

This will create an optimized build in the `dist` directory that can be deployed to any static hosting service.

## Deployed Application

- **Frontend URL**: [https://school-payment-microservice-v1.vercel.app/](https://school-payment-microservice-v1.vercel.app/)
- **Backend URL**: [https://school-payment-microservice-v1.onrender.com](https://school-payment-microservice-v1.onrender.com)

## Features

### User Authentication

- **Login**: Secure user authentication with JWT
- **Registration**: New user account creation
- **Protected Routes**: Restrict access to authenticated users

### Payment Management

- **Create Payments**: Initiate new school fee payments
- **Track Transactions**: View and monitor payment status
- **Payment History**: Review past transactions

### Dashboard

- **Overview**: Summary of payment activities
- **Analytics**: Visual representation of payment data

## API Integration

The frontend communicates with the backend API using Axios. All API calls are centralized in the `src/utils/axiosConfig.js` file:

```javascript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
```

## User Interface

The application features a modern, responsive design implemented with Tailwind CSS. Key UI components include:

- **Authentication Forms**: Login and registration
- **Payment Form**: For initiating new payments
- **Transaction Table**: For viewing payment history
- **Status Indicators**: Visual cues for payment statuses

## Responsive Design

The UI is fully responsive and optimized for:
- Desktop browsers
- Tablets
- Mobile devices

## Browser Compatibility

Tested and compatible with:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Error Handling

The application includes comprehensive error handling:
- Network error detection
- API error messages
- Form validation feedback
- User-friendly error notifications

## State Management

React Context API is used for global state management, including:
- User authentication state
- Payment data
- UI theme preferences

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to your branch: `git push origin feature-name`
5. Open a pull request
