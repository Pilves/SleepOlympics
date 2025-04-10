const admin = require('firebase-admin');
const axios = require('axios');
const moment = require('moment');
const firestore = admin.firestore();

// Get sleep data for a specific date
const getSleepData = async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.params; // Format: YYYY-MM-DD
    
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }
    
    const sleepDoc = await firestore
      .collection('sleepData')
      .doc(userId)
      .collection('daily')
      .doc(date)
      .get();
    
    if (!sleepDoc.exists) {
      return res.status(404).json({ error: 'Sleep data not found for this date' });
    }
    
    return res.status(200).json({ sleepData: sleepDoc.data() });
  } catch (error) {
    console.error('Error getting sleep data:', error);
    return res.status(500).json({ error: 'Failed to retrieve sleep data' });
  }
};

// Get sleep data for a date range
const getSleepDataRange = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query; // Format: YYYY-MM-DD
    
    if (!startDate || !startDate.match(/^\d{4}-\d{2}-\d{2}$/) || 
        !endDate || !endDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }
    
    const start = moment(startDate);
    const end = moment(endDate);
    
    if (end.diff(start, 'days') > 30) {
      return res.status(400).json({ error: 'Date range cannot exceed 30 days' });
    }
    
    const sleepDataRef = firestore
      .collection('sleepData')
      .doc(userId)
      .collection('daily');
    
    const snapshot = await sleepDataRef
      .where('date', '>=', new Date(startDate))
      .where('date', '<=', new Date(endDate))
      .orderBy('date', 'asc')
      .get();
    
    if (snapshot.empty) {
      return res.status(200).json({ sleepData: [] });
    }
    
    const sleepData = [];
    snapshot.forEach(doc => {
      sleepData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return res.status(200).json({ sleepData });
  } catch (error) {
    console.error('Error getting sleep data range:', error);
    return res.status(500).json({ error: 'Failed to retrieve sleep data range' });
  }
};

// Sync sleep data from Oura
const syncOuraData = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user's Oura integration details
    const userDoc = await firestore.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    if (!userData.ouraIntegration || !userData.ouraIntegration.connected) {
      return res.status(400).json({ error: 'Oura ring not connected' });
    }
    
    // In a real app, you would use the stored API key to fetch data from Oura API
    // This is a simplified example
    
    // Mock data for example purposes
    const mockOuraData = generateMockOuraData();
    
    // Process and store the data
    for (const sleepRecord of mockOuraData) {
      const dateId = moment(sleepRecord.date).format('YYYY-MM-DD');
      
      await firestore
        .collection('sleepData')
        .doc(userId)
        .collection('daily')
        .doc(dateId)
        .set(sleepRecord, { merge: true });
    }
    
    // Update last sync date
    await firestore.collection('users').doc(userId).update({
      'ouraIntegration.lastSyncDate': admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Update sleep summaries
    await updateSleepSummaries(userId);
    
    return res.status(200).json({ 
      message: 'Sleep data synchronized successfully',
      recordsProcessed: mockOuraData.length
    });
  } catch (error) {
    console.error('Error syncing sleep data:', error);
    return res.status(500).json({ error: 'Failed to sync sleep data' });
  }
};

// Add a note to sleep data
const addSleepNote = async (req, res) => {
  try {
    const userId = req.userId;
    const { date } = req.params; // Format: YYYY-MM-DD
    const { note, tags } = req.body;
    
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD' });
    }
    
    const sleepDocRef = firestore
      .collection('sleepData')
      .doc(userId)
      .collection('daily')
      .doc(date);
    
    const sleepDoc = await sleepDocRef.get();
    
    if (!sleepDoc.exists) {
      return res.status(404).json({ error: 'Sleep data not found for this date' });
    }
    
    const updateData = {};
    
    if (note) {
      updateData.notes = note;
    }
    
    if (tags && Array.isArray(tags)) {
      updateData.tags = tags;
    }
    
    await sleepDocRef.update(updateData);
    
    return res.status(200).json({ message: 'Sleep note added successfully' });
  } catch (error) {
    console.error('Error adding sleep note:', error);
    return res.status(500).json({ error: 'Failed to add sleep note' });
  }
};

