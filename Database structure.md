# Sleep Olympics: Firebase Database Structure

This document provides a comprehensive breakdown of the Firebase database structure for the Sleep Olympics platform. For each collection, we explain the purpose, detail each field, and describe how and where each field will be utilized throughout the application.

## 1. Users Collection

**Path**: `users/{userId}`

**Purpose**: This collection stores all user profile information, preferences, and integration statuses. It serves as the central repository for user-specific data.

| Field                          | Type          | Description                    | Usage                                                                                                                                                 |
| ------------------------------ | ------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `email`                        | String        | User's email address           | Used for account recovery, notifications, and as a unique identifier for invitations. This is the primary contact method.                             |
| `username`                     | String        | Unique username                | Displayed on leaderboards and profiles. Used for @mentions in community features. Must be unique across the platform.                                 |
| `displayName`                  | String        | Public display name            | Shown on leaderboards and public profiles. May be the same as username. Allows users to have a friendly name while keeping username unique.           |
| `createdAt`                    | Timestamp     | Account creation date          | Used for calculating user tenure, determining eligibility for "newcomer" competitions, and analytics on user acquisition.                             |
| `isActive`                     | Boolean       | Account status                 | Controls whether the user can log in and participate in competitions. Used for account deactivation without deletion.                                 |
| `profileData.gender`           | String        | User's gender (optional)       | Used for optional demographic analytics and potentially for gender-specific leaderboards or insights.                                                 |
| `profileData.age`              | Number        | User's age (optional)          | Used for optional demographic analytics and age-group leaderboards. Can help provide age-appropriate sleep recommendations.                           |
| `profileData.aboutMe`          | String        | User bio (optional)            | Displayed on public profile to foster community connections. Limited character count to avoid abuse.                                                  |
| `profileData.profilePicture`   | String        | Profile image URL (optional)   | Displayed on profiles and leaderboards. Stored as URL to a Firebase Storage location.                                                                 |
| `ouraIntegration.connected`    | Boolean       | Oura connection status         | Determines if the user has successfully connected their Oura ring. Controls access to competitions and features requiring sleep data.                 |
| `ouraIntegration.lastSyncDate` | Timestamp     | Last successful data sync      | Used to identify stale data and prompt users to resync. Also used to calculate sync frequency for analytics.                                          |
| `ouraIntegration.apiKeyHash`   | String        | Secured API key reference      | Securely stored reference to the Oura API key. Actual API key should be stored in a secure, encrypted storage solution, not directly in the database. |
| `notifications.email`          | Boolean       | Email notification preference  | Controls whether the user receives email notifications about competitions, achievements, etc.                                                         |
| `notifications.inApp`          | Boolean       | In-app notification preference | Controls whether the user receives in-app notifications about competitions, achievements, etc.                                                        |
| `competitions.participating`   | Array<String> | Competition IDs user is in     | Used to quickly determine which competitions a user is participating in without querying the competitions collection.                                 |
| `competitions.won`             | Array<String> | Competition IDs user has won   | Used to display achievements and track user success history. Facilitates "Hall of Fame" features.                                                     |

**Access Patterns**:
- User authentication and profile retrieval
- User profile editing
- Oura integration status checks
- Competition eligibility verification

## 2. Sleep Data Collection

**Path**: `sleepData/{userId}/daily/{dateId}`

