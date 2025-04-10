# Sleep Olympics API Documentation

This document provides a comprehensive guide to all endpoints in the Sleep Olympics API, including request formats, response structures, and common use cases.

## Base URL

- Development: `http://localhost:5000/api`
- Production: TBD

## Authentication

All authenticated endpoints require a Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

### Authentication Endpoints

#### `POST /auth/register`

Register a new user with a valid invitation code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "username": "sleepchampion",
  "displayName": "Sleep Champion",
  "invitationCode": "abc123def456"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "userId": "firebase-user-id"
}
```

**Use Cases:**
- New user registration with invitation code
- Create initial user profile

#### `GET /auth/me`

Get currently authenticated user data.

**Response (200):**
```json
{
  "user": {
    "email": "user@example.com",
    "username": "sleepchampion",
    "displayName": "Sleep Champion",
    "createdAt": "2023-04-10T12:00:00.000Z",
    "isActive": true,
    "profileData": {...},
    "ouraIntegration": {
      "connected": true,
      "lastSyncDate": "2023-04-10T14:30:00.000Z"
    },
    "notifications": {
      "email": true,
      "inApp": true
    },
    "competitions": {
      "participating": ["comp-id-1", "comp-id-2"],
      "won": ["comp-id-3"]
    }
  }
}
```

**Use Cases:**
- Load user profile data
- Check user's auth status
- Get user preferences

#### `POST /auth/reset-password`

Request a password reset link.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

**Use Cases:**
- Forgot password workflow
- Account recovery

## User Management

### Profile Endpoints

#### `GET /users/profile`

Get the current user's profile.

**Response (200):**
```json
{
  "user": {
    "email": "user@example.com",
    "username": "sleepchampion",
    "displayName": "Sleep Champion",
    "profileData": {
      "gender": "female",
      "age": 28,
      "aboutMe": "Sleep enthusiast!",
      "profilePicture": "https://example.com/pic.jpg"
    }
  }
}
```

**Use Cases:**
- Profile page display
- Account settings

#### `PUT /users/profile`

Update the current user's profile.

**Request Body:**
```json
{
  "displayName": "Sleep Master",
  "profileData": {
    "gender": "female",
    "age": 29,
    "aboutMe": "Professional sleeper!",
    "profilePicture": "https://example.com/new-pic.jpg"
  }
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully",
  "updated": {
    "displayName": "Sleep Master",
    "profileData": {
      "gender": "female",
      "age": 29,
      "aboutMe": "Professional sleeper!",
      "profilePicture": "https://example.com/new-pic.jpg"
    }
  }
}
```

**Use Cases:**
- Edit profile information
- Update bio or avatar

### Notification Preferences

#### `GET /users/notifications`

Get user notification preferences.

**Response (200):**
```json
{
  "notifications": {
    "email": true,
    "inApp": true
  }
}
```

**Use Cases:**
- Show notification settings
- Check user communication preferences

#### `PUT /users/notifications`

Update notification preferences.

**Request Body:**
```json
{
  "email": false,
  "inApp": true
}
```

**Response (200):**
```json
{
  "message": "Notification preferences updated",
  "updated": {
    "email": false,
    "inApp": true
  }
}
```

**Use Cases:**
- Toggle email notifications
- Toggle in-app notifications

### Oura Integration

#### `POST /users/oura/connect`

Connect Oura Ring to user account.

**Request Body:**
```json
{
  "apiKey": "oura-api-key"
}
```

**Response (200):**
```json
{
  "message": "Oura ring connected successfully",
  "status": "connected"
}
```

**Use Cases:**
- Initial Oura setup
- Reconnecting Oura after token expiration

#### `GET /users/oura/status`

Get Oura connection status.

**Response (200):**
```json
{
  "ouraIntegration": {
    "connected": true,
    "lastSyncDate": "2023-04-10T14:30:00.000Z"
  }
}
```

**Use Cases:**
- Check if user has connected their Oura Ring
- Check when last sync occurred

## Sleep Data

### Sleep Data Endpoints

#### `GET /sleep/data/:date`

Get sleep data for a specific date (format: YYYY-MM-DD).

**Response (200):**
```json
{
  "sleepData": {
    "date": "2023-04-10T00:00:00.000Z",
    "ouraScore": 85,
    "metrics": {
      "totalSleepTime": 420,
      "efficiency": 95,
      "deepSleep": 90,
      "remSleep": 120,
      "lightSleep": 210,
      "latency": 15,
      "heartRate": {
        "average": 58,
        "lowest": 52
      },
      "hrv": 45,
      "respiratoryRate": 15.2
    },
    "tags": ["exercise", "caffeine-free"],
    "notes": "Went to bed early after a workout."
  }
}
```

**Use Cases:**
- Display daily sleep details
- View specific night's sleep metrics

#### `GET /sleep/data?startDate=2023-04-01&endDate=2023-04-10`

Get sleep data for a date range.

**Response (200):**
```json
{
  "sleepData": [
    {
      "id": "2023-04-01",
      "date": "2023-04-01T00:00:00.000Z",
      "ouraScore": 82,
      "metrics": {...}
    },
    {
      "id": "2023-04-02",
      "date": "2023-04-02T00:00:00.000Z",
      "ouraScore": 87,
      "metrics": {...}
    }
    // more sleep records...
  ]
}
```

**Use Cases:**
- Generate sleep trend charts
- Display weekly or monthly sleep data

#### `POST /sleep/sync`

Sync sleep data from Oura Ring.

**Response (200):**
```json
{
  "message": "Sleep data synchronized successfully",
  "recordsProcessed": 5
}
```

**Use Cases:**
- Manual sync of Oura data
- Initial data import
- Refresh data after connection issues

#### `POST /sleep/data/:date/note`

Add a note or tags to sleep data for a specific date.

**Request Body:**
```json
{
  "note": "Tried a new sleep routine with meditation",
  "tags": ["meditation", "blackout-curtains"]
}
```

**Response (200):**
```json
{
  "message": "Sleep note added successfully"
}
```

**Use Cases:**
- Annotate sleep records
- Add context to sleep data for analysis

#### `GET /sleep/summary`

Get aggregated sleep summary statistics.

**Response (200):**
```json
{
  "sleepSummary": {
    "dailyAverage": {
      "currentMonth": 85.3,
      "previousMonth": 82.6,
      "overall": 83.7
    },
    "weeklyTrend": [
      { "week": "2023-03-13", "average": 81.2 },
      { "week": "2023-03-20", "average": 82.5 },
      { "week": "2023-03-27", "average": 84.1 },
      { "week": "2023-04-03", "average": 85.3 }
    ],
    "monthlyTrend": [
      { "month": "2022-11", "average": 79.8 },
      { "month": "2022-12", "average": 80.3 },
      // more months...
    ],
    "bestScore": 94,
    "worstScore": 62,
    "improvement": {
      "monthly": 2.7,
      "overall": 5.5
    },
    "lastUpdated": "2023-04-10T14:30:00.000Z"
  }
}
```

**Use Cases:**
- Dashboard statistics display
- Progress tracking
- Historical trend analysis

## Competitions

### Competition Endpoints

#### `GET /competitions?status=active`

Get all competitions, optionally filtered by status (active, upcoming, completed).

**Response (200):**
```json
{
  "competitions": [
    {
      "id": "comp-id-1",
      "title": "April Sleep Challenge",
      "description": "Improve your sleep score by 5 points this month",
      "type": "improvement",
      "startDate": "2023-04-01T00:00:00.000Z",
      "endDate": "2023-04-30T23:59:59.000Z",
      "status": "active",
      "rules": {
        "scoringMethod": "Highest improvement in sleep score",
        "eligibilityCriteria": {
          "minimumTrackedNights": 5,
          "minimumTenureDays": 7
        }
      },
      "prizes": [
        {
          "rank": 1,
          "description": "Premium Sleep Mask",
          "value": 50
        }
      ],
      "participants": ["user-id-1", "user-id-2"],
      "winners": []
    }
    // more competitions...
  ]
}
```

**Use Cases:**
- Show available competitions
- Display competition dashboard
- Filter competitions by status

#### `GET /competitions/:competitionId`

Get details for a specific competition.

**Response (200):**
```json
{
  "competition": {
    "id": "comp-id-1",
    "title": "April Sleep Challenge",
    "description": "Improve your sleep score by 5 points this month",
    "type": "improvement",
    "startDate": "2023-04-01T00:00:00.000Z",
    "endDate": "2023-04-30T23:59:59.000Z",
    "status": "active",
    "rules": {...},
    "prizes": [...],
    "participants": [...],
    "winners": [...]
  }
}
```

**Use Cases:**
- View competition details
- Check competition rules and prizes

#### `POST /competitions/:competitionId/join`

Join a competition.

**Response (200):**
```json
{
  "message": "Successfully joined the competition"
}
```

**Use Cases:**
- Sign up for a new competition
- Enter a challenge

#### `POST /competitions/:competitionId/leave`

Leave a competition.

**Response (200):**
```json
{
  "message": "Successfully left the competition"
}
```

**Use Cases:**
- Withdraw from a competition
- Cancel participation

#### `GET /competitions/:competitionId/leaderboard`

Get the leaderboard for a competition.

**Response (200):**
```json
{
  "leaderboard": {
    "id": "leaderboard-id",
    "generatedAt": "2023-04-10T14:30:00.000Z",
    "isLatest": true,
    "rankings": [
      {
        "userId": "user-id-1",
        "username": "sleepmaster",
        "displayName": "Sleep Master",
        "rank": 1,
        "previousRank": 2,
        "score": 87.5,
        "change": 2.3
      },
      {
        "userId": "user-id-2",
        "username": "dreamchaser",
        "displayName": "Dream Chaser",
        "rank": 2,
        "previousRank": 1,
        "score": 86.2,
        "change": -0.5
      }
      // more rankings...
    ]
  }
}
```

**Use Cases:**
- Display competition standings
- Show user rankings
- Track position changes

#### `GET /competitions/user/me`

Get competitions the current user is participating in or has won.

**Response (200):**
```json
{
  "competitions": {
    "participating": [
      {
        "id": "comp-id-1",
        "title": "April Sleep Challenge",
        "status": "active",
        "startDate": "2023-04-01T00:00:00.000Z",
        "endDate": "2023-04-30T23:59:59.000Z"
        // other competition data...
      }
    ],
    "won": [
      {
        "id": "comp-id-3",
        "title": "March Deep Sleep Challenge",
        "status": "completed",
        "startDate": "2023-03-01T00:00:00.000Z",
        "endDate": "2023-03-31T23:59:59.000Z"
        // other competition data...
      }
    ]
  }
}
```

**Use Cases:**
- Show user's active competitions
- Display user's past victories
- Track participation history

### Admin Competition Endpoints

#### `POST /competitions`

**Admin only:** Create a new competition.

**Request Body:**
```json
{
  "title": "May Sleep Improvement Challenge",
  "description": "Improve your sleep quality in May",
  "type": "improvement",
  "startDate": "2023-05-01T00:00:00.000Z",
  "endDate": "2023-05-31T23:59:59.000Z",
  "rules": {
    "scoringMethod": "Highest overall improvement",
    "eligibilityCriteria": {
      "minimumTrackedNights": 10,
      "minimumTenureDays": 14
    }
  },
  "prizes": [
    {
      "rank": 1,
      "description": "Sleep Tech Bundle",
      "value": 100
    },
    {
      "rank": 2,
      "description": "Sleep Sounds Premium Subscription",
      "value": 50
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Competition created successfully",
  "competitionId": "new-comp-id"
}
```

**Use Cases:**
- Create monthly challenges
- Set up special event competitions

#### `PUT /competitions/:competitionId`

**Admin only:** Update a competition.

**Request Body:**
```json
{
  "title": "Updated May Sleep Challenge",
  "description": "Updated description",
  "prizes": [
    {
      "rank": 1,
      "description": "Updated Grand Prize",
      "value": 150
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Competition updated successfully",
  "updated": ["title", "description", "prizes"]
}
```

**Use Cases:**
- Modify competition details
- Update prizes or rules
- Extend deadlines

#### `PUT /competitions/:competitionId/winners`

**Admin only:** Update competition winners.

**Request Body:**
```json
{
  "winners": [
    {
      "userId": "user-id-1",
      "rank": 1,
      "score": 94.5,
      "prizeStatus": "pending"
    },
    {
      "userId": "user-id-2",
      "rank": 2,
      "score": 92.1,
      "prizeStatus": "pending"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Competition winners updated successfully"
}
```

**Use Cases:**
- Finalize competition results
- Assign winners and prizes
- Update prize fulfillment status

## Notifications

### Notification Endpoints

#### `GET /notifications?limit=10&offset=0&unreadOnly=true`

Get user notifications with pagination.

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notif-id-1",
      "type": "achievement",
      "title": "New Personal Best!",
      "message": "You achieved your highest sleep score ever: 95!",
      "createdAt": "2023-04-10T10:15:00.000Z",
      "read": false,
      "data": {
        "achievementId": "best-score"
      }
    },
    {
      "id": "notif-id-2",
      "type": "competition",
      "title": "Competition Starting Soon",
      "message": "The May Sleep Challenge starts tomorrow!",
      "createdAt": "2023-04-09T16:30:00.000Z",
      "read": false,
      "data": {
        "competitionId": "comp-id-4"
      }
    }
    // more notifications...
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Use Cases:**
- Display notification center
- Show unread notifications

#### `PUT /notifications/:notificationId/read`

Mark a notification as read.

**Response (200):**
```json
{
  "message": "Notification marked as read"
}
```

**Use Cases:**
- Mark individual notifications
- Update read status on click

#### `PUT /notifications/read-all`

Mark all notifications as read.

**Response (200):**
```json
{
  "message": "All notifications marked as read",
  "count": 5
}
```

**Use Cases:**
- "Mark all as read" button functionality
- Clear notification badges

#### `GET /notifications/unread-count`

Get the count of unread notifications.

**Response (200):**
```json
{
  "unreadCount": 3
}
```

**Use Cases:**
- Display notification badges
- Check for new notifications

#### `DELETE /notifications/:notificationId`

Delete a notification.

**Response (200):**
```json
{
  "message": "Notification deleted"
}
```

**Use Cases:**
- Remove unwanted notifications
- Clear notification history

### Admin Notification Endpoints

#### `POST /notifications/admin/create`

**Admin only:** Create a notification for a user.

**Request Body:**
```json
{
  "userId": "user-id-1",
  "type": "system",
  "title": "Welcome to the Elite Program",
  "message": "You've been selected for our elite sleep program!",
  "data": {
    "programId": "elite-sleep-2023"
  }
}
```

**Response (201):**
```json
{
  "message": "Notification created successfully",
  "notificationId": "new-notif-id"
}
```

**Use Cases:**
- Send targeted notifications
- Deliver personalized messages

#### `POST /notifications/admin/bulk-create`

**Admin only:** Create notifications for multiple users.

**Request Body:**
```json
{
  "userIds": ["user-id-1", "user-id-2", "user-id-3"],
  "type": "announcement",
  "title": "New Feature Available",
  "message": "Check out our new sleep analysis tools!",
  "data": {
    "featureId": "advanced-analysis"
  }
}
```

**Response (201):**
```json
{
  "message": "Bulk notifications created successfully",
  "count": 3
}
```

**Use Cases:**
- Send announcements
- System-wide notifications
- New feature alerts

## Invitations

### Invitation Endpoints

#### `GET /invitations/validate/:code`

Validate an invitation code (public endpoint).

**Response (200):**
```json
{
  "valid": true,
  "email": "invited@example.com",
  "expiresAt": "2023-05-10T00:00:00.000Z"
}
```

**Use Cases:**
- Check invitation validity
- Show invitation details during registration

#### `POST /invitations/accept`

Accept an invitation (used during registration).

**Request Body:**
```json
{
  "code": "abc123def456"
}
```

**Response (200):**
```json
{
  "message": "Invitation accepted successfully"
}
```

**Use Cases:**
- Confirm invitation acceptance
- Claim invitation during signup

### Admin Invitation Endpoints

#### `POST /invitations`

**Admin only:** Create a new invitation.

**Request Body:**
```json
{
  "email": "invite@example.com"
}
```

**Response (201):**
```json
{
  "message": "Invitation created successfully",
  "invitationId": "inv-id-1",
  "invitationCode": "xyz789abc012"
}
```

**Use Cases:**
- Invite new users
- Generate invitation codes

#### `GET /invitations?status=sent`

**Admin only:** Get all invitations, optionally filtered by status.

**Response (200):**
```json
{
  "invitations": [
    {
      "id": "inv-id-1",
      "email": "invite1@example.com",
      "status": "sent",
      "createdAt": "2023-04-05T10:00:00.000Z",
      "expiresAt": "2023-05-05T10:00:00.000Z",
      "invitedBy": "admin-user-id",
      "code": "abc123def456"
    },
    {
      "id": "inv-id-2",
      "email": "invite2@example.com",
      "status": "accepted",
      "createdAt": "2023-04-01T14:30:00.000Z",
      "expiresAt": "2023-05-01T14:30:00.000Z",
      "invitedBy": "admin-user-id",
      "code": "ghi789jkl012"
    }
    // more invitations...
  ]
}
```

**Use Cases:**
- Manage invitation system
- Track sent invitations
- View invitation status

#### `PUT /invitations/:invitationId/revoke`

**Admin only:** Revoke an invitation.

**Response (200):**
```json
{
  "message": "Invitation revoked successfully"
}
```

**Use Cases:**
- Cancel sent invitations
- Revoke unused invitation codes

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "error": "Descriptive error message"
}
```

Common HTTP status codes:

- `400` - Bad Request: Invalid input, validation errors
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: Insufficient permissions
- `404` - Not Found: Resource doesn't exist
- `500` - Internal Server Error: Server-side issues

## Request Limits

- Maximum date range for sleep data: 30 days
- Maximum pagination limit: 100 items
- Rate limiting: 100 requests per minute per user