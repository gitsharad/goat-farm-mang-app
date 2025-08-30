const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Goat = require('../models/Goat');
const Poultry = require('../models/Poultry');
const Dairy = require('../models/Dairy');

// Helper to compute totals
function computeTotals(items, taxRate = 0) {
  const subTotal = items.reduce((sum, it) => sum + (Number(it.total) || 0), 0);
  const taxAmount = +(subTotal * (Number(taxRate) || 0)).toFixed(2);
  const totalAmount = +(subTotal + taxAmount).toFixed(2);
  return { subTotal, taxAmount, totalAmount };
}

// Simple currency formatter (defaults to INR)
const CURRENCY = process.env.CURRENCY || 'INR';
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(value);
  } catch (e) {
    return value.toFixed(2);
  }
}

// List sales (with optional date range)
router.get('/', async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = {};
    if (start || end) {
      filter.date = {};
      if (start) filter.date.$gte = new Date(start);
      if (end) filter.date.$lte = new Date(end);
    }
    const sales = await Sale.find(filter).sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get sale by id
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('items.goat', 'name tagNumber breed weight')
      .populate('items.poultry', 'tagNumber batchNumber breed quantity status')
      .populate('items.dairy', 'name animalId breed status');
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    const { buyer, items, taxRate = 0, notes } = req.body;
    if (!buyer || !buyer.name) return res.status(400).json({ message: 'Buyer name is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'At least one item is required' });

    // Pre-validate all referenced animals are available for sale and quantity doesn't exceed stock
    for (const it of items) {
      if (it.goat) {
        const goat = await Goat.findById(it.goat);
        if (!goat) return res.status(400).json({ message: `Goat with ID ${it.goat} not found.` });
        if (goat.status !== 'Active') return res.status(400).json({ message: `Goat ${goat.tagNumber} is not available for sale. Its status is ${goat.status}.` });
        
        // Validate quantity doesn't exceed available stock (1 per goat)
        const quantity = Number(it.quantity) || 1;
        if (quantity > 1) {
          return res.status(400).json({ message: `Cannot sell ${quantity} of goat ${goat.tagNumber}. Only 1 available in stock.` });
        }
      } else if (it.poultry) {
        const poultry = await Poultry.findById(it.poultry);
        if (!poultry) return res.status(400).json({ message: `Poultry with ID ${it.poultry} not found.` });
        if (poultry.status !== 'Active') return res.status(400).json({ message: `Poultry ${poultry.tagNumber} is not available for sale. Its status is ${poultry.status}.` });
        const quantity = Math.max(1, Number(it.quantity) || 1);
        if (quantity > poultry.quantity) {
          return res.status(400).json({ message: `Cannot sell ${quantity} units from batch ${poultry.batchNumber}. Only ${poultry.quantity} available.` });
        }
      } else if (it.dairy) {
        const dairy = await Dairy.findById(it.dairy);
        if (!dairy) return res.status(400).json({ message: `Dairy animal with ID ${it.dairy} not found.` });
        if (dairy.status !== 'Active') return res.status(400).json({ message: `Dairy animal ${dairy.animalId || dairy.name || it.dairy} is not available for sale. Its status is ${dairy.status}.` });
        const quantity = Number(it.quantity) || 1;
        if (quantity > 1) {
          return res.status(400).json({ message: `Cannot sell ${quantity} of dairy animal ${dairy.animalId || dairy.name}. Only 1 available in stock.` });
        }
      }
    }

    // Normalize items and compute totals per item if needed
    const normalized = [];
    for (const it of items) {
      let description = it.description;
      if (it.goat) {
        const goat = await Goat.findById(it.goat).select('name tagNumber weight');
        if (!description) description = `Goat ${goat.name || ''} #${goat.tagNumber || ''}`.trim();
      } else if (it.poultry) {
        const poultry = await Poultry.findById(it.poultry).select('tagNumber batchNumber breed');
        if (!description) description = `Poultry ${poultry.tagNumber} (Batch ${poultry.batchNumber}) - ${poultry.breed}`;
      } else if (it.dairy) {
        const dairy = await Dairy.findById(it.dairy).select('name animalId breed');
        if (!description) description = `Dairy ${dairy.name || ''} (${dairy.animalId || ''}) - ${dairy.breed}`.trim();
      }
      const quantity = Math.max(1, Number(it.quantity) || 1);
      const unitPrice = Number(it.unitPrice);
      const weightKg = it.weightKg != null ? Number(it.weightKg) : undefined;
      if (isNaN(unitPrice) || unitPrice < 0) return res.status(400).json({ message: 'Invalid unit price' });
      const total = Number(it.total != null ? it.total : (quantity * unitPrice));
      if (isNaN(total) || total < 0) return res.status(400).json({ message: 'Invalid item total' });
      normalized.push({ goat: it.goat || undefined, poultry: it.poultry || undefined, dairy: it.dairy || undefined, description, quantity, unitPrice, weightKg, total });
    }

    const totals = computeTotals(normalized, taxRate);

    const newSale = new Sale({
      buyer,
      items: normalized,
      subTotal: totals.subTotal,
      taxRate: Number(taxRate) || 0,
      taxAmount: totals.taxAmount,
      totalAmount: totals.totalAmount,
      notes
    });

    const savedSale = await newSale.save();

    // After sale is saved, update inventory/status of included animals
    for (const item of savedSale.items) {
      if (item.goat) {
        await Goat.findByIdAndUpdate(item.goat, {
          status: 'Sold',
          saleDetails: {
            saleId: savedSale._id,
            salePrice: item.unitPrice,
            saleDate: savedSale.date
          }
        });
      } else if (item.poultry) {
        const poultry = await Poultry.findById(item.poultry);
        if (poultry) {
          const newQty = Math.max(0, (poultry.quantity || 0) - (item.quantity || 0));
          const update = { quantity: newQty };
          if (newQty === 0) update.status = 'Sold';
          await Poultry.findByIdAndUpdate(item.poultry, update);
        }
      } else if (item.dairy) {
        await Dairy.findByIdAndUpdate(item.dairy, {
          status: 'Sold'
        });
      }
    }

    res.status(201).json(savedSale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update sale
router.put('/:id', async (req, res) => {
  try {
    const { buyer, items, taxRate = 0, notes } = req.body;
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    if (buyer) sale.buyer = buyer;
    if (Array.isArray(items) && items.length) {
      // recompute as in create
      const normalized = [];
      for (const it of items) {
        let description = it.description;
        if (it.goat) {
          const goat = await Goat.findById(it.goat).select('name tagNumber');
          if (!goat) return res.status(400).json({ message: 'Invalid goat in items' });
          if (!description) description = `Goat ${goat.name || ''} #${goat.tagNumber || ''}`.trim();
        } else if (it.poultry) {
          const poultry = await Poultry.findById(it.poultry).select('tagNumber batchNumber breed');
          if (!poultry) return res.status(400).json({ message: 'Invalid poultry in items' });
          if (!description) description = `Poultry ${poultry.tagNumber} (Batch ${poultry.batchNumber}) - ${poultry.breed}`;
        } else if (it.dairy) {
          const dairy = await Dairy.findById(it.dairy).select('name animalId breed');
          if (!dairy) return res.status(400).json({ message: 'Invalid dairy animal in items' });
          if (!description) description = `Dairy ${dairy.name || ''} (${dairy.animalId || ''}) - ${dairy.breed}`.trim();
        }
        const quantity = Math.max(1, Number(it.quantity) || 1);
        const unitPrice = Number(it.unitPrice);
        const weightKg = it.weightKg != null ? Number(it.weightKg) : undefined;
        if (isNaN(unitPrice) || unitPrice < 0) return res.status(400).json({ message: 'Invalid unit price' });
        const total = Number(it.total != null ? it.total : (quantity * unitPrice));
        if (isNaN(total) || total < 0) return res.status(400).json({ message: 'Invalid item total' });
        normalized.push({ goat: it.goat || undefined, poultry: it.poultry || undefined, dairy: it.dairy || undefined, description, quantity, unitPrice, weightKg, total });
      }
      const totals = computeTotals(normalized, taxRate);
      sale.items = normalized;
      sale.subTotal = totals.subTotal;
      sale.taxRate = Number(taxRate) || 0;
      sale.taxAmount = totals.taxAmount;
      sale.totalAmount = totals.totalAmount;
    }
    if (notes !== undefined) sale.notes = notes;

    await sale.save();
    res.json(sale);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete sale
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // Revert inventory/status of sold animals back
    for (const item of sale.items) {
      if (item.goat) {
        await Goat.findByIdAndUpdate(item.goat, {
          status: 'Active',
          $unset: { saleDetails: 1 } // Remove sale details
        });
      } else if (item.poultry) {
        const poultry = await Poultry.findById(item.poultry);
        if (poultry) {
          const restoredQty = (poultry.quantity || 0) + (item.quantity || 0);
          const update = { quantity: restoredQty };
          if (restoredQty > 0) update.status = 'Active';
          await Poultry.findByIdAndUpdate(item.poultry, update);
        }
      } else if (item.dairy) {
        await Dairy.findByIdAndUpdate(item.dairy, {
          status: 'Active'
        });
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    res.json({ message: 'Sale deleted and inventory restored.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Simple HTML invoice (printable)
router.get('/:id/invoice', async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).send('Sale not found');
    const COMPANY_NAME = process.env.COMPANY_NAME || 'Goat Farm';
    const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '123 Farm Lane, Village, State - 000000';
    const COMPANY_PHONE = process.env.COMPANY_PHONE || '+91 00000 00000';
    const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'info@goatfarm.local';
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${sale.invoiceNumber}</title>
<style>
  :root { --border:#e5e7eb; --muted:#6b7280; --fg:#111827; --subtle:#f9fafb; --primary:#16a34a; }
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; color: var(--fg); margin: 0; padding: 32px; }
  .header { display:flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px; }
  .brand { display:flex; align-items:center; gap:12px; }
  .logo { width: 40px; height: 40px; border-radius: 8px; background: var(--primary); opacity:.9; }
  .brand h1 { font-size: 20px; margin:0; }
  .brand p { margin:0; color: var(--muted); font-size:12px; }
  .meta { text-align:right; }
  .meta h2 { margin:0; font-size: 18px; }
  .meta p { margin:2px 0; color: var(--muted); font-size:12px; }
  .section { margin-top: 18px; }
  .card { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: #fff; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:16px; }
  .label { color: var(--muted); font-size:12px; margin:0; }
  .value { margin:2px 0 0 0; font-weight:600; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; border: 1px solid var(--border); }
  th, td { padding: 10px 8px; border-bottom: 1px solid var(--border); }
  thead th { background: var(--subtle); font-weight:600; font-size: 13px; border-bottom: 1px solid var(--border); }
  tbody tr:nth-child(even) { background: #fff; }
  tbody tr:nth-child(odd) { background: #fcfcfc; }
  .right { text-align:right; }
  .totals { margin-top: 16px; width: 320px; margin-left:auto; }
  .totals .row { display:flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border); }
  .totals .row:last-child { border-bottom: none; font-size: 18px; font-weight: 700; }
  .muted { color: var(--muted); }
  .footer { margin-top: 32px; text-align:center; color: var(--muted); font-size: 12px; }
  @media print {
    body { padding: 0 24px; }
    .btn-print { display:none; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="logo"></div>
      <div>
        <h1>${COMPANY_NAME}</h1>
        <p>${COMPANY_ADDRESS} · ${COMPANY_PHONE} · ${COMPANY_EMAIL}</p>
      </div>
    </div>
    <div class="meta">
      <h2>Invoice</h2>
      <p><strong>#</strong> ${sale.invoiceNumber}</p>
      <p><strong>Date:</strong> ${new Date(sale.date).toLocaleDateString('en-IN')}</p>
    </div>
  </div>

  <div class="section grid">
    <div class="card">
      <p class="label">Billed To</p>
      <p class="value">${sale.buyer?.name || ''}</p>
      <p class="muted">${sale.buyer?.phone || ''}</p>
      <p class="muted">${sale.buyer?.address || ''}</p>
    </div>
    <div class="card">
      <p class="label">Payment Terms</p>
      <p class="value">Due on Receipt</p>
      <p class="label" style="margin-top:8px;">Notes</p>
      <p class="muted">${sale.notes ? sale.notes : 'Thank you for your business.'}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Weight (kg)</th><th class="right">Line Total</th></tr>
    </thead>
    <tbody>
      ${sale.items.map(it => `<tr>
        <td>${it.description || ''}</td>
        <td class="right">${it.quantity || 1}</td>
        <td class="right">${formatCurrency(it.unitPrice || 0)}</td>
        <td class="right">${it.weightKg != null ? it.weightKg : ''}</td>
        <td class="right">${formatCurrency(it.total || 0)}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="totals card">
    <div class="row"><span>Subtotal</span><span>${formatCurrency(sale.subTotal)}</span></div>
    <div class="row"><span>Tax (${(sale.taxRate*100).toFixed(2)}%)</span><span>${formatCurrency(sale.taxAmount)}</span></div>
    <div class="row"><span>Total</span><span>${formatCurrency(sale.totalAmount)}</span></div>
  </div>

  <p class="footer">This is a computer-generated invoice. No signature required.</p>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).send('Error generating invoice');
  }
});

module.exports = router;