// Get sleep summary
const getSleepSummary = async (req, res) => {
  try {
    const userId = req.userId;
    
    const summaryDoc = await firestore
      .collection('sleepSummaries')
      .doc(userId)
      .get();
    
    if (!summaryDoc.exists) {
      // If summary doesn't exist yet, generate it
      await updateSleepSummaries(userId);
      
      const newSummaryDoc = await firestore
        .collection('sleepSummaries')
        .doc(userId)
        .get();
      
      if (!newSummaryDoc.exists) {
        return res.status(404).json({ error: 'Sleep summary not found and could not be generated' });
      }
      
      return res.status(200).json({ sleepSummary: newSummaryDoc.data() });
    }
    
    return res.status(200).json({ sleepSummary: summaryDoc.data() });
  } catch (error) {
    console.error('Error getting sleep summary:', error);
    return res.status(500).json({ error: 'Failed to retrieve sleep summary' });
  }
};

// Helper: Update sleep summaries
const updateSleepSummaries = async (userId) => {
  try {
    // Get all sleep data for the user
    const sleepDataRef = firestore
      .collection('sleepData')
      .doc(userId)
      .collection('daily');
    
    // Get current month data
    const currentMonth = moment().startOf('month');
    const currentMonthData = await sleepDataRef
      .where('date', '>=', currentMonth.toDate())
      .where('date', '<=', moment().toDate())
      .orderBy('date', 'asc')
      .get();
    
    // Get previous month data
    const previousMonth = moment().subtract(1, 'month').startOf('month');
    const previousMonthEnd = moment().subtract(1, 'month').endOf('month');
    const previousMonthData = await sleepDataRef
      .where('date', '>=', previousMonth.toDate())
      .where('date', '<=', previousMonthEnd.toDate())
      .orderBy('date', 'asc')
      .get();
    
    // Get all data for overall statistics
    const allData = await sleepDataRef
      .orderBy('date', 'asc')
      .get();
    
    // Calculate averages
    const currentMonthAvg = calculateAverage(currentMonthData, 'ouraScore');
    const previousMonthAvg = calculateAverage(previousMonthData, 'ouraScore');
    const overallAvg = calculateAverage(allData, 'ouraScore');
    
    // Calculate best and worst scores
    let bestScore = 0;
    let worstScore = 100;
    
    allData.forEach(doc => {
      const data = doc.data();
      if (data.ouraScore > bestScore) bestScore = data.ouraScore;
      if (data.ouraScore < worstScore) worstScore = data.ouraScore;
    });
    
    // Calculate weekly and monthly trends
    const weeklyTrend = calculateWeeklyTrend(allData);
    const monthlyTrend = calculateMonthlyTrend(allData);
    
    // Calculate improvements
    const monthlyImprovement = calculateImprovement(currentMonthData);
    const overallImprovement = calculateImprovement(allData);
    
    // Create summary object
    const summary = {
      dailyAverage: {
        currentMonth: currentMonthAvg,
        previousMonth: previousMonthAvg,
        overall: overallAvg
      },
      weeklyTrend,
      monthlyTrend,
      bestScore,
      worstScore,
      improvement: {
        monthly: monthlyImprovement,
        overall: overallImprovement
      },
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    await firestore
      .collection('sleepSummaries')
      .doc(userId)
      .set(summary, { merge: true });
    
    return summary;
  } catch (error) {
    console.error('Error updating sleep summaries:', error);
    throw error;
  }
};

// Helper: Calculate average from QuerySnapshot
const calculateAverage = (snapshot, field) => {
  if (snapshot.empty) return 0;
  
  let total = 0;
  let count = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data && data[field] !== undefined) {
      total += data[field];
      count++;
    }
  });
  
  return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
};

// Helper: Calculate improvement (difference between first and last records)
const calculateImprovement = (snapshot) => {
  if (snapshot.empty || snapshot.size < 2) return 0;
  
  const docs = [];
  snapshot.forEach(doc => {
    docs.push({
      date: doc.data().date.toDate(),
      score: doc.data().ouraScore
    });
  });
  
  // Sort by date
  docs.sort((a, b) => a.date - b.date);
  
  // Calculate difference between first and last week averages
  const firstWeekDocs = docs.slice(0, Math.min(7, Math.ceil(docs.length / 2)));
  const lastWeekDocs = docs.slice(-Math.min(7, Math.ceil(docs.length / 2)));
  
  const firstWeekAvg = firstWeekDocs.reduce((sum, doc) => sum + doc.score, 0) / firstWeekDocs.length;
  const lastWeekAvg = lastWeekDocs.reduce((sum, doc) => sum + doc.score, 0) / lastWeekDocs.length;
  
  return Math.round((lastWeekAvg - firstWeekAvg) * 10) / 10;
};