**Purpose**: Stores detailed sleep data imported from the Oura ring for each user, with one document per night of sleep. This is the primary data set that powers competition scoring and analytics.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `date` | Timestamp | Date of the sleep record | Used to organize sleep data chronologically and for date-based queries. Key field for time-series analysis. |
| `ouraScore` | Number | Overall sleep score from Oura | The primary score used for most competitions and leaderboards. Provides a single metric for sleep quality. |
| `metrics.totalSleepTime` | Number | Minutes of sleep | Used for calculating sleep duration achievements and specialized competitions focused on sleep quantity. |
| `metrics.efficiency` | Number | Sleep efficiency percentage | Used for efficiency-focused competitions and to provide insights on sleep quality vs. time in bed. |
| `metrics.deepSleep` | Number | Minutes of deep sleep | Used for deep sleep competitions and to provide insights on restorative sleep. Critical for serious sleep improvers. |
| `metrics.remSleep` | Number | Minutes of REM sleep | Used for REM sleep competitions and to provide insights on cognitive processing during sleep. |
| `metrics.lightSleep` | Number | Minutes of light sleep | Used to provide complete sleep cycle analysis. Less emphasized in competitions but important for full picture. |
| `metrics.latency` | Number | Time to fall asleep in minutes | Used for "Fall Asleep Fast" challenges and to identify sleep onset issues. Lower is generally better. |
| `metrics.heartRate.average` | Number | Average heart rate during sleep | Used for cardiovascular health indicators and sleep quality analysis. Can indicate stress or recovery issues. |
| `metrics.heartRate.lowest` | Number | Lowest heart rate during sleep | Used as an indicator of cardiovascular fitness and recovery status. Important metric for athletes. |
| `metrics.hrv` | Number | Heart rate variability | Used for stress and recovery analysis. Higher generally indicates better recovery. Used in specialized wellness competitions. |
| `metrics.respiratoryRate` | Number | Breaths per minute | Used for respiratory health monitoring. Can indicate potential sleep apnea issues when elevated. |
| `tags` | Array<String> | User-added context tags | Allows users to tag sleep records with contextual information (exercise day, alcohol, travel, etc.) for pattern analysis. |
| `notes` | String | User notes about their sleep | Enables users to add qualitative context to their sleep data for personal tracking and reflection. |

**Access Patterns**:
- Daily sleep data retrieval for dashboard
- Historical trend analysis
- Competition score calculations
- Sleep improvement tracking

## 3. Sleep Summaries Collection

**Path**: `sleepSummaries/{userId}`

**Purpose**: Contains pre-calculated aggregations of sleep data to improve read performance and enable efficient leaderboard generation and trend analysis without repeated calculation.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `dailyAverage.currentMonth` | Number | Current month average sleep score | Used for quick display on dashboards and for determining monthly improvements without recalculation. |
| `dailyAverage.previousMonth` | Number | Previous month average sleep score | Used as a baseline for measuring improvement in the current month. Key for "Most Improved" competitions. |
| `dailyAverage.overall` | Number | Overall average since joining | Used for lifetime achievement tracking and to establish a user's baseline sleep quality. |
| `weeklyTrend` | Array | Last 4 weeks of average scores | Used for generating trend charts on dashboards without recalculation. Shows short-term progress visually. |
| `monthlyTrend` | Array | Last 6 months of average scores | Used for generating longer-term trend charts without recalculation. Shows season and lifestyle changes over time. |
| `bestScore` | Number | User's all-time best sleep score | Used for "Personal Best" achievements and as a target for improvement goals. Motivational reference point. |
| `worstScore` | Number | User's all-time worst sleep score | Used to show improvement from lowest point and to identify potential problem patterns. |
| `improvement.monthly` | Number | Improvement from beginning to end of current month | Used for "Most Improved" competitions and to highlight progress on the dashboard. Key motivational metric. |
| `improvement.overall` | Number | Overall improvement since joining | Used to show long-term benefit of the platform. Key retention and motivation metric. |
| `lastUpdated` | Timestamp | When this summary was last calculated | Used to determine if the summary data needs refreshing based on new sleep data imports. |

**Access Patterns**:
- Dashboard performance charts
- Quick statistics display
- Improvement competition calculations
- Monthly progress reporting

## 4. Competitions Collection

**Path**: `competitions/{competitionId}`

