const admin = require('firebase-admin');
const moment = require('moment');
const firestore = admin.firestore();

// Get all active or upcoming competitions
const getCompetitions = async (req, res) => {
  try {
    const { status } = req.query; // "active", "upcoming", "completed", or undefined for all
    
    let query = firestore.collection('competitions');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('startDate', 'asc').get();
    
    if (snapshot.empty) {
      return res.status(200).json({ competitions: [] });
    }
    
    const competitions = [];
    snapshot.forEach(doc => {
      competitions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ competitions });
  } catch (error) {
    console.error('Error getting competitions:', error);
    return res.status(500).json({ error: 'Failed to retrieve competitions' });
  }
};

// Get a specific competition by ID
const getCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    const competitionDoc = await firestore
      .collection('competitions')
      .doc(competitionId)
      .get();
    
    if (!competitionDoc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    return res.status(200).json({ 
      competition: {
        id: competitionDoc.id,
        ...competitionDoc.data()
      } 
    });
  } catch (error) {
    console.error('Error getting competition:', error);
    return res.status(500).json({ error: 'Failed to retrieve competition' });
  }
};

// Join a competition
const joinCompetition = async (req, res) => {
  try {
    const userId = req.userId;
    const { competitionId } = req.params;
    
    // Get the competition
    const competitionDoc = await firestore
      .collection('competitions')
      .doc(competitionId)
      .get();
    
    if (!competitionDoc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    const competition = competitionDoc.data();
    
    // Check if competition is active or upcoming
    if (competition.status === 'completed') {
      return res.status(400).json({ error: 'Cannot join a completed competition' });
    }
    
    // Check if user is already a participant
    if (competition.participants && competition.participants.includes(userId)) {
      return res.status(400).json({ error: 'You are already a participant in this competition' });
    }
    
    // Check eligibility criteria if defined
    if (competition.rules && competition.rules.eligibilityCriteria) {
      const criteria = competition.rules.eligibilityCriteria;
      
      // Check user's sleep data if minimum tracked nights required
      if (criteria.minimumTrackedNights) {
        const sleepDataCount = await firestore
          .collection('sleepData')
          .doc(userId)
          .collection('daily')
          .count()
          .get();
        
        if (sleepDataCount.data().count < criteria.minimumTrackedNights) {
          return res.status(400).json({ 
            error: `You need at least ${criteria.minimumTrackedNights} tracked nights to join this competition` 
          });
        }
      }
      
      // Check user tenure if required
      if (criteria.minimumTenureDays) {
        const userDoc = await firestore.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userDoc.data();
        const createdAt = moment(user.createdAt.toDate());
        const daysSinceCreation = moment().diff(createdAt, 'days');
        
        if (daysSinceCreation < criteria.minimumTenureDays) {
          return res.status(400).json({ 
            error: `You need to be a member for at least ${criteria.minimumTenureDays} days to join this competition` 
          });
        }
      }
    }
    
    // Add user to competition participants
    await firestore
      .collection('competitions')
      .doc(competitionId)
      .update({
        participants: admin.firestore.FieldValue.arrayUnion(userId)
      });
    
    // Add competition to user's participating competitions
    await firestore
      .collection('users')
      .doc(userId)
      .update({
        'competitions.participating': admin.firestore.FieldValue.arrayUnion(competitionId)
      });
    
    return res.status(200).json({ message: 'Successfully joined the competition' });
  } catch (error) {
    console.error('Error joining competition:', error);
    return res.status(500).json({ error: 'Failed to join competition' });
  }
};

// Leave a competition
const leaveCompetition = async (req, res) => {
  try {
    const userId = req.userId;
    const { competitionId } = req.params;
    
    // Get the competition
    const competitionDoc = await firestore
      .collection('competitions')
      .doc(competitionId)
      .get();
    
    if (!competitionDoc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    const competition = competitionDoc.data();
    
    // Check if competition is active or upcoming
    if (competition.status === 'completed') {
      return res.status(400).json({ error: 'Cannot leave a completed competition' });
    }
    
    // Check if user is a participant
    if (!competition.participants || !competition.participants.includes(userId)) {
      return res.status(400).json({ error: 'You are not a participant in this competition' });
    }
    
    // Remove user from competition participants
    await firestore
      .collection('competitions')
      .doc(competitionId)
      .update({
        participants: admin.firestore.FieldValue.arrayRemove(userId)
      });
    
    // Remove competition from user's participating competitions
    await firestore
      .collection('users')
      .doc(userId)
      .update({
        'competitions.participating': admin.firestore.FieldValue.arrayRemove(competitionId)
      });
    
    return res.status(200).json({ message: 'Successfully left the competition' });
  } catch (error) {
    console.error('Error leaving competition:', error);
    return res.status(500).json({ error: 'Failed to leave competition' });
  }
};

// Get leaderboard for a competition
const getLeaderboard = async (req, res) => {
  try {
    const { competitionId } = req.params;
    
    // Get the most recent leaderboard
    const leaderboardQuery = await firestore
      .collection('leaderboards')
      .doc(competitionId)
      .collection('rankings')
      .where('isLatest', '==', true)
      .limit(1)
      .get();
    
    if (leaderboardQuery.empty) {
      return res.status(404).json({ error: 'Leaderboard not found' });
    }
    
    const leaderboardDoc = leaderboardQuery.docs[0];
    const leaderboard = leaderboardDoc.data();
    
    return res.status(200).json({ 
      leaderboard: {
        id: leaderboardDoc.id,
        ...leaderboard
      } 
    });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return res.status(500).json({ error: 'Failed to retrieve leaderboard' });
  }
};

// Get user's competitions
const getUserCompetitions = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user document to get participating competitions
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    const participatingIds = userData.competitions?.participating || [];
    const wonIds = userData.competitions?.won || [];
    
    // Get all participating competitions
    const participating = [];
    
    if (participatingIds.length > 0) {
      // Use batched get for efficiency
      const batch = [];
      for (let i = 0; i < participatingIds.length; i += 10) {
        // Firebase limits batched gets to 10 documents
        const chunk = participatingIds.slice(i, i + 10);
        const docs = await firestore.getAll(
          ...chunk.map(id => firestore.collection('competitions').doc(id))
        );
        batch.push(...docs);
      }
      
      batch.forEach(doc => {
        if (doc.exists) {
          participating.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
    }
    
    // Get all won competitions
    const won = [];
    
    if (wonIds.length > 0) {
      // Use batched get for efficiency
      const batch = [];
      for (let i = 0; i < wonIds.length; i += 10) {
        // Firebase limits batched gets to 10 documents
        const chunk = wonIds.slice(i, i + 10);
        const docs = await firestore.getAll(
          ...chunk.map(id => firestore.collection('competitions').doc(id))
        );
        batch.push(...docs);
      }
      
      batch.forEach(doc => {
        if (doc.exists) {
          won.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
    }
    
    return res.status(200).json({ 
      competitions: {
        participating,
        won
      } 
    });
  } catch (error) {
    console.error('Error getting user competitions:', error);
    return res.status(500).json({ error: 'Failed to retrieve user competitions' });
  }
};

// Admin only: Create a new competition
const createCompetition = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      rules,
      prizes
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate dates
    const start = moment(startDate);
    const end = moment(endDate);
    
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    if (end.isBefore(start)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }
    
    // Determine status based on dates
    let status;
    const now = moment();
    
    if (start.isAfter(now)) {
      status = 'upcoming';
    } else if (end.isAfter(now)) {
      status = 'active';
    } else {
      status = 'completed';
    }
    
    // Create competition document
    const newCompetition = {
      title,
      description,
      type,
      startDate: admin.firestore.Timestamp.fromDate(start.toDate()),
      endDate: admin.firestore.Timestamp.fromDate(end.toDate()),
      status,
      rules: rules || {},
      prizes: prizes || [],
      participants: [],
      winners: []
    };
    
    const competitionRef = await firestore.collection('competitions').add(newCompetition);
    
    return res.status(201).json({ 
      message: 'Competition created successfully',
      competitionId: competitionRef.id
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    return res.status(500).json({ error: 'Failed to create competition' });
  }
};

// Admin only: Update competition
const updateCompetition = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      rules,
      prizes
    } = req.body;
    
    // Get the competition
    const competitionDoc = await firestore
      .collection('competitions')
      .doc(competitionId)
      .get();
    
    if (!competitionDoc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    const competition = competitionDoc.data();
    
    // Don't allow updating if competition is completed
    if (competition.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update a completed competition' });
    }
    
    // Build update object
    const updateData = {};
    
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (type) updateData.type = type;
    
    if (startDate) {
      const start = moment(startDate);
      if (!start.isValid()) {
        return res.status(400).json({ error: 'Invalid start date format' });
      }
      updateData.startDate = admin.firestore.Timestamp.fromDate(start.toDate());
    }
    
    if (endDate) {
      const end = moment(endDate);
      if (!end.isValid()) {
        return res.status(400).json({ error: 'Invalid end date format' });
      }
      updateData.endDate = admin.firestore.Timestamp.fromDate(end.toDate());
    }
    
    if (rules) updateData.rules = rules;
    if (prizes) updateData.prizes = prizes;
    
    // Update status based on dates if dates were changed
    if (startDate || endDate) {
      const newStart = startDate 
        ? moment(startDate) 
        : moment(competition.startDate.toDate());
      
      const newEnd = endDate 
        ? moment(endDate) 
        : moment(competition.endDate.toDate());
      
      const now = moment();
      
      if (newStart.isAfter(now)) {
        updateData.status = 'upcoming';
      } else if (newEnd.isAfter(now)) {
        updateData.status = 'active';
      } else {
        updateData.status = 'completed';
      }
    }
    
    // Update the competition
    await firestore
      .collection('competitions')
      .doc(competitionId)
      .update(updateData);
    
    return res.status(200).json({ 
      message: 'Competition updated successfully',
      updated: Object.keys(updateData)
    });
  } catch (error) {
    console.error('Error updating competition:', error);
    return res.status(500).json({ error: 'Failed to update competition' });
  }
};

// Admin only: Update competition winners
const updateCompetitionWinners = async (req, res) => {
  try {
    const { competitionId } = req.params;
    const { winners } = req.body;
    
    if (!Array.isArray(winners)) {
      return res.status(400).json({ error: 'Winners must be an array' });
    }
    
    // Get the competition
    const competitionDoc = await firestore
      .collection('competitions')
      .doc(competitionId)
      .get();
    
    if (!competitionDoc.exists) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    
    const competition = competitionDoc.data();
    
    // Only allow updating winners for completed competitions
    if (competition.status !== 'completed') {
      return res.status(400).json({ error: 'Can only set winners for completed competitions' });
    }
    
    // Update the competition winners
    await firestore
      .collection('competitions')
      .doc(competitionId)
      .update({ winners });
    
    // For each winner, update their user document
    const batch = firestore.batch();
    
    winners.forEach(winner => {
      const userRef = firestore.collection('users').doc(winner.userId);
      batch.update(userRef, {
        'competitions.won': admin.firestore.FieldValue.arrayUnion(competitionId)
      });
    });
    
    await batch.commit();
    
    return res.status(200).json({ message: 'Competition winners updated successfully' });
  } catch (error) {
    console.error('Error updating competition winners:', error);
    return res.status(500).json({ error: 'Failed to update competition winners' });
  }
};

module.exports = {
  getCompetitions,
  getCompetition,
  joinCompetition,
  leaveCompetition,
  getLeaderboard,
  getUserCompetitions,
  createCompetition,
  updateCompetition,
  updateCompetitionWinners
};