// Helper: Calculate weekly trend (last 4 weeks)
const calculateWeeklyTrend = (snapshot) => {
  if (snapshot.empty) return [];
  
  const docs = [];
  snapshot.forEach(doc => {
    docs.push({
      date: doc.data().date.toDate(),
      score: doc.data().ouraScore
    });
  });
  
  // Sort by date
  docs.sort((a, b) => a.date - b.date);
  
  // Get only the last 28 days (4 weeks)
  const recentDocs = docs.slice(-28);
  
  // Group by week
  const weeks = {};
  
  recentDocs.forEach(doc => {
    const weekStart = moment(doc.date).startOf('week').format('YYYY-MM-DD');
    if (!weeks[weekStart]) {
      weeks[weekStart] = {
        week: weekStart,
        scores: []
      };
    }
    weeks[weekStart].scores.push(doc.score);
  });
  
  // Calculate average for each week
  const trend = Object.values(weeks)
    .map(week => ({
      week: week.week,
      average: Math.round((week.scores.reduce((sum, score) => sum + score, 0) / week.scores.length) * 10) / 10
    }))
    .slice(-4); // Only last 4 weeks
  
  return trend;
};

// Helper: Calculate monthly trend (last 6 months)
const calculateMonthlyTrend = (snapshot) => {
  if (snapshot.empty) return [];
  
  const docs = [];
  snapshot.forEach(doc => {
    docs.push({
      date: doc.data().date.toDate(),
      score: doc.data().ouraScore
    });
  });
  
  // Sort by date
  docs.sort((a, b) => a.date - b.date);
  
  // Group by month
  const months = {};
  
  docs.forEach(doc => {
    const monthStart = moment(doc.date).startOf('month').format('YYYY-MM');
    if (!months[monthStart]) {
      months[monthStart] = {
        month: monthStart,
        scores: []
      };
    }
    months[monthStart].scores.push(doc.score);
  });
  
  // Calculate average for each month
  const trend = Object.values(months)
    .map(month => ({
      month: month.month,
      average: Math.round((month.scores.reduce((sum, score) => sum + score, 0) / month.scores.length) * 10) / 10
    }))
    .slice(-6); // Only last 6 months
  
  return trend;
};

// Helper: Generate mock Oura data for testing
const generateMockOuraData = () => {
  const data = [];
  const today = moment();
  
  // Generate data for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = moment(today).subtract(i, 'days');
    
    // Random values within realistic ranges
    const ouraScore = Math.floor(Math.random() * 30) + 70; // 70-99
    const totalSleepTime = Math.floor(Math.random() * 120) + 360; // 360-479 minutes (6-8 hours)
    const efficiency = Math.floor(Math.random() * 10) + 90; // 90-99%
    const deepSleep = Math.floor(Math.random() * 60) + 60; // 60-119 minutes
    const remSleep = Math.floor(Math.random() * 60) + 90; // 90-149 minutes
    const lightSleep = totalSleepTime - deepSleep - remSleep;
    const latency = Math.floor(Math.random() * 20) + 5; // 5-24 minutes
    const heartRateAvg = Math.floor(Math.random() * 10) + 55; // 55-64 bpm
    const heartRateLowest = Math.floor(Math.random() * 5) + 50; // 50-54 bpm
    const hrv = Math.floor(Math.random() * 20) + 40; // 40-59 ms
    const respiratoryRate = (Math.random() * 2 + 14).toFixed(1); // 14.0-16.0 breaths/min
    
    data.push({
      date: date.toDate(),
      ouraScore,
      metrics: {
        totalSleepTime,
        efficiency,
        deepSleep,
        remSleep,
        lightSleep,
        latency,
        heartRate: {
          average: heartRateAvg,
          lowest: heartRateLowest
        },
        hrv,
        respiratoryRate: parseFloat(respiratoryRate)
      },
      tags: [],
      notes: ''
    });
  }
  
  return data;
};

module.exports = {
  getSleepData,
  getSleepDataRange,
  syncOuraData,
  addSleepNote,
  getSleepSummary
};