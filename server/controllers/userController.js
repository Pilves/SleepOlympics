const admin = require('firebase-admin');
const firestore = admin.firestore();

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive data before sending response
    const { ouraIntegration: { apiKeyHash, ...ouraIntegrationData } = {}, ...safeUserData } = userData;
    
    if (userData.ouraIntegration) {
      safeUserData.ouraIntegration = ouraIntegrationData;
    }
    
    return res.status(200).json({ user: safeUserData });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { displayName, profileData } = req.body;
    
    // Fields that are allowed to be updated
    const updateData = {};
    
    if (displayName) updateData.displayName = displayName;
    
    if (profileData) {
      // Only allow certain profile fields to be updated
      updateData.profileData = {};
      
      if (profileData.gender) updateData.profileData.gender = profileData.gender;
      if (profileData.age) updateData.profileData.age = parseInt(profileData.age);
      if (profileData.aboutMe) updateData.profileData.aboutMe = profileData.aboutMe;
      if (profileData.profilePicture) updateData.profileData.profilePicture = profileData.profilePicture;
    }
    
    // Update the user document
    await firestore.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({ message: 'Profile updated successfully', updated: updateData });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
};

// Get user notification preferences
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const notifications = userData.notifications || { email: true, inApp: true };
    
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return res.status(500).json({ error: 'Failed to retrieve notification preferences' });
  }
};

// Update notification preferences
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const { email, inApp } = req.body;
    
    if (typeof email !== 'boolean' && typeof inApp !== 'boolean') {
      return res.status(400).json({ error: 'Invalid notification preferences' });
    }
    
    const updateData = { notifications: {} };
    
    if (typeof email === 'boolean') updateData.notifications.email = email;
    if (typeof inApp === 'boolean') updateData.notifications.inApp = inApp;
    
    await firestore.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({ message: 'Notification preferences updated', updated: updateData.notifications });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({ error: 'Failed to update notification preferences' });
  }
};

// Connect Oura integration
const connectOuraIntegration = async (req, res) => {
  try {
    const userId = req.userId;
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    // Here you would validate the API key with Oura API
    // For now, we'll assume it's valid
    
    // In a real app, don't store the API key directly - use a secure method
    // This is a simplified example
    const updateData = {
      'ouraIntegration.connected': true,
      'ouraIntegration.lastSyncDate': admin.firestore.FieldValue.serverTimestamp(),
      'ouraIntegration.apiKeyHash': 'secure-hash-of-api-key' // In reality, use proper secure storage
    };
    
    await firestore.collection('users').doc(userId).update(updateData);
    
    return res.status(200).json({ 
      message: 'Oura ring connected successfully',
      status: 'connected'
    });
  } catch (error) {
    console.error('Error connecting Oura integration:', error);
    return res.status(500).json({ error: 'Failed to connect Oura integration' });
  }
};

// Get Oura connection status
const getOuraConnectionStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const ouraIntegration = userData.ouraIntegration || { connected: false };
    
    // Don't include the API key hash in the response
    const { apiKeyHash, ...safeOuraData } = ouraIntegration;
    
    return res.status(200).json({ ouraIntegration: safeOuraData });
  } catch (error) {
    console.error('Error getting Oura connection status:', error);
    return res.status(500).json({ error: 'Failed to retrieve Oura connection status' });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getNotificationPreferences,
  updateNotificationPreferences,
  connectOuraIntegration,
  getOuraConnectionStatus
};