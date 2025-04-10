const admin = require('firebase-admin');
const moment = require('moment');
const crypto = require('crypto');
const firestore = admin.firestore();

// Generate a random invitation code
const generateInvitationCode = () => {
  return crypto.randomBytes(10).toString('hex');
};

// Admin only: Create an invitation
const createInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    const adminUserId = req.userId;
    
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    
    // Check if email already has an active invitation
    const existingInvitationsSnapshot = await firestore
      .collection('invitations')
      .where('email', '==', email)
      .where('status', '==', 'sent')
      .get();
    
    if (!existingInvitationsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'This email already has an active invitation',
        invitationId: existingInvitationsSnapshot.docs[0].id
      });
    }
    
    // Create expiration date (30 days from now)
    const expiresAt = moment().add(30, 'days').toDate();
    
    // Generate invitation code
    const code = generateInvitationCode();
    
    // Create invitation document
    const invitation = {
      email,
      status: 'sent',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
      invitedBy: adminUserId,
      code
    };
    
    const invitationRef = await firestore
      .collection('invitations')
      .add(invitation);
    
    return res.status(201).json({
      message: 'Invitation created successfully',
      invitationId: invitationRef.id,
      invitationCode: code
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return res.status(500).json({ error: 'Failed to create invitation' });
  }
};

// Admin only: Get all invitations
const getAllInvitations = async (req, res) => {
  try {
    const { status } = req.query; // 'sent', 'accepted', 'expired', or undefined for all
    
    let query = firestore.collection('invitations');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return res.status(200).json({ invitations: [] });
    }
    
    const invitations = [];
    snapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ invitations });
  } catch (error) {
    console.error('Error getting invitations:', error);
    return res.status(500).json({ error: 'Failed to retrieve invitations' });
  }
};

// Admin only: Revoke an invitation
const revokeInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    
    // Check if invitation exists
    const invitationRef = firestore
      .collection('invitations')
      .doc(invitationId);
    
    const invitationDoc = await invitationRef.get();
    
    if (!invitationDoc.exists) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    
    const invitation = invitationDoc.data();
    
    if (invitation.status !== 'sent') {
      return res.status(400).json({ error: 'Cannot revoke invitation with status: ' + invitation.status });
    }
    
    // Revoke invitation
    await invitationRef.update({ status: 'expired' });
    
    return res.status(200).json({ message: 'Invitation revoked successfully' });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return res.status(500).json({ error: 'Failed to revoke invitation' });
  }
};

// Validate invitation code (public endpoint)
const validateInvitationCode = async (req, res) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      return res.status(400).json({ error: 'Invitation code is required' });
    }
    
    // Check if code exists and is valid
    const invitationsSnapshot = await firestore
      .collection('invitations')
      .where('code', '==', code)
      .limit(1)
      .get();
    
    if (invitationsSnapshot.empty) {
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid invitation code' 
      });
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    if (invitation.status !== 'sent') {
      return res.status(400).json({ 
        valid: false,
        error: 'This invitation has already been used or revoked' 
      });
    }
    
    const expirationDate = moment(invitation.expiresAt.toDate());
    if (moment().isAfter(expirationDate)) {
      // Update status to expired
      await firestore
        .collection('invitations')
        .doc(invitationDoc.id)
        .update({ status: 'expired' });
      
      return res.status(400).json({ 
        valid: false,
        error: 'This invitation has expired' 
      });
    }
    
    return res.status(200).json({ 
      valid: true,
      email: invitation.email,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('Error validating invitation code:', error);
    return res.status(500).json({ 
      valid: false,
      error: 'Failed to validate invitation code' 
    });
  }
};

// Mark invitation as accepted (used during registration)
const acceptInvitation = async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: 'Invitation code is required' });
    }
    
    // Check if code exists and is valid
    const invitationsSnapshot = await firestore
      .collection('invitations')
      .where('code', '==', code)
      .limit(1)
      .get();
    
    if (invitationsSnapshot.empty) {
      return res.status(404).json({ error: 'Invalid invitation code' });
    }
    
    const invitationDoc = invitationsSnapshot.docs[0];
    const invitation = invitationDoc.data();
    
    if (invitation.status !== 'sent') {
      return res.status(400).json({ error: 'This invitation has already been used or revoked' });
    }
    
    const expirationDate = moment(invitation.expiresAt.toDate());
    if (moment().isAfter(expirationDate)) {
      // Update status to expired
      await firestore
        .collection('invitations')
        .doc(invitationDoc.id)
        .update({ status: 'expired' });
      
      return res.status(400).json({ error: 'This invitation has expired' });
    }
    
    // Mark invitation as accepted
    await firestore
      .collection('invitations')
      .doc(invitationDoc.id)
      .update({ status: 'accepted' });
    
    return res.status(200).json({ message: 'Invitation accepted successfully' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

module.exports = {
  createInvitation,
  getAllInvitations,
  revokeInvitation,
  validateInvitationCode,
  acceptInvitation
};