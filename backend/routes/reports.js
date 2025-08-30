const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Goat = require('../models/Goat');
const BreedingRecord = require('../models/BreedingRecord');
const mongoose = require('mongoose');

function parseDateRange(query) {
  const now = new Date();
  const defaultEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const defaultStart = new Date(defaultEnd);
  defaultStart.setDate(defaultEnd.getDate() - 29); // last 30 days

  const start = query.start ? new Date(query.start) : defaultStart;
  const end = query.end ? new Date(query.end) : defaultEnd;
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end date');
  }
  return { start, end };
}

// Compute start/end dates for a given grouped period label
function periodToDateRange(period, group) {
  if (!period || !group) throw new Error('period and group are required');
  let start, end;
  const toEndOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  if (group === 'day') {
    const [y, m, d] = period.split('-').map(Number);
    if (!y || !m || !d) throw new Error('Invalid day period');
    start = new Date(y, m - 1, d, 0, 0, 0, 0);
    end = toEndOfDay(start);
  } else if (group === 'month') {
    const [y, m] = period.split('-').map(Number);
    if (!y || !m) throw new Error('Invalid month period');
    start = new Date(y, m - 1, 1, 0, 0, 0, 0);
    end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
  } else if (group === 'week') {
    // Expect format YYYY-Www (ISO week)
    const match = period.match(/^(\d{4})-W(\d{1,2})$/);
    if (!match) throw new Error('Invalid week period');
    const year = parseInt(match[1], 10);
    const week = parseInt(match[2], 10);
    // ISO week: week 1 has Jan 4. Start is Monday.
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const day = jan4.getUTCDay() || 7; // 1=Mon..7=Sun
    const mondayWeek1 = new Date(jan4);
    mondayWeek1.setUTCDate(jan4.getUTCDate() - day + 1);
    const monday = new Date(mondayWeek1);
    monday.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
    start = new Date(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate(), 0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    end = new Date(sunday.getUTCFullYear(), sunday.getUTCMonth(), sunday.getUTCDate(), 23, 59, 59, 999);
  } else {
    throw new Error('Unsupported group');
  }
  return { start, end };
}

function buildCsv(rows, headers) {
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const header = headers.join(',');
  const data = rows.map(r => headers.map(h => escape(r[h])).join(',')).join('\n');
  return header + '\n' + data + '\n';
}

// GET /api/reports/sales
// Query: start, end (ISO), group=day|week|month, buyer, format=csv|json (default json)
router.get('/sales', async (req, res) => {
  try {
    const t0 = Date.now();
    const { start, end } = parseDateRange(req.query);
    const group = (req.query.group || 'day').toLowerCase();
    const buyer = req.query.buyer?.trim();
    const format = (req.query.format || 'json').toLowerCase();

    const match = { date: { $gte: start, $lte: end } };
    if (buyer) {
      match['buyer.name'] = { $regex: buyer, $options: 'i' };
    }

    const dateKey = (function() {
      if (group === 'month') return { $dateToString: { format: '%Y-%m', date: '$date' } };
      if (group === 'week') return { $concat: [ { $toString: { $isoWeekYear: '$date' } }, '-W', { $toString: { $isoWeek: '$date' } } ] };
      return { $dateToString: { format: '%Y-%m-%d', date: '$date' } }; // day
    })();

    const pipeline = [
      { $match: match },
      { $unwind: '$items' },
      {
        $addFields: {
          isGoatItem: { $ne: ['$items.goat', null] },
          qty: { $ifNull: ['$items.quantity', 1] },
          itemTotal: { $ifNull: ['$items.total', 0] }
        }
      },
      {
        $group: {
          _id: dateKey,
          invoices: { $addToSet: '$invoiceNumber' },
          goatQuantity: { $sum: { $cond: [{ $eq: ['$isGoatItem', true] }, '$qty', 0] } },
          itemRevenue: { $sum: '$itemTotal' }
        }
      },
      { $project: { _id: 0, period: '$_id', invoicesCount: { $size: '$invoices' }, goatQuantity: 1, revenue: '$itemRevenue' } },
      { $sort: { period: 1 } }
    ];

    const summary = await Sale.aggregate(pipeline);

    // totals
    const totals = summary.reduce((acc, r) => {
      acc.invoicesCount += r.invoicesCount;
      acc.goatQuantity += r.goatQuantity;
      acc.revenue += r.revenue;
      return acc;
    }, { invoicesCount: 0, goatQuantity: 0, revenue: 0 });

// GET /api/reports/finance
// Query: start, end, group=day|week|month (default day), format=csv|json
router.get('/finance', async (req, res) => {
  try {
    const t0 = Date.now();
    const { start, end } = parseDateRange(req.query);
    const group = (req.query.group || 'day').toLowerCase();
    const format = (req.query.format || 'json').toLowerCase();

    const dateKey = (function() {
      if (group === 'month') return { $dateToString: { format: '%Y-%m', date: '$date' } };
      if (group === 'week') return { $concat: [ { $toString: { $isoWeekYear: '$date' } }, '-W', { $toString: { $isoWeek: '$date' } } ] };
      return { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    })();

    const matchRange = { date: { $gte: start, $lte: end } };

    // Revenue from sales items total
    const salesSeries = await Sale.aggregate([
      { $match: matchRange },
      { $unwind: '$items' },
      { $addFields: { itemTotal: { $ifNull: ['$items.total', 0] } } },
      { $group: { _id: dateKey, revenue: { $sum: '$itemTotal' } } },
      { $project: { _id: 0, period: '$_id', revenue: 1 } }
    ]);

    // Feed costs
    const FeedRecord = require('../models/FeedRecord');
    const feedSeries = await FeedRecord.aggregate([
      { $match: matchRange },
      { $group: { _id: dateKey, feedCost: { $sum: { $ifNull: ['$cost', 0] } } } },
      { $project: { _id: 0, period: '$_id', feedCost: 1 } }
    ]);

    // Health costs
    const HealthRecord = require('../models/HealthRecord');
    const healthSeries = await HealthRecord.aggregate([
      { $match: matchRange },
      { $group: { _id: dateKey, healthCost: { $sum: { $ifNull: ['$cost', 0] } } } },
      { $project: { _id: 0, period: '$_id', healthCost: 1 } }
    ]);

    // Breeding costs (breedingCost + veterinaryCost)
    const breedingSeries = await BreedingRecord.aggregate([
      { $match: { matingDate: { $gte: start, $lte: end } } },
      { $addFields: { date: '$matingDate' } },
      { $group: { _id: dateKey, breedingCost: { $sum: { $add: [ { $ifNull: ['$breedingCost', 0] }, { $ifNull: ['$veterinaryCost', 0] } ] } } } },
      { $project: { _id: 0, period: '$_id', breedingCost: 1 } }
    ]);

    // Merge by period
    const byPeriod = new Map();
    const merge = (arr, field) => {
      (arr || []).forEach(r => {
        const obj = byPeriod.get(r.period) || { period: r.period, revenue: 0, feedCost: 0, healthCost: 0, breedingCost: 0 };
        obj[field] = r[field] || 0;
        byPeriod.set(r.period, obj);
      });
    };

    merge(salesSeries, 'revenue');
    merge(feedSeries, 'feedCost');
    merge(healthSeries, 'healthCost');
    merge(breedingSeries, 'breedingCost');

    const summary = Array.from(byPeriod.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(r => {
        const totalCost = (r.feedCost || 0) + (r.healthCost || 0) + (r.breedingCost || 0);
        const net = (r.revenue || 0) - totalCost;
        return { ...r, totalCost, net };
      });

    const totals = summary.reduce((acc, r) => {
      acc.revenue += r.revenue || 0;
      acc.feedCost += r.feedCost || 0;
      acc.healthCost += r.healthCost || 0;
      acc.breedingCost += r.breedingCost || 0;
      acc.totalCost += r.totalCost || 0;
      acc.net += r.net || 0;
      return acc;
    }, { revenue: 0, feedCost: 0, healthCost: 0, breedingCost: 0, totalCost: 0, net: 0 });

    if (format === 'csv') {
      const csv = buildCsv(summary, ['period','revenue','feedCost','healthCost','breedingCost','totalCost','net']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="finance-report-${group}.csv"`);
      return res.status(200).send(csv);
    }

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/finance -> ${elapsedMs}ms`);
    res.json({ range: { start, end }, group, summary, totals, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate finance report' });
  }
});

// GET /api/reports/feed
// Query: start, end, group=day|week|month (default day), feedType (optional), unit (optional), format=csv|json
router.get('/feed', async (req, res) => {
  try {
    const t0 = Date.now();
    const { start, end } = parseDateRange(req.query);
    const group = (req.query.group || 'day').toLowerCase();
    const feedType = req.query.feedType?.trim();
    const unit = req.query.unit?.trim();
    const format = (req.query.format || 'json').toLowerCase();

    const FeedRecord = require('../models/FeedRecord');

    const match = { date: { $gte: start, $lte: end } };
    if (feedType) match.feedType = feedType;
    if (unit) match.unit = unit;

    const dateKey = (function() {
      if (group === 'month') return { $dateToString: { format: '%Y-%m', date: '$date' } };
      if (group === 'week') return { $concat: [ { $toString: { $isoWeekYear: '$date' } }, '-W', { $toString: { $isoWeek: '$date' } } ] };
      return { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    })();

    const pipeline = [
      { $match: match },
      { $group: {
          _id: dateKey,
          records: { $sum: 1 },
          totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } }
        } },
      { $project: { _id: 0, period: '$_id', records: 1, totalQuantity: 1, totalCost: 1 } },
      { $sort: { period: 1 } }
    ];

    const summary = await FeedRecord.aggregate(pipeline);

    const totals = summary.reduce((acc, r) => {
      acc.records += r.records;
      acc.totalQuantity += r.totalQuantity;
      acc.totalCost += r.totalCost;
      return acc;
    }, { records: 0, totalQuantity: 0, totalCost: 0 });

    if (format === 'csv') {
      const csv = buildCsv(summary, ['period', 'records', 'totalQuantity', 'totalCost']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="feed-report-${group}.csv"`);
      return res.status(200).send(csv);
    }

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/feed -> ${elapsedMs}ms`);
    res.json({ range: { start, end }, group, filters: { feedType: feedType || null, unit: unit || null }, summary, totals, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate feed report' });
  }
});

    if (format === 'csv') {
      const csv = buildCsv(summary, ['period', 'invoicesCount', 'goatQuantity', 'revenue']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="sales-report-${group}.csv"`);
      return res.status(200).send(csv);
    }

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/sales -> ${elapsedMs}ms`);
    res.json({ range: { start, end }, group, summary, totals, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate sales report' });
  }
});

// GET /api/reports/breeding
// Query: start, end, group=day|week|month, type=matings|pregnancies|kiddings|all, format=csv|json
router.get('/breeding', async (req, res) => {
  try {
    const t0 = Date.now();
    const { start, end } = parseDateRange(req.query);
    const group = (req.query.group || 'day').toLowerCase();
    const type = (req.query.type || 'all').toLowerCase();
    const format = (req.query.format || 'json').toLowerCase();

    const dateKeyFor = (field) => {
      if (group === 'month') return { $dateToString: { format: '%Y-%m', date: `$${field}` } };
      if (group === 'week') return { $concat: [ { $toString: { $isoWeekYear: `$${field}` } }, '-W', { $toString: { $isoWeek: `$${field}` } } ] };
      return { $dateToString: { format: '%Y-%m-%d', date: `$${field}` } };
    };

    const facet = {};
    if (type === 'matings' || type === 'all') {
      facet.matings = [
        { $match: { matingDate: { $gte: start, $lte: end } } },
        { $group: { _id: dateKeyFor('matingDate'), count: { $sum: 1 } } },
        { $project: { _id: 0, period: '$_id', count: 1 } }
      ];
    }
    if (type === 'pregnancies' || type === 'all') {
      facet.pregnancies = [
        { $match: { pregnancyConfirmed: true, confirmationDate: { $gte: start, $lte: end } } },
        { $group: { _id: dateKeyFor('confirmationDate'), count: { $sum: 1 } } },
        { $project: { _id: 0, period: '$_id', count: 1 } }
      ];
    }
    if (type === 'kiddings' || type === 'all') {
      facet.kiddings = [
        { $match: { kiddingDate: { $gte: start, $lte: end } } },
        { $group: { _id: dateKeyFor('kiddingDate'),
            count: { $sum: 1 },
            kidsBorn: { $sum: { $ifNull: ['$kidsBorn', 0] } },
            kidsSurvived: { $sum: { $ifNull: ['$kidsSurvived', 0] } }
          } },
        { $project: { _id: 0, period: '$_id', count: 1, kidsBorn: 1, kidsSurvived: 1 } }
      ];
    }

    const facetResultArr = await BreedingRecord.aggregate([{ $facet: facet }]);
    const facetResult = facetResultArr[0] || {};

    // Merge series by period
    const byPeriod = new Map();
    const upsert = (arr, key, fields) => {
      (arr || []).forEach(r => {
        const obj = byPeriod.get(r.period) || { period: r.period, matings: 0, pregnancies: 0, kiddings: 0, kidsBorn: 0, kidsSurvived: 0 };
        if (key === 'matings') obj.matings = r.count;
        if (key === 'pregnancies') obj.pregnancies = r.count;
        if (key === 'kiddings') {
          obj.kiddings = r.count;
          obj.kidsBorn = r.kidsBorn || 0;
          obj.kidsSurvived = r.kidsSurvived || 0;
        }
        byPeriod.set(r.period, obj);
      });
    };

    upsert(facetResult.matings, 'matings');
    upsert(facetResult.pregnancies, 'pregnancies');
    upsert(facetResult.kiddings, 'kiddings');

    const summary = Array.from(byPeriod.values()).sort((a, b) => a.period.localeCompare(b.period))
      .map(r => ({ ...r, avgLitterSize: r.kiddings ? (r.kidsBorn / r.kiddings) : 0 }));

    // Totals
    const totals = summary.reduce((acc, r) => {
      acc.matings += r.matings;
      acc.pregnancies += r.pregnancies;
      acc.kiddings += r.kiddings;
      acc.kidsBorn += r.kidsBorn;
      acc.kidsSurvived += r.kidsSurvived;
      return acc;
    }, { matings: 0, pregnancies: 0, kiddings: 0, kidsBorn: 0, kidsSurvived: 0 });
    totals.avgLitterSize = totals.kiddings ? (totals.kidsBorn / totals.kiddings) : 0;

    // If filtering by a single type, strip unrelated columns for clarity
    const filterColumns = (row) => {
      if (type === 'matings') return { period: row.period, matings: row.matings };
      if (type === 'pregnancies') return { period: row.period, pregnancies: row.pregnancies };
      if (type === 'kiddings') return { period: row.period, kiddings: row.kiddings, kidsBorn: row.kidsBorn, kidsSurvived: row.kidsSurvived, avgLitterSize: row.avgLitterSize };
      return row;
    };

    if (format === 'csv') {
      const data = summary.map(r => filterColumns(r));
      const headersAll = ['period','matings','pregnancies','kiddings','kidsBorn','kidsSurvived','avgLitterSize'];
      const headers = type === 'matings' ? ['period','matings']
        : type === 'pregnancies' ? ['period','pregnancies']
        : type === 'kiddings' ? ['period','kiddings','kidsBorn','kidsSurvived','avgLitterSize']
        : headersAll;
      const csv = buildCsv(data, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="breeding-report-${group}-${type}.csv"`);
      return res.status(200).send(csv);
    }

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/breeding -> ${elapsedMs}ms`);
    res.json({ range: { start, end }, group, type, summary: summary.map(filterColumns), totals: filterColumns({ period: 'TOTAL', ...totals }), elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate breeding report' });
  }
});

// GET /api/reports/health
// Query: start, end, type=Treatment|Vaccination|All, group=day|week|month, format=csv|json (default json)
router.get('/health', async (req, res) => {
  try {
    const t0 = Date.now();
    const { start, end } = parseDateRange(req.query);
    const group = (req.query.group || 'day').toLowerCase();
    const type = (req.query.type || 'All');
    const format = (req.query.format || 'json').toLowerCase();

    const match = { date: { $gte: start, $lte: end } };
    if (type && type !== 'All') match.type = type;

    const dateKey = (function() {
      if (group === 'month') return { $dateToString: { format: '%Y-%m', date: '$date' } };
      if (group === 'week') return { $concat: [ { $toString: { $isoWeekYear: '$date' } }, '-W', { $toString: { $isoWeek: '$date' } } ] };
      return { $dateToString: { format: '%Y-%m-%d', date: '$date' } }; // day
    })();

    const HealthRecord = require('../models/HealthRecord');

    const pipeline = [
      { $match: match },
      { $group: {
          _id: dateKey,
          records: { $sum: 1 },
          totalCost: { $sum: { $ifNull: ['$cost', 0] } }
        }
      },
      { $project: { _id: 0, period: '$_id', records: 1, totalCost: 1 } },
      { $sort: { period: 1 } }
    ];

    const summary = await HealthRecord.aggregate(pipeline);

    const totals = summary.reduce((acc, r) => {
      acc.records += r.records;
      acc.totalCost += r.totalCost;
      return acc;
    }, { records: 0, totalCost: 0 });

    // Overdue and upcoming counts
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const overdueCount = await HealthRecord.countDocuments({ nextDueDate: { $lt: now } });
    const upcomingCount = await HealthRecord.countDocuments({ nextDueDate: { $gte: now, $lte: in30 } });

    if (format === 'csv') {
      const csv = buildCsv(summary, ['period', 'records', 'totalCost']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="health-report-${group}.csv"`);
      return res.status(200).send(csv);
    }

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/health -> ${elapsedMs}ms`);
    res.json({ range: { start, end }, group, type, summary, totals, overdueCount, upcomingCount, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate health report' });
  }
});

// Drill-down details: Sales
// GET /api/reports/sales/details?period=YYYY-MM[-DD or -Www]&group=day|week|month&buyer=&limit=&page=
router.get('/sales/details', async (req, res) => {
  try {
    const t0 = Date.now();
    const group = (req.query.group || 'day').toLowerCase();
    const period = req.query.period;
    const buyer = req.query.buyer?.trim();
    const limit = Math.min(parseInt(req.query.limit || '500', 10), 1000);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    const { start, end } = periodToDateRange(period, group);
    const match = { date: { $gte: start, $lte: end } };
    if (buyer) match['buyer.name'] = { $regex: buyer, $options: 'i' };

    const rows = await Sale.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $addFields: { isGoatItem: { $ne: ['$items.goat', null] }, itemTotal: { $ifNull: ['$items.total', 0] } } },
      { $group: {
          _id: '$_id',
          invoiceNumber: { $first: '$invoiceNumber' },
          date: { $first: '$date' },
          buyerName: { $first: '$buyer.name' },
          itemsCount: { $sum: 1 },
          goatQuantity: { $sum: { $cond: [{ $eq: ['$isGoatItem', true] }, { $ifNull: ['$items.quantity', 1] }, 0] } },
          totalAmount: { $sum: '$itemTotal' }
        }
      },
      { $project: { _id: 0, invoiceNumber: 1, date: 1, buyerName: 1, itemsCount: 1, goatQuantity: 1, totalAmount: 1 } },
      { $sort: { date: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/sales/details -> ${elapsedMs}ms`);
    res.json({ period, group, pagination: { page, limit }, rows, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to fetch sales details' });
  }
});

// Drill-down details: Feed
// GET /api/reports/feed/details?period=...&group=day|week|month&feedType=&unit=&limit=&page=
router.get('/feed/details', async (req, res) => {
  try {
    const t0 = Date.now();
    const FeedRecord = require('../models/FeedRecord');
    const group = (req.query.group || 'day').toLowerCase();
    const period = req.query.period;
    const feedType = req.query.feedType?.trim();
    const unit = req.query.unit?.trim();
    const limit = Math.min(parseInt(req.query.limit || '500', 10), 1000);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    const { start, end } = periodToDateRange(period, group);
    const match = { date: { $gte: start, $lte: end } };
    if (feedType) match.feedType = feedType;
    if (unit) match.unit = unit;

    const rows = await FeedRecord.find(match)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('date goat pen feedType unit quantity cost supplier notes');

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/feed/details -> ${elapsedMs}ms`);
    res.json({ period, group, filters: { feedType: feedType || null, unit: unit || null }, pagination: { page, limit }, rows, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to fetch feed details' });
  }
});

// Drill-down details: Health
// GET /api/reports/health/details?period=...&group=day|week|month&type=&limit=&page=
router.get('/health/details', async (req, res) => {
  try {
    const t0 = Date.now();
    const HealthRecord = require('../models/HealthRecord');
    const group = (req.query.group || 'day').toLowerCase();
    const period = req.query.period;
    const type = req.query.type && req.query.type !== 'All' ? req.query.type : null;
    const limit = Math.min(parseInt(req.query.limit || '500', 10), 1000);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    const { start, end } = periodToDateRange(period, group);
    const match = { date: { $gte: start, $lte: end } };
    if (type) match.type = type;

    const rows = await HealthRecord.find(match)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('date goat type description cost veterinarian nextDueDate');

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/health/details -> ${elapsedMs}ms`);
    res.json({ period, group, filters: { type: type || 'All' }, pagination: { page, limit }, rows, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to fetch health details' });
  }
});

// Drill-down details: Breeding
// GET /api/reports/breeding/details?period=...&group=day|week|month&type=matings|pregnancies|kiddings&limit=&page=
router.get('/breeding/details', async (req, res) => {
  try {
    const t0 = Date.now();
    const group = (req.query.group || 'day').toLowerCase();
    const period = req.query.period;
    const type = (req.query.type || 'matings').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || '500', 10), 1000);
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const skip = (page - 1) * limit;

    let dateField = 'matingDate';
    if (type === 'pregnancies') dateField = 'confirmationDate';
    if (type === 'kiddings') dateField = 'kiddingDate';

    const { start, end } = periodToDateRange(period, group);
    const match = { };
    match[dateField] = { $gte: start, $lte: end };
    if (type === 'pregnancies') match.pregnancyConfirmed = true;

    const rows = await BreedingRecord.find(match)
      .sort({ [dateField]: -1 })
      .skip(skip)
      .limit(limit)
      .select('doe buck matingDate confirmationDate kiddingDate kidsBorn kidsSurvived status breedingMethod breedingCost veterinaryCost');

    const elapsedMs = Date.now() - t0;
    console.log(`/reports/breeding/details -> ${elapsedMs}ms`);
    res.json({ period, group, type, pagination: { page, limit }, rows, elapsedMs });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to fetch breeding details' });
  }
});

module.exports = router;
 
// GET /api/reports/inventory
// Query: breed, gender, format=csv|json (default json)
router.get('/inventory', async (req, res) => {
  try {
    const { breed, gender } = req.query;
    const format = (req.query.format || 'json').toLowerCase();

    const match = {};
    if (breed) match.breed = breed;
    if (gender) match.gender = gender;

    // Status counts
    const statusAgg = await Goat.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
      { $sort: { status: 1 } }
    ]);

    // Age buckets
    const ageAgg = await Goat.aggregate([
      { $match: { ...match, dateOfBirth: { $type: 'date' } } },
      { $addFields: {
          ageYears: {
            $floor: {
              $divide: [ { $subtract: [new Date(), '$dateOfBirth'] }, 1000 * 60 * 60 * 24 * 365.25 ]
            }
          }
        }
      },
      { $bucket: {
          groupBy: '$ageYears',
          boundaries: [0, 1, 3, 5, 8, 100],
          default: 100,
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    const bucketLabel = (b) => {
      if (b === 0) return '0-1 year';
      if (b === 1) return '1-3 years';
      if (b === 3) return '3-5 years';
      if (b === 5) return '5-8 years';
      if (b === 8) return '8+ years';
      return 'Unknown';
    };

    const ageBuckets = ageAgg.map(a => ({ bucket: bucketLabel(a._id), count: a.count }))
      .sort((a, b) => {
        const order = ['0-1 year','1-3 years','3-5 years','5-8 years','8+ years'];
        return order.indexOf(a.bucket) - order.indexOf(b.bucket);
      });

    const totalGoats = await Goat.countDocuments(match);

    if (format === 'csv') {
      const rows = [];
      statusAgg.forEach(s => rows.push({ category: 'status', label: s.status || 'Unknown', count: s.count }));
      ageBuckets.forEach(a => rows.push({ category: 'age_bucket', label: a.bucket, count: a.count }));
      const csv = buildCsv(rows, ['category', 'label', 'count']);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.csv"');
      return res.status(200).send(csv);
    }

    res.json({ filters: { breed: breed || null, gender: gender || null }, totalGoats, statusCounts: statusAgg, ageBuckets });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Failed to generate inventory report' });
  }
});