**Purpose**: Manages all competition details, including rules, dates, participants, and results. This is the central collection for the gamification aspects of the platform.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `title` | String | Competition name | Displayed in competition listings, notifications, and marketing materials. Should be engaging and descriptive. |
| `description` | String | Competition details | Explains the competition goals, motivations, and special rules. Provides context and generates interest. |
| `type` | String | Type of competition | Determines scoring method (improvement, highest score, etc.). Controls which leaderboard algorithm is used. |
| `startDate` | Timestamp | Start date of competition | Used to determine eligibility of sleep data for scoring and to display competition schedule. |
| `endDate` | Timestamp | End date of competition | Used to finalize competition results and transition status. Controls display in upcoming/active/past views. |
| `status` | String | "upcoming", "active", "completed" | Controls visibility and functionality in the UI. Determines whether users can join, view results, etc. |
| `rules.scoringMethod` | String | How winners are determined | Detailed explanation of how scores are calculated. Creates transparency in competition mechanics. |
| `rules.eligibilityCriteria` | Map | Requirements to qualify | Defines minimum requirements (e.g., number of tracked nights, tenure on platform) to be eligible. |
| `prizes` | Array | Details of prizes for winners | Lists prizes by rank with descriptions and values. Creates motivation for participation. |
| `prizes[].rank` | Number | Position (1st, 2nd, etc.) | Specifies which position receives this prize. Used for displaying prize distribution. |
| `prizes[].description` | String | Prize description | Describes the prize in detail. Used in competition promotion and winner announcements. |
| `prizes[].value` | Number | Monetary value if applicable | Used for accounting and tax purposes. May be displayed to indicate prize significance. |
| `participants` | Array<String> | UserIds of participants | Used to quickly determine who is participating and for calculating participation rates. |
| `winners` | Array | Results after competition ends | Stores final standings for historical reference and for prize distribution management. |
| `winners[].userId` | String | Winner's user ID | Links the achievement to the specific user account. Used for notifications and profile achievements. |
| `winners[].rank` | Number | Position in results | Indicates which prize the winner should receive. Used in congratulatory messaging and prize fulfillment. |
| `winners[].score` | Number | Final score achieved | Documents the winning performance for transparency and historical records. |
| `winners[].prizeStatus` | String | "pending", "shipped", "delivered" | Tracks prize fulfillment process. Used by administrators to manage prize distribution. |

**Access Patterns**:
- Competition discovery and browsing
- Active competition participation
- Competition result viewing
- Prize fulfillment management

## 5. Leaderboards Collection

**Path**: `leaderboards/{competitionId}/rankings/{timestamp}`

**Purpose**: Stores point-in-time snapshots of competition rankings to enable historical tracking and efficient retrieval of current standings without recalculation.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `generatedAt` | Timestamp | When this leaderboard was calculated | Used to display recency of rankings and to order multiple ranking snapshots chronologically. |
| `isLatest` | Boolean | Whether this is the most current ranking | Used to quickly identify the most recent ranking without sorting by timestamp. Improves read performance. |
| `rankings` | Array | Ordered list of participant rankings | The core leaderboard data showing each participant's position and score. |
| `rankings[].userId` | String | User ID | Links the ranking entry to a specific user. Used for highlighting current user's position. |
| `rankings[].username` | String | Username | Displayed on leaderboard to identify participants. Denormalized to avoid extra queries. |
| `rankings[].displayName` | String | Display name | Displayed on leaderboard as a friendly name. Denormalized to avoid extra queries. |
| `rankings[].rank` | Number | Current position | Shows current standing in the competition. Used for sorting and display. |
| `rankings[].previousRank` | Number | Previous position | Used to calculate and display movement on the leaderboard (improving or declining). Creates dynamics. |
| `rankings[].score` | Number | Current competition score | The actual competition score determining ranking. Displayed for transparency. |
| `rankings[].change` | Number | Point change since last ranking | Shows momentum and improvement. Creates more dynamic leaderboard experience. |

**Access Patterns**:
- Current leaderboard display
- Position change tracking
- Historical ranking comparison
- Personal standing highlighting

## 6. Invitations Collection

**Path**: `invitations/{invitationId}`

**Purpose**: Manages the invitation-only access system, tracking who has been invited and the status of each invitation to maintain exclusivity.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `email` | String | Recipient's email address | Used to send the invitation and to verify the invited user during registration. |
| `status` | String | "sent", "accepted", "expired" | Tracks the state of the invitation. Controls whether the invitation code is still valid. |
| `createdAt` | Timestamp | When invitation was created | Used to calculate expiration and for reporting on invitation response times. |
| `expiresAt` | Timestamp | Expiration date | Used to automatically invalidate old invitations and to display countdown to recipient. |
| `invitedBy` | String | UserId of person who sent invitation | Used for referral tracking and potential referral rewards programs. |
| `code` | String | Unique invitation code | The actual code sent to the recipient that they use to register. Must be secure and unique. |

**Access Patterns**:
- Invitation code validation during registration
- Invitation status checking
- Referral tracking
- Invitation management for administrators

## 7. Notifications Collection

**Path**: `notifications/{userId}/items/{notificationId}`

**Purpose**: Stores user-specific notifications about achievements, competition updates, and system messages to engage users and drive platform interaction.

