const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const auth = require('../middleware/auth');
const BillingTransaction = require('../models/BillingTransaction');

// Feature flag: disable subscriptions and grant full access by default
const SUBSCRIPTIONS_ENABLED = false; // set to true to re-enable subscriptions

// Get user's aggregated subscription (merge of all user's subscriptions)
router.get('/me', auth, async (req, res) => {
  try {
    if (!SUBSCRIPTIONS_ENABLED) {
      // Return full access with generous defaults
      return res.json({
        plan: 'all',
        farmTypeAccess: { goat: true, poultry: true, dairy: true },
        features: {
          maxAnimals: 1000000,
          healthTracking: true,
          breedingManagement: true,
          feedManagement: true,
          analytics: true,
          mobileApp: true,
          apiAccess: true
        },
        status: 'active',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
    }
    const subscriptions = await Subscription.find({ userId: req.user._id }).lean();
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ message: 'No subscription found' });
    }
    // Aggregate across all subscriptions
    const aggregated = subscriptions.reduce((acc, sub) => {
      // merge access
      acc.farmTypeAccess.goat = !!(acc.farmTypeAccess.goat || sub.farmTypeAccess?.goat);
      acc.farmTypeAccess.poultry = !!(acc.farmTypeAccess.poultry || sub.farmTypeAccess?.poultry);
      acc.farmTypeAccess.dairy = !!(acc.farmTypeAccess.dairy || sub.farmTypeAccess?.dairy);
      // merge features
      const f = sub.features || {};
      acc.features.maxAnimals = Math.max(acc.features.maxAnimals, f.maxAnimals || 0);
      ['healthTracking','breedingManagement','feedManagement','analytics','mobileApp','apiAccess'].forEach(k => {
        acc.features[k] = !!(acc.features[k] || f[k]);
      });
      // end date (max)
      if (sub.endDate) {
        const d = new Date(sub.endDate);
        if (!acc.endDate || d > acc.endDate) acc.endDate = d;
      }
      // pick a label: 'multi' if more than one distinct plan
      acc._plans.add(sub.plan);
      return acc;
    }, { plan: 'multi', farmTypeAccess: { goat:false, poultry:false, dairy:false }, features: { maxAnimals: 0 }, endDate: null, _plans: new Set() });
    aggregated.plan = aggregated._plans.size === 1 ? Array.from(aggregated._plans)[0] : 'multi';
    delete aggregated._plans;
    res.json(aggregated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const plans = Subscription.getPlans();
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upgrade subscription (purchase or extend a specific farm-type plan)
router.post('/upgrade', auth, async (req, res) => {
  try {
    if (!SUBSCRIPTIONS_ENABLED) {
      // No-op when disabled; return full access snapshot
      return res.json({
        plan: 'all',
        farmTypeAccess: { goat: true, poultry: true, dairy: true },
        features: {
          maxAnimals: 1000000,
          healthTracking: true,
          breedingManagement: true,
          feedManagement: true,
          analytics: true,
          mobileApp: true,
          apiAccess: true
        },
        status: 'active',
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
    }
    const { plan } = req.body;
    const plans = Subscription.getPlans();
    
    if (!plans[plan]) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }
    
    const selectedPlan = plans[plan];
    const endDate = new Date(Date.now() + selectedPlan.duration * 24 * 60 * 60 * 1000);
    // Find or create subscription specific to this plan for this user
    let subscription = await Subscription.findOne({ userId: req.user._id, plan });
    if (subscription) {
      const currentEnd = subscription.endDate ? new Date(subscription.endDate) : new Date(0);
      subscription.endDate = currentEnd > endDate ? currentEnd : endDate;
      // Ensure farm type access and features are correct per plan definition
      subscription.farmTypeAccess = selectedPlan.farmTypeAccess;
      subscription.features = selectedPlan.features;
      subscription.amount = selectedPlan.price;
      subscription.paymentStatus = selectedPlan.price === 0 ? 'paid' : 'pending';
      subscription.status = 'active';
      if (subscription.isTrial) subscription.isTrial = false;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: req.user._id,
        plan,
        farmTypeAccess: selectedPlan.farmTypeAccess,
        features: selectedPlan.features,
        endDate,
        amount: selectedPlan.price,
        paymentStatus: selectedPlan.price === 0 ? 'paid' : 'pending',
        status: 'active'
      });
    }
    // Record billing transaction
    await BillingTransaction.create({
      userId: req.user._id,
      subscriptionId: subscription._id,
      plan,
      amount: selectedPlan.price,
      status: selectedPlan.price === 0 ? 'paid' : 'pending',
      currency: subscription.currency || 'USD',
      method: 'manual',
      meta: { action: 'upgrade' }
    });

    // Return aggregated view after purchase
    const subs = await Subscription.find({ userId: req.user._id }).lean();
    const aggregated = subs.reduce((acc, sub) => {
      acc.farmTypeAccess.goat = !!(acc.farmTypeAccess.goat || sub.farmTypeAccess?.goat);
      acc.farmTypeAccess.poultry = !!(acc.farmTypeAccess.poultry || sub.farmTypeAccess?.poultry);
      acc.farmTypeAccess.dairy = !!(acc.farmTypeAccess.dairy || sub.farmTypeAccess?.dairy);
      const f = sub.features || {};
      acc.features.maxAnimals = Math.max(acc.features.maxAnimals, f.maxAnimals || 0);
      ['healthTracking','breedingManagement','feedManagement','analytics','mobileApp','apiAccess'].forEach(k => {
        acc.features[k] = !!(acc.features[k] || f[k]);
      });
      if (sub.endDate) {
        const d = new Date(sub.endDate);
        if (!acc.endDate || d > acc.endDate) acc.endDate = d;
      }
      acc._plans.add(sub.plan);
      return acc;
    }, { plan: 'multi', farmTypeAccess: { goat:false, poultry:false, dairy:false }, features: { maxAnimals: 0 }, endDate: null, _plans: new Set() });
    aggregated.plan = aggregated._plans.size === 1 ? Array.from(aggregated._plans)[0] : 'multi';
    delete aggregated._plans;
    res.json(aggregated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check farm type access
router.get('/access/:farmType', auth, async (req, res) => {
  try {
    if (!SUBSCRIPTIONS_ENABLED) {
      return res.json({ hasAccess: true, accessibleFarmTypes: ['goat','poultry','dairy'] });
    }
    const { farmType } = req.params;
    const subscriptions = await Subscription.find({ userId: req.user._id });
    if (!subscriptions || subscriptions.length === 0) {
      return res.json({ hasAccess: false, message: 'No subscription found' });
    }
    const hasAccess = subscriptions.some(sub => sub.hasFarmTypeAccess(farmType));
    const accessibleFarmTypes = ['goat','poultry','dairy'].filter(ft => subscriptions.some(sub => sub.hasFarmTypeAccess(ft)));
    res.json({ hasAccess, accessibleFarmTypes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get billing history
router.get('/history', auth, async (req, res) => {
  try {
    if (!SUBSCRIPTIONS_ENABLED) {
      return res.json([]);
    }
    const subscriptions = await Subscription.find({ userId: req.user._id }).lean();
    if (!subscriptions || subscriptions.length === 0) return res.json([]);
    const ids = subscriptions.map(s => s._id);
    const history = await BillingTransaction.find({ subscriptionId: { $in: ids } })
      .sort({ createdAt: -1 })
      .lean();
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start a trial (once per user)
router.post('/start-trial', auth, async (req, res) => {
  try {
    const TRIAL_DAYS = 14;
    let subscription = await Subscription.findOne({ userId: req.user._id });
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    if (!subscription) {
      // create default farm-type plan then mark trial
      const plans = Subscription.getPlans();
      const user = await User.findById(req.user._id).lean();
      const selected = Array.isArray(user?.farmTypes) ? user.farmTypes : [];
      const defaultPlanKey = (user?.primaryFarmType && plans[user.primaryFarmType])
        ? user.primaryFarmType
        : (selected.find(ft => plans[ft]) || 'goat');
      const defaultPlan = plans[defaultPlanKey];
      subscription = new Subscription({
        userId: req.user._id,
        plan: defaultPlanKey,
        farmTypeAccess: defaultPlan.farmTypeAccess,
        features: defaultPlan.features,
        endDate: new Date(now.getTime() + defaultPlan.duration * 24 * 60 * 60 * 1000),
        paymentStatus: defaultPlan.price === 0 ? 'paid' : 'pending',
        status: 'active'
      });
    }

    if (subscription.isTrial && subscription.trialEndDate && subscription.trialEndDate > now) {
      return res.status(400).json({ message: 'Trial already active' });
    }

    // Allow only one trial historically
    const hadTrialBefore = !!(subscription.trialStartDate && subscription.trialEndDate);
    if (hadTrialBefore && !(subscription.isTrial && subscription.trialEndDate > now)) {
      return res.status(400).json({ message: 'Trial already used' });
    }

    subscription.isTrial = true;
    subscription.trialStartDate = now;
    subscription.trialEndDate = trialEnd;
    await subscription.save();
    return res.json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
