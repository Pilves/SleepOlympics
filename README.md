# Sleep Olympics

A gamified sleep improvement application that integrates with Oura Ring data to create competitive leaderboards and reward sleep improvement.

![Dashboard View](/media/dashboardView.png)

## Project Concept

Sleep Olympics transforms your sleep data into a fun, competitive experience. The application connects to your Oura Ring, analyzes your sleep patterns, and enables you to compete with others to improve your sleep quality. Through challenges, leaderboards, and achievements, Sleep Olympics motivates you to develop better sleep habits and celebrate your progress.

## Key Features

- **Sleep Score Tracking**: Track and visualize your sleep performance with daily scores
- **Competitive Leaderboards**: Join challenges and compete with others to improve sleep quality
- **Achievement System**: Earn badges and recognition for consistent sleep improvements
- **Personalized Insights**: View trends and patterns in your sleep data
- **Oura Ring Integration**: Seamlessly connect with your Oura Ring device

## Media Showcase

| Feature | Screenshot |
|---------|------------|
| Dashboard | ![Dashboard View](/media/dashboardView.png) |
| Leaderboard | ![Leaderboard View](/media/leaderboardView.png) |
| Login Screen | ![Login View](/media/loginView.png) |
| User Profile | ![Profile View](/media/profileView.png) |

## Technology Stack

- **Backend**: Firebase/Firestore for database, Node.js with Express
- **Frontend**: React, Redux, TailwindCSS
- **Integration**: Oura Ring API
- **Authentication**: Firebase Authentication
- **Monitoring**: Firebase Monitoring, LogRocket

## Project Structure

The application uses a carefully designed database structure with the following key collections:

- **Users**: Core user account information and preferences
- **Sleep Data**: Daily sleep metrics imported from Oura Ring
- **Sleep Summaries**: Pre-calculated aggregations for performance optimization
- **Competitions**: Details about active and past sleep challenges
- **Leaderboards**: Point-in-time snapshots of competition rankings
- **Invitations**: Management of the invitation-only access system
- **Notifications**: User-specific alerts about achievements and competitions

## Implementation Plan

The project follows a phased development approach:

1. **User Management**: Authentication, profiles, and invitation system
2. **Oura Integration**: API connection, data synchronization, and processing
3. **Competition System**: Creation, participation, and leaderboard generation
4. **Notification System**: Email and in-app notifications
5. **Admin Dashboard**: User and competition management

## Project Status

Sleep Olympics is currently in the concept/planning phase with:
- Detailed architecture documentation
- UI/UX mockups for key screens
- Comprehensive database schema design
- Implementation approach planning

## Next Steps

- Complete backend implementation for core services
- Develop frontend interface according to UI designs
- Implement the Oura Ring integration
- Deploy a testing environment for initial validation
