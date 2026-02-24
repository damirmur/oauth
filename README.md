# OAuth Authentication Service

A Node.js authentication and authorization service using Express, JWT, and bcrypt.

## Features

- User registration and login
- JWT token generation and verification
- Password hashing with bcrypt
- Environment configuration with dotenv
- CORS, security headers, and request logging

## Prerequisites

- Node.js 24+
- npm

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server with nodemon for development
- `npm test` - Run tests

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
```

## API Endpoints

- `GET /` - Health check
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login an existing user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

## Project Structure

```
oauth/
├── server.js
├── .env
├── .gitignore
├── package.json
├── README.md
└── controllers/
└── middleware/
└── models/
└── routes/
```

## Security

- Passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Security headers are set using helmet
- CORS is configured for cross-origin requests
