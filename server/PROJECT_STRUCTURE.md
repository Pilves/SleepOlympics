# Sleep Olympics Backend Structure

This document outlines the complete structure of the Sleep Olympics backend and provides a recommended development sequence for building the project from scratch.

## Complete Project Structure

```
server/
  ├── controllers/
  │   ├── authController.js       # Authentication logic
  │   ├── competitionController.js # Competition management
  │   ├── invitationController.js # Invitation system
  │   ├── notificationController.js # Notification handling
  │   ├── sleepController.js      # Sleep data processing
  │   └── userController.js       # User profile management
  │
  ├── middleware/
  │   └── auth.js                 # Authentication middleware
  │
  ├── routes/
  │   ├── auth.js                 # Authentication routes
  │   ├── competitions.js         # Competition routes
  │   ├── invitations.js          # Invitation routes
  │   ├── notifications.js        # Notification routes
  │   ├── sleep.js                # Sleep data routes
  │   └── users.js                # User profile routes
  │
  ├── utils/                      # Utility functions (future use)
  │
  ├── .env                        # Environment variables
  ├── .gitignore                  # Files to ignore in git
  ├── API_DOCUMENTATION.md        # API documentation
  ├── IMPLEMENTATION.md           # Implementation details
  ├── PROJECT_STRUCTURE.md        # This file
  ├── index.js                    # Main application entry point
  ├── package-lock.json           # Dependency lock file
  ├── package.json                # Project metadata and dependencies
  ├── serviceAccountKey.json      # Firebase credentials (not in repo)
  └── serviceAccountKey.json.example # Template for Firebase credentials
```

## Recommended Development Sequence

If starting from scratch, here's the recommended sequence for developing the Sleep Olympics backend:

### 1. Project Setup (Foundation)

1. `package.json` - Initialize project and define dependencies
2. `.env` - Environment variables configuration
3. `serviceAccountKey.json.example` - Template for Firebase credentials
4. `.gitignore` - Prevent sensitive files from being committed

### 2. Core Application Structure

5. `index.js` - Main entry point with Express setup
6. `middleware/auth.js` - Authentication middleware

### 3. Authentication System

7. `controllers/authController.js` - Core authentication logic
8. `routes/auth.js` - Authentication routes

### 4. User Management

9. `controllers/userController.js` - User profile management
10. `routes/users.js` - User-related routes

### 5. Sleep Data Infrastructure

11. `controllers/sleepController.js` - Sleep data processing
12. `routes/sleep.js` - Sleep data routes

### 6. Competition System

13. `controllers/competitionController.js` - Competition management
14. `routes/competitions.js` - Competition routes

### 7. Notification System

15. `controllers/notificationController.js` - Notification handling
16. `routes/notifications.js` - Notification routes

### 8. Invitation System 

17. `controllers/invitationController.js` - Invitation management
18. `routes/invitations.js` - Invitation routes

### 9. Documentation

19. `API_DOCUMENTATION.md` - Document all endpoints and use cases
20. `IMPLEMENTATION.md` - Document implementation details and next steps

## Development Rationale

This development sequence follows a logical progression that allows for incremental testing and expansion:

1. **Start with core infrastructure**: Set up the project, dependencies, and entry point
2. **Authentication first**: User identity is fundamental to almost all other features
3. **User management next**: Profile data is needed for many other features
4. **Core domain logic**: Sleep data is the central feature of the application
5. **Social features**: Build competitions once the core data structure is in place
6. **Supporting systems**: Notifications and invitations enhance the user experience
7. **Documentation last**: Document the complete system once all components are in place

## Modular Design Benefits

The modular structure of the Sleep Olympics backend provides several benefits:

1. **Separation of concerns**: Each component has a clear, focused responsibility
2. **Maintainability**: Changes to one feature won't affect others
3. **Testability**: Components can be tested independently
4. **Scalability**: New features can be added without restructuring
5. **Team collaboration**: Multiple developers can work on different components

## Implementation Dependencies

When implementing in the recommended sequence, note these important dependencies:

- `authController.js` depends on `auth.js` middleware for protected routes
- `sleepController.js` depends on user information from `userController.js`
- `competitionController.js` depends on sleep data from `sleepController.js`
- `notificationController.js` may interact with multiple other controllers
- All controllers depend on Firebase/Firestore database connections established in `index.js`

## Potential Future Enhancements

As the project evolves, consider these structural additions:

1. `utils/` directory for shared utility functions:
   - `validators.js` - Input validation helpers
   - `formatters.js` - Data formatting utilities
   - `logger.js` - Consistent logging infrastructure

2. `services/` directory for business logic:
   - `sleepAnalysisService.js` - Complex sleep data analysis
   - `leaderboardService.js` - Leaderboard generation algorithms
   - `ouraService.js` - Oura API integration

3. `models/` directory for data models:
   - Database schema definitions
   - Data validation rules
   - Type definitions

4. `tests/` directory for automated tests:
   - Unit tests for controllers
   - Integration tests for API endpoints
   - Mock fixtures for testing

These enhancements would further improve the code organization as the application grows in complexity.