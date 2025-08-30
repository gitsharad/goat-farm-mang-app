const mongoose = require('mongoose');

const SaleItemSchema = new mongoose.Schema({
  goat: { type: mongoose.Schema.Types.ObjectId, ref: 'Goat', required: false },
  poultry: { type: mongoose.Schema.Types.ObjectId, ref: 'Poultry', required: false },
  dairy: { type: mongoose.Schema.Types.ObjectId, ref: 'Dairy', required: false },
  description: { type: String, required: function() { return !this.goat && !this.poultry && !this.dairy; } },
  quantity: { type: Number, default: 1, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  weightKg: { type: Number, required: false, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true, index: true },
  date: { type: Date, default: Date.now },
  buyer: {
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String }
  },
  items: { type: [SaleItemSchema], validate: v => Array.isArray(v) && v.length > 0 },
  subTotal: { type: Number, required: true, min: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Simple invoice number generator: INV-YYYYMMDD-XXXX
SaleSchema.pre('validate', async function(next) {
  if (!this.invoiceNumber) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const prefix = `INV-${y}${m}${d}`;
    // count existing for today to get sequence
    const count = await mongoose.model('Sale').countDocuments({ invoiceNumber: new RegExp(`^${prefix}`) });
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Indexes for reporting performance
SaleSchema.index({ date: 1 });
SaleSchema.index({ 'buyer.name': 1 });

module.exports = mongoose.model('Sale', SaleSchema);
