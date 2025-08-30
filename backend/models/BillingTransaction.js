const mongoose = require('mongoose');

const billingTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true, index: true },
  plan: { type: String, enum: ['goat', 'poultry', 'dairy'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: { type: String, enum: ['paid', 'pending', 'failed', 'refunded'], default: 'paid' },
  method: { type: String, default: 'manual' },
  meta: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('BillingTransaction', billingTransactionSchema);
