const admin = require('firebase-admin');
const firestore = admin.firestore();

// Register a new user
const registerUser = async (req, res) => {
  try {
    const { email, password, username, displayName, invitationCode } = req.body;
    
    // Validate required fields
    if (!email || !password || !username || !displayName || !invitationCode) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate invitation code
    const invitationsSnapshot = await firestore
      .collection('invitations')
      .where('code', '==', invitationCode)
      .limit(1)
      .get();
    
    if (invitationsSnapshot.empty) {
      return res.status(400).json({ error: 'Invalid invitation code' });
    }
    
    const invitation = invitationsSnapshot.docs[0].data();
    
    if (invitation.status !== 'sent') {
      return res.status(400).json({ error: 'This invitation has already been used or revoked' });
    }
    
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ error: 'Email does not match the invited email' });
    }
    
    // Check if username is already taken
    const usernameCheckSnapshot = await firestore
      .collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();
    
    if (!usernameCheckSnapshot.empty) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
    
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName,
      emailVerified: false
    });
    
    // Create Firestore user document
    const userData = {
      email,
      username,
      displayName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      profileData: {},
      ouraIntegration: {
        connected: false
      },
      notifications: {
        email: true,
        inApp: true
      },
      competitions: {
        participating: [],
        won: []
      }
    };
    
    await firestore.collection('users').doc(userRecord.uid).set(userData);
    
    // Mark invitation as accepted
    await firestore
      .collection('invitations')
      .doc(invitationsSnapshot.docs[0].id)
      .update({ status: 'accepted' });
    
    // Send email verification
    // In a real app, you would implement this
    
    return res.status(201).json({ 
      message: 'User registered successfully',
      userId: userRecord.uid
    });
  } catch (error) {
    console.error('Error registering user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email is already in use' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({ error: 'Password is too weak' });
    }
    
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

// Get current user data
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user data from Firestore
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive data
    const { ouraIntegration: { apiKeyHash, ...ouraIntegrationData } = {}, ...safeUserData } = userData;
    
    if (userData.ouraIntegration) {
      safeUserData.ouraIntegration = ouraIntegrationData;
    }
    
    return res.status(200).json({ user: safeUserData });
  } catch (error) {
    console.error('Error getting current user:', error);
    return res.status(500).json({ error: 'Failed to retrieve user data' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate password reset link
    const resetLink = await admin.auth().generatePasswordResetLink(email);
    
    // In a real app, you would send this link via email
    console.log('Password reset link:', resetLink);
    
    return res.status(200).json({ 
      message: 'Password reset email sent',
      debug: process.env.NODE_ENV === 'development' ? { resetLink } : undefined
    });
  } catch (error) {
    console.error('Error sending password reset:', error);
    
    if (error.code === 'auth/user-not-found') {
      // For security reasons, don't reveal if the email exists or not
      return res.status(200).json({ message: 'If your email is registered, a password reset link will be sent' });
    }
    
    if (error.code === 'auth/invalid-email') {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    return res.status(500).json({ error: 'Failed to send password reset email' });
  }
};

module.exports = {
  registerUser,
  getCurrentUser,
  resetPassword
};