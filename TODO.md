# MVC Reorganization TODO

## Phase 1: Models
- [x] Create models/User.js - User database operations
- [x] Create models/Mail.js - Mail utility functions

## Phase 2: Middleware
- [x] Create middleware/authMiddleware.js - JWT verification
- [x] Create middleware/guestMiddleware.js - Redirect authenticated users

## Phase 3: Controllers
- [x] Create controllers/authController.js - Authentication logic
- [x] Create controllers/userController.js - User profile logic
- [x] Create controllers/mailController.js - Mail page logic

## Phase 4: Routes
- [x] Create routes/auth.js - Authentication routes
- [x] Create routes/user.js - User profile routes
- [x] Update routes/mail.js - Use controller

## Phase 5: Server
- [x] Update server.js - Import and use new routes/middleware

