import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import { Plus, Trash, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const Sales = ({ farmType = 'goat' }) => {
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  // Currency formatter based on language; currency configurable via env
  const CURRENCY = process.env.REACT_APP_CURRENCY || 'INR';
  const formatCurrency = (amount) => {
    const locale = language === 'mr' ? 'mr-IN' : 'en-IN';
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(Number(amount) || 0);
    } catch {
      return (Number(amount) || 0).toFixed(2);
    }
  };

  // Polymorphic item key based on farm type
  const animalKey = farmType; // 'goat' | 'poultry' | 'dairy'
  const emptyItem = () => ({ id: Date.now() + Math.random(), [animalKey]: '', description: '', quantity: 1, unitPrice: '', total: '0.00' });

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [buyer, setBuyer] = useState({ name: '', phone: '', address: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [taxRate, setTaxRate] = useState(0);
  const [activeItems, setActiveItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const computeSubTotal = () => items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unitPrice) || 0), 0);
  const subTotal = computeSubTotal();
  const taxAmount = +(subTotal * (Number(taxRate) || 0)).toFixed(2);
  const totalAmount = +(subTotal + taxAmount).toFixed(2);
  const hasPositiveTotals = items.some(it => (Number(it.quantity) * Number(it.unitPrice)) > 0);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales');
      setSales(res.data || []);
    } catch (e) {
      toast.error(getTranslation(language, 'operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveItems = async () => {
    try {
      let url = '/goats?status=Active&limit=1000';
      if (farmType === 'poultry') url = '/poultry?status=Active&limit=1000';
      if (farmType === 'dairy') url = '/dairy?status=Active&limit=1000';
      const response = await api.get(url);
      // Different shapes per API
      const list = farmType === 'goat' ? (response.data.goats || []) : ((response.data && response.data.data) || []);
      setActiveItems(list);
    } catch (error) {
      console.error('Error fetching active items:', error);
      toast.error(getTranslation(language, 'operationFailed'));
    }
  };

  useEffect(() => {
    fetchSales();
    fetchActiveItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmType]);

  // Reset items when farm type changes to align the key used
  useEffect(() => {
    setItems([emptyItem()]);
  }, [farmType]);

  const addItem = () => setItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;

    const updatedItems = items.map((item, i) => {
      if (i === index) {
        const updatedItem = { ...item, [name]: value };

        if (name === animalKey) {
          const selected = activeItems.find(a => a._id === value);
          if (selected) {
            if (farmType === 'goat') {
              updatedItem.description = `Goat: ${selected.name} (${selected.tagNumber})`;
              updatedItem.quantity = 1;
              updatedItem.unitPrice = '';
            } else if (farmType === 'poultry') {
              updatedItem.description = `Poultry: ${selected.tagNumber} (Batch ${selected.batchNumber})`;
              // quantity can vary for poultry; do not force to 1
              updatedItem.unitPrice = '';
            } else if (farmType === 'dairy') {
              updatedItem.description = `Dairy: ${selected.name || ''} (${selected.animalId})`;
              updatedItem.quantity = 1;
              updatedItem.unitPrice = '';
            }
          } else {
            updatedItem.description = '';
          }
        }

        // Validate quantity for single-animal items (goat/dairy)
        if (name === 'quantity' && updatedItem[animalKey] && farmType !== 'poultry') {
          const qty = Number(value);
          if (qty > 1) {
            updatedItem.quantity = 1;
            toast.error('Cannot sell more than 1 of the same animal');
          }
        }
        return updatedItem;
      }
      return item;
    });

    setItems(updatedItems);
  };

  // Basic validation before submit: require buyer name, each row quantity>=1 and unitPrice>0
  const validateBeforeSubmit = () => {
    let hasError = false;
    items.forEach((it, idx) => {
      const qty = Number(it.quantity);
      const price = Number(it.unitPrice);
      if (!it.description && !it.goat) {
        toast.error(`${t('items')} #${idx + 1}: ${t('description')} ${t('required')}`);
        hasError = true;
      }
      if (isNaN(qty) || qty < 1) {
        toast.error(`${t('items')} #${idx + 1}: ${t('quantity')} ${t('required')}`);
        hasError = true;
      }
      if (isNaN(price) || price <= 0) {
        toast.error(`${t('items')} #${idx + 1}: ${t('unitPrice')} ${t('required')}`);
        hasError = true;
      }
    });
    return !hasError;
  };

  const createSale = async (e) => {
    e.preventDefault();
    try {
      // Buyer validation
      if (!buyer.name) {
        toast.error(getTranslation(language, 'required'));
        return;
      }
      // Items validation
      if (!validateBeforeSubmit()) return;
      setCreating(true);
      const sanitizedItems = items.map(it => ({
        [animalKey]: it[animalKey] || undefined,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
      })).filter(it => it.description && (it.quantity * it.unitPrice) >= 0);
      if (!sanitizedItems.length) return toast.error(getTranslation(language, 'noData'));
      const payload = { buyer, items: sanitizedItems, taxRate: Number(taxRate) || 0 };
      let res;
      if (editingId) {
        res = await api.put(`/sales/${editingId}`, payload);
        toast.success(getTranslation(language, 'recordUpdated') || 'Record updated');
      } else {
        res = await api.post('/sales', payload);
        toast.success(getTranslation(language, 'recordAdded'));
      }
      setBuyer({ name: '', phone: '', address: '' });
      setItems([emptyItem()]);
      setTaxRate(0);
      setSales(prev => [res.data, ...prev]);
      setEditingId(null);
      // refresh lists
      fetchSales();
      fetchActiveItems();
    } catch (e) {
      toast.error(getTranslation(language, 'operationFailed'));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (sale) => {
    // Prefill form from sale
    setBuyer({
      name: sale.buyer?.name || '',
      phone: sale.buyer?.phone || '',
      address: sale.buyer?.address || ''
    });
    const mappedItems = (sale.items || []).map(it => ({
      id: Date.now() + Math.random(),
      [animalKey]: it[animalKey] || '',
      description: it.description || '',
      quantity: Number(it.quantity) || 1,
      unitPrice: Number(it.unitPrice) || 0,
      total: (Number(it.total) || (Number(it.quantity) * Number(it.unitPrice))).toFixed(2)
    }));
    setItems(mappedItems.length ? mappedItems : [emptyItem()]);
    setTaxRate(Number(sale.taxRate) || 0);
    setEditingId(sale._id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setBuyer({ name: '', phone: '', address: '' });
    setItems([emptyItem()]);
    setTaxRate(0);
  };

  const deleteSale = async (id) => {
    const noun = farmType === 'goat' ? 'Goats' : farmType === 'poultry' ? 'Poultry' : 'Dairy animals';
    if (!window.confirm(`Delete this sale? ${noun} in this sale will be restored to Active/stock.`)) return;
    try {
      await api.delete(`/sales/${id}`);
      toast.success('Sale deleted');
      setSales(prev => prev.filter(s => s._id !== id));
      // Refresh goats since stock changed
      fetchActiveItems();
    } catch (err) {
      toast.error(getTranslation(language, 'operationFailed'));
    }
  };

  const openInvoice = (id) => {
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/sales/${id}/invoice`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">{t('createSale')}</h2>
        <form onSubmit={createSale} className="mt-4 space-y-6 bg-white p-4 rounded-md border">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">{t('buyer')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input className="input" placeholder={t('name')} value={buyer.name} onChange={e => setBuyer({ ...buyer, name: e.target.value })} required />
              <input className="input" placeholder={t('phone')} value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} />
              <input className="input" placeholder={t('address')} value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })} />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">{t('items')}</h3>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <select
                    name={animalKey}
                    value={it[animalKey]}
                    onChange={(e) => handleItemChange(idx, e)}
                    className="w-full p-2 border rounded bg-white md:col-span-5"
                    disabled={Boolean(editingId && it[animalKey] && !activeItems.some(a => a._id === it[animalKey]))}
                  >
                    <option value="">{farmType === 'goat' ? t('selectGoatOrEnterDesc') : (farmType === 'poultry' ? 'Select Poultry or enter description' : 'Select Dairy or enter description')}</option>
                    {/* Ensure current selected animal appears even if not active (e.g., editing a past sale) */}
                    {it[animalKey] && !activeItems.some(a => a._id === it[animalKey]) && (
                      <option value={it[animalKey]}>
                        {it.description || `Selected Item (${it[animalKey]})`} [Sold]
                      </option>
                    )}
                    {activeItems
                      .filter(a => !items.some((item, itemIdx) => itemIdx !== idx && item[animalKey] === a._id))
                      .map(a => (
                        <option key={a._id} value={a._id}>
                          {farmType === 'goat' && `${a.name} (${a.tagNumber}) - ${a.breed} [Stock: 1]`}
                          {farmType === 'poultry' && `${a.tagNumber} (Batch ${a.batchNumber}) - ${a.breed} [Stock: ${a.quantity}]`}
                          {farmType === 'dairy' && `${a.name || a.animalId} (${a.animalId}) - ${a.breed} [Stock: 1]`}
                        </option>
                      ))}
                  </select>
                  <input
                    type="text"
                    name="description"
                    value={it.description}
                    onChange={(e) => handleItemChange(idx, e)}
                    placeholder={t('description')}
                    className="w-full p-2 border rounded md:col-span-5"
                    disabled={!!it[animalKey]} // Disable if an animal is selected
                  />
                  <input 
                    type="number" 
                    name="quantity" 
                    min="1" 
                    max={it[animalKey] && farmType !== 'poultry' ? "1" : "999"} 
                    className="w-full p-2 border rounded md:col-span-2" 
                    placeholder={t('quantity')} 
                    value={it.quantity} 
                    onChange={(e) => handleItemChange(idx, e)} 
                    disabled={!!it[animalKey] && farmType !== 'poultry'}
                  />
                  <input type="number" name="unitPrice" step="0.01" min="0.01" className="w-full p-2 border rounded md:col-span-2" placeholder={t('unitPrice')} value={it.unitPrice} onChange={(e) => handleItemChange(idx, e)} />
                  <div className="w-full p-2 border rounded bg-gray-50 md:col-span-2 text-right font-semibold">
                    {formatCurrency(Number(it.quantity) * Number(it.unitPrice))}
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="btn-danger md:col-span-1 flex items-center justify-center"><Trash className="h-4 w-4" /></button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="btn-outline flex items-center gap-2"><Plus className="h-4 w-4" /> {t('addItem')}</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('tax')} (%)</label>
              <input type="number" step="0.01" className="input" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </div>
            <div className="md:col-span-3 text-right space-y-1">
              <p>{t('subTotal')}: <span className="font-bold">{formatCurrency(subTotal)}</span></p>
              <p>{t('tax')}: <span className="font-bold">{formatCurrency(taxAmount)}</span></p>
              <p className="text-lg">{t('total')}: <span className="font-bold">{formatCurrency(totalAmount)}</span></p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            {editingId && (
              <button type="button" onClick={cancelEdit} className="btn-outline">{getTranslation(language, 'cancel') || 'Cancel'}</button>
            )}
            <button type="submit" disabled={creating || !hasPositiveTotals} aria-busy={creating} className="btn-primary inline-flex items-center gap-2" title={!hasPositiveTotals ? 'Add at least one item with a positive total' : ''}>
              {creating && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {editingId ? (getTranslation(language, 'update') || 'Update') : t('createSale')}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">{t('sales')}</h2>
        <div className="mt-4 bg-white border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">#</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">{t('buyer')}</th>
                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">{t('total')}</th>
                <th className="px-4 py-2">{t('invoice')} #</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">{getTranslation(language, 'loading')}</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-6 text-center text-gray-500">{t('noData')}</td></tr>
              ) : (
                sales.map(sale => (
                  <tr key={sale._id}>
                    <td className="px-4 py-2 text-sm text-gray-700">{sale.invoiceNumber}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{sale.buyer?.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-700">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatCurrency(sale.totalAmount || 0)}</td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => openInvoice(sale._id)} className="btn-outline inline-flex items-center gap-2"><ExternalLink className="h-4 w-4"/> {t('invoice')}</button>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button onClick={() => startEdit(sale)} className="btn-outline">Edit</button>
                      <button onClick={() => deleteSale(sale._id)} className="btn-danger inline-flex items-center gap-1"><Trash className="h-4 w-4"/> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