| Field | Type | Description | Usage |
|-------|------|-------------|-------|
| `type` | String | Notification type | Controls how the notification is displayed and what actions are available (achievement, competition, etc.). |
| `title` | String | Short notification title | Displayed in notification center and push notifications. Should be attention-grabbing but clear. |
| `message` | String | Full notification content | The complete notification text displayed when expanded. Provides all relevant details. |
| `createdAt` | Timestamp | When notification was created | Used for sorting notifications chronologically and for aging out old notifications. |
| `read` | Boolean | Whether user has seen this notification | Tracks read status to highlight new notifications and for analytics on engagement. |
| `data.competitionId` | String | Related competition ID (if applicable) | Enables deep linking to the relevant competition from the notification. |
| `data.achievementId` | String | Related achievement ID (if applicable) | Enables deep linking to the relevant achievement from the notification. |

**Access Patterns**:
- Notification center display
- Unread notification counting
- Push notification generation
- Deep linking to relevant content

## Security Rules and Access Control

The database structure is designed with security in mind, implementing strict access controls through Firebase Security Rules:

```
// Example security rules for the Sleep Olympics database

match /databases/{database}/documents {
  // Users can only read/write their own data
  match /users/{userId} {
    allow read: if request.auth.uid == userId || hasAdminRole();
    allow write: if request.auth.uid == userId;
  }
  
  // Sleep data is private to each user
  match /sleepData/{userId}/{document=**} {
    allow read: if request.auth.uid == userId || hasAdminRole();
    allow write: if request.auth.uid == userId;
  }
  
  // Sleep summaries are also private
  match /sleepSummaries/{userId} {
    allow read: if request.auth.uid == userId || hasAdminRole();
    allow write: if request.auth.uid == userId || hasAdminRole();
  }
  
  // Competitions are readable by all but writable only by admins
  match /competitions/{competitionId} {
    allow read: if request.auth != null;
    allow write: if hasAdminRole();
  }
  
  // Leaderboards are readable by all but writable only by system
  match /leaderboards/{competitionId}/{document=**} {
    allow read: if request.auth != null;
    allow write: if hasAdminRole();
  }
  
  // Invitations are managed by admins
  match /invitations/{invitationId} {
    allow read: if hasAdminRole();
    allow write: if hasAdminRole();
  }
  
  // Notifications are private to each user
  match /notifications/{userId}/{document=**} {
    allow read: if request.auth.uid == userId;
    allow write: if false; // Only system can write notifications
  }
  
  // Helper function to check admin role
  function hasAdminRole() {
    return request.auth != null && 
      get(/databases/$(database)/documents/users/$(request.auth.uid)/roles/admin).exists;
  }
}
```

## Data Management Strategy

### Denormalization Strategy

The database structure employs strategic denormalization to optimize read performance while maintaining data integrity:

1. **Username and displayName in rankings**: By including these fields directly in the leaderboard rankings, we avoid additional reads to the users collection when displaying leaderboards.

2. **Participation arrays in competitions**: Storing participant IDs directly in the competition document allows for quick checking of participation status without complex queries.

3. **Competition IDs in user documents**: Storing IDs of competitions the user is participating in allows for efficient filtering and display of relevant competitions.

### Data Consistency Management

To maintain consistency across denormalized data:

1. **Cloud Functions for updates**: When a user changes their username or display name, a Cloud Function will update all references in leaderboards and other collections.

2. **Batch writes for critical operations**: Use Firebase batch writes to ensure atomic updates across multiple documents when data consistency is critical.

3. **Regular data validation**: Implement scheduled Cloud Functions that validate and correct any inconsistencies in the database.

### Performance Considerations

1. **Leaderboard calculations**: Performed as background processes to avoid impacting user experience.
2. **Paged queries**: Implement pagination for large collections like sleep data history to minimize data transfer.
3. **Index planning**: Create compound indexes to support common query patterns without full collection scans.
4. **Caching strategy**: Implement application-level caching for frequently accessed, rarely changing data like active competitions.

## Scalability Considerations

As the Sleep Olympics platform grows, this database structure provides several scaling advantages:

1. **Subcollection pattern for user data**: Sleep data is stored in subcollections under user IDs, allowing for efficient sharding across the database.
2. **Pre-computed aggregates**: Summary collections reduce the need for expensive on-demand calculations.
3. **Time-based partitioning**: Historical leaderboards are timestamped, allowing for potential archiving strategies as data ages.
4. **Limited array sizes**: Arrays like `participants` are limited in size by the nature of competitions, avoiding the document size limitations of Firebase.

This database structure balances normalization for data integrity with strategic denormalization for performance, particularly important for real-time features like leaderboard updates.