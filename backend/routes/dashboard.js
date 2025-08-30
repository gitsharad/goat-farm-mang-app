const express = require('express');
const router = express.Router();
const Goat = require('../models/Goat');
const HealthRecord = require('../models/HealthRecord');
const BreedingRecord = require('../models/BreedingRecord');
const FeedRecord = require('../models/FeedRecord');
const Sale = require('../models/Sale');

// Get dashboard overview statistics
router.get('/overview', async (req, res) => {
  try {
    // Goat statistics
    const goatStats = await Goat.aggregate([
      {
        $group: {
          _id: null,
          totalGoats: { $sum: 1 },
          activeGoats: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
          soldGoats: { $sum: { $cond: [{ $eq: ['$status', 'Sold'] }, 1, 0] } },
          maleGoats: { $sum: { $cond: [{ $eq: ['$gender', 'Male'] }, 1, 0] } },
          femaleGoats: { $sum: { $cond: [{ $eq: ['$gender', 'Female'] }, 1, 0] } },
          pregnantGoats: { $sum: { $cond: ['$breeding.isPregnant', 1, 0] } },
          averageAge: { 
            $avg: { 
              $cond: [
                { $and: [
                  { $ne: ['$dateOfBirth', null] },
                  { $ne: ['$dateOfBirth', ''] },
                  { $eq: [{ $type: '$dateOfBirth' }, 'date'] }
                ]},
                { $divide: [{ $subtract: [new Date(), '$dateOfBirth'] }, 1000 * 60 * 60 * 24 * 365.25] },
                null
              ]
            }
          }
        }
      }
    ]);

    // Health statistics
    const healthStats = await HealthRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          upcomingEvents: {
            $sum: {
              $cond: [
                { $and: [{ $gte: ['$nextDueDate', new Date()] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Breeding statistics
    const breedingStats = await BreedingRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          pregnantDoes: { $sum: { $cond: [{ $eq: ['$status', 'Pregnant'] }, 1, 0] } },
          upcomingKidding: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', 'Pregnant'] }, { $gte: ['$expectedDueDate', new Date()] }] },
                1,
                0
              ]
            }
          },
          totalKids: { $sum: '$kidsBorn' },
          survivedKids: { $sum: '$kidsSurvived' }
        }
      }
    ]);

    // Feed statistics
    const feedStats = await FeedRecord.aggregate([
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ]);

    // Growth statistics (Average weight and ADG)
    const growthAgg = await Goat.aggregate([
      {
        $match: {
          dateOfBirth: { $type: 'date' },
          'weight.current': { $gt: 0 }
        }
      },
      {
        $addFields: {
          ageDays: {
            $max: [
              1,
              {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), '$dateOfBirth'] },
                    1000 * 60 * 60 * 24
                  ]
                }
              }
            ]
          }
        }
      },
      {
        $addFields: {
          adgFromBirth: {
            $cond: [
              {
                $and: [
                  { $ne: ['$weight.birth', null] },
                  { $ne: ['$weight.current', null] }
                ]
              },
              {
                $divide: [
                  { $subtract: ['$weight.current', '$weight.birth'] },
                  '$ageDays'
                ]
              },
              null
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageCurrentWeight: { $avg: '$weight.current' },
          averageADG: { $avg: '$adgFromBirth' },
          slowGrowers: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$adgFromBirth', null] }, { $lt: ['$adgFromBirth', 0.12] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const growthStats = growthAgg[0] || {};

    // Disease detection statistics (basic heuristic)
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const activeTreatments = await HealthRecord.countDocuments({
      type: 'Treatment',
      date: { $gte: fourteenDaysAgo }
    });

    const overdueHealth = await HealthRecord.countDocuments({
      nextDueDate: { $lt: now }
    });

    const suspectedIssuesAgg = await HealthRecord.aggregate([
      { $match: { date: { $gte: fourteenDaysAgo } } },
      { $match: { description: { $regex: /(cough|diarrhea|lameness|fever|nasal|discharge|pneumonia|bloat)/i } } },
      { $count: 'count' }
    ]);

    const diseaseStats = {
      activeTreatments,
      overdueHealth,
      suspectedIssues: (suspectedIssuesAgg[0] && suspectedIssuesAgg[0].count) || 0
    };

    // Sales statistics (sold goats this month)
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const soldThisMonthAgg = await Sale.aggregate([
      { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
      { $unwind: '$items' },
      { $match: { 'items.goat': { $ne: null } } },
      { $group: { _id: null, sold: { $sum: { $ifNull: ['$items.quantity', 1] } } } }
    ]);

    const salesStats = {
      soldThisMonth: (soldThisMonthAgg[0] && soldThisMonthAgg[0].sold) || 0
    };

    // Recent activities
    const recentGoats = await Goat.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name tagNumber breed status createdAt');

    const recentHealth = await HealthRecord.find()
      .sort({ date: -1 })
      .limit(5)
      .populate('goat', 'name tagNumber')
      .select('type description date goat');

    const recentBreeding = await BreedingRecord.find()
      .sort({ matingDate: -1 })
      .limit(5)
      .populate('doe', 'name tagNumber')
      .populate('buck', 'name tagNumber')
      .select('status matingDate doe buck');

    res.json({
      goatStats: goatStats[0] || {},
      healthStats: healthStats[0] || {},
      breedingStats: breedingStats[0] || {},
      feedStats: feedStats[0] || {},
      salesStats,
      growthStats,
      diseaseStats,
      recentActivities: {
        goats: recentGoats,
        health: recentHealth,
        breeding: recentBreeding
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get breed distribution
router.get('/breed-distribution', async (req, res) => {
  try {
    const breedStats = await Goat.aggregate([
      { $group: { _id: '$breed', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json(breedStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get age distribution
router.get('/age-distribution', async (req, res) => {
  try {
    const ageStats = await Goat.aggregate([
      {
        $addFields: {
          age: {
            $cond: [
              { $and: [
                { $ne: ['$dateOfBirth', null] },
                { $ne: ['$dateOfBirth', ''] },
                { $eq: [{ $type: '$dateOfBirth' }, 'date'] }
              ]},
              {
                $floor: {
                  $divide: [
                    { $subtract: [new Date(), '$dateOfBirth'] },
                    1000 * 60 * 60 * 24 * 365.25
                  ]
                }
              },
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$age', 1] }, then: '0-1 year' },
                { case: { $lt: ['$age', 3] }, then: '1-3 years' },
                { case: { $lt: ['$age', 5] }, then: '3-5 years' },
                { case: { $lt: ['$age', 8] }, then: '5-8 years' }
              ],
              default: '8+ years'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(ageStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get monthly trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    // Monthly goat additions
    const monthlyGoats = await Goat.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Monthly health records
    const monthlyHealth = await HealthRecord.aggregate([
      {
        $match: {
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$date' } },
          count: { $sum: 1 },
          totalCost: { $sum: '$cost' }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    // Monthly breeding records
    const monthlyBreeding = await BreedingRecord.aggregate([
      {
        $match: {
          matingDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$matingDate' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } }
    ]);

    res.json({
      goats: monthlyGoats,
      health: monthlyHealth,
      breeding: monthlyBreeding
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get upcoming events
router.get('/upcoming-events', async (req, res) => {
  try {
    const upcomingHealth = await HealthRecord.find({
      nextDueDate: { $gte: new Date() }
    })
    .sort({ nextDueDate: 1 })
    .populate('goat', 'name tagNumber')
    .limit(10);

    const upcomingKidding = await BreedingRecord.find({
      status: 'Pregnant',
      expectedDueDate: { $gte: new Date() }
    })
    .sort({ expectedDueDate: 1 })
    .populate('doe', 'name tagNumber')
    .limit(10);

    res.json({
      health: upcomingHealth,
      kidding: upcomingKidding
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ADG distribution across goats (from birth to current)
router.get('/adg-distribution', async (req, res) => {
  try {
    const buckets = await Goat.aggregate([
      { $match: { dateOfBirth: { $type: 'date' }, 'weight.current': { $gt: 0 }, 'weight.birth': { $gte: 0 } } },
      { $addFields: {
          ageDays: { $max: [1, { $floor: { $divide: [ { $subtract: [new Date(), '$dateOfBirth'] }, 1000*60*60*24 ] } }] },
          adg: {
            $cond: [
              { $and: [ { $ne: ['$weight.birth', null] }, { $ne: ['$weight.current', null] } ] },
              { $divide: [ { $subtract: ['$weight.current', '$weight.birth'] }, { $max: [1, { $floor: { $divide: [ { $subtract: [new Date(), '$dateOfBirth'] }, 1000*60*60*24 ] } }] } ] },
              null
            ]
          }
        }
      },
      { $match: { adg: { $ne: null } } },
      { $bucket: {
          groupBy: '$adg',
          boundaries: [0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40, 1.00],
          default: '>=1.0',
          output: { count: { $sum: 1 } }
        }
      }
    ]);
    res.json(buckets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Slow growers list with links (ADG below threshold)
router.get('/slow-growers', async (req, res) => {
  try {
    const { threshold = 0.12, limit = 10 } = req.query;
    const results = await Goat.aggregate([
      { $match: { dateOfBirth: { $type: 'date' }, 'weight.current': { $gt: 0 }, 'weight.birth': { $gte: 0 } } },
      { $addFields: {
          ageDays: { $max: [1, { $floor: { $divide: [ { $subtract: [new Date(), '$dateOfBirth'] }, 1000*60*60*24 ] } }] },
          adg: {
            $cond: [
              { $and: [ { $ne: ['$weight.birth', null] }, { $ne: ['$weight.current', null] } ] },
              { $divide: [ { $subtract: ['$weight.current', '$weight.birth'] }, '$ageDays' ] },
              null
            ]
          }
        }
      },
      { $match: { adg: { $ne: null, $lt: Number(threshold) } } },
      { $project: { name: 1, tagNumber: 1, breed: 1, 'weight.current': 1, adg: 1 } },
      { $sort: { adg: 1 } },
      { $limit: Number(limit) }
    ]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;