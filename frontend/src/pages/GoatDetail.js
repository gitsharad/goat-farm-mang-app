import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, Weight, FileText, Heart, Baby, Utensils, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const GoatDetail = () => {
  const { id } = useParams();
  const { language } = useLanguage();
  const [goat, setGoat] = useState(null);
  const [healthRecords, setHealthRecords] = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [feedRecords, setFeedRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab] = useState('overview');
  const [weightSeries, setWeightSeries] = useState([]);
  const [weightSeriesFiltered, setWeightSeriesFiltered] = useState([]);
  const [weightFilter, setWeightFilter] = useState('all'); // 'all' | '30' | '90'
  const [weightSummary, setWeightSummary] = useState(null);
  const [weightForm, setWeightForm] = useState({ date: '', weight: '', source: 'scale', notes: '' });
  const [addingWeight, setAddingWeight] = useState(false);

  useEffect(() => {
    fetchGoatDetails();
  }, [id]);

  const fetchGoatDetails = useCallback(async () => {
    try {
      const [goatRes, healthRes, breedingRes, feedRes, weightsRes] = await Promise.all([
        api.get(`/goats/${id}`),
        api.get(`/health?goat=${id}`),
        api.get(`/breeding?goat=${id}`),
        api.get(`/feed?goat=${id}`),
        api.get(`/weights/${id}?sort=asc`)
      ]);

      setGoat(goatRes.data);
      setHealthRecords(healthRes.data.records || []);
      setBreedingRecords(breedingRes.data.records || []);
      setFeedRecords(feedRes.data.records || []);
      const ws = (weightsRes.data.records || []).map(r => ({
        date: r.date,
        dateLabel: new Date(r.date).toLocaleDateString(),
        weight: r.weight
      }));
      setWeightSeries(ws);
      // initialize filtered series to full set
      setWeightSeriesFiltered(ws);
      setWeightSummary(weightsRes.data.summary || null);
      setLoading(false);
    } catch (error) {
      toast.error(getTranslation(language, 'operationFailed'));
      setLoading(false);
    }
  }, [id]);

  const submitWeight = async (e) => {
    e.preventDefault();
    if (!weightForm.weight) {
      toast.error(getTranslation(language, 'weight') + ' ' + getTranslation(language, 'required'));
      return;
    }
    // Client-side duplicate date guard
    if (weightForm.date) {
      const picked = new Date(weightForm.date);
      picked.setHours(0,0,0,0);
      const exists = weightSeries.some(r => {
        const d = new Date(r.date);
        d.setHours(0,0,0,0);
        return d.getTime() === picked.getTime();
      });
      if (exists) {
        toast.error('A weight record for this date already exists.');
        return;
      }
    }
    try {
      setAddingWeight(true);
      await api.post(`/weights/${id}`, {
        date: weightForm.date || new Date().toISOString().slice(0,10),
        weight: Number(weightForm.weight),
        source: weightForm.source,
        notes: weightForm.notes
      });
      setWeightForm({ date: '', weight: '', source: 'scale', notes: '' });
      await fetchGoatDetails();
      toast.success(getTranslation(language, 'saved'));
    } catch (error) {
      toast.error(getTranslation(language, 'operationFailed'));
    } finally {
      setAddingWeight(false);
    }
  };

  // Apply weight filter when filter changes or source series changes
  useEffect(() => {
    if (!weightSeries || weightSeries.length === 0) {
      setWeightSeriesFiltered([]);
      return;
    }
    if (weightFilter === 'all') {
      setWeightSeriesFiltered(weightSeries);
      return;
    }
    const days = weightFilter === '30' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    setWeightSeriesFiltered(weightSeries.filter(r => new Date(r.date) >= cutoff));
  }, [weightFilter, weightSeries]);

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'sold': 'bg-blue-100 text-blue-800',
      'deceased': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getGenderColor = (gender) => {
    return gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800';
  };

  const getBreedingStatusColor = (status) => {
    const colors = {
      'not-bred': 'bg-gray-100 text-gray-800',
      'bred': 'bg-blue-100 text-blue-800',
      'pregnant': 'bg-green-100 text-green-800',
      'kidding': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return getTranslation(language, 'na');
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return getTranslation(language, 'na');
    const age = Math.floor((new Date() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 365));
    return `${age} ${getTranslation(language, 'years')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{getTranslation(language, 'loading')}</p>
        </div>
      </div>
    );
  }

  if (!goat) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{getTranslation(language, 'goatDetails')}</h2>
        <p className="text-gray-600 mb-4">{getTranslation(language, 'noData')}</p>
        <Link to="/goats" className="btn-primary">
          {getTranslation(language, 'back')} {getTranslation(language, 'goats')}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/goats" className="btn-icon btn-icon-secondary" title={getTranslation(language, 'back')}>
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{goat.name}</h1>
          <p className="text-gray-600">Tag #{goat.tagNumber} • {goat.breed}</p>
        </div>
        <div className="ml-auto">
          <Link to={`/goats/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4 mr-2" />
            {getTranslation(language, 'edit')}
          </Link>
        </div>
      </div>

      {/* Basic Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{getTranslation(language, 'dateOfBirth')}</p>
              <p className="font-semibold text-gray-900">{calculateAge(goat.dateOfBirth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Weight className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{getTranslation(language, 'weight')}</p>
              <p className="font-semibold text-gray-900">{goat.weight?.current ?? goat.weight ?? 0} {getTranslation(language, 'kg')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MapPin className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{getTranslation(language, 'location')}</p>
              <p className="font-semibold text-gray-900">{goat.location || getTranslation(language, 'na')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{getTranslation(language, 'status')}</p>
              <span className={`badge ${getStatusColor(goat.status)}`}>
                {getTranslation(language, goat.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: getTranslation(language, 'overview'), icon: FileText },
              { id: 'health', label: getTranslation(language, 'health'), icon: Heart },
              { id: 'breeding', label: getTranslation(language, 'breeding'), icon: Baby },
              { id: 'feed', label: getTranslation(language, 'feed'), icon: Utensils }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{getTranslation(language, 'basicInformation')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'tagNumber')}:</span>
                      <span className="font-medium">{goat.tagNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'name')}:</span>
                      <span className="font-medium">{goat.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'breed')}:</span>
                      <span className="font-medium">{goat.breed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'gender')}:</span>
                      <span className={`badge ${getGenderColor(goat.gender)}`}>
                        {getTranslation(language, goat.gender)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'dateOfBirth')}:</span>
                      <span className="font-medium">{formatDate(goat.dateOfBirth)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'weight')}:</span>
                      <span className="font-medium">{goat.weight?.current ?? goat.weight ?? 0} {getTranslation(language, 'kg')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'status')}:</span>
                      <span className={`badge ${getStatusColor(goat.status)}`}>
                        {getTranslation(language, goat.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'location')}:</span>
                      <span className="font-medium">{goat.location || getTranslation(language, 'na')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{getTranslation(language, 'healthBreedingStatus')}</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'vaccinated')}:</span>
                      <span className={`badge ${goat.health?.vaccinated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {goat.health?.vaccinated ? getTranslation(language, 'yes') : getTranslation(language, 'no')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'dewormed')}:</span>
                      <span className={`badge ${goat.health?.dewormed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {goat.health?.dewormed ? getTranslation(language, 'yes') : getTranslation(language, 'no')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'lastVaccination')}:</span>
                      <span className="font-medium">{formatDate(goat.health?.lastVaccination)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'lastDeworming')}:</span>
                      <span className="font-medium">{formatDate(goat.health?.lastDeworming)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'breedingStatus')}:</span>
                      <span className={`badge ${getBreedingStatusColor(goat.breeding?.status)}`}>
                        {getTranslation(language, goat.breeding?.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{getTranslation(language, 'pregnancyStatus')}:</span>
                      <span className="font-medium">{goat.breeding?.pregnancyStatus || getTranslation(language, 'na')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Growth: Weight chart + Add form */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border lg:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{getTranslation(language, 'growth') || 'Growth'}</h3>
                    {weightSummary && (
                      <div className="text-sm text-gray-600">
                        <span className="mr-4">Start: <strong>{weightSummary.startWeight?.toFixed(2)} kg</strong></span>
                        <span className="mr-4">End: <strong>{weightSummary.endWeight?.toFixed(2)} kg</strong></span>
                        <span className="mr-4">Days: <strong>{weightSummary.days}</strong></span>
                        <span>ADG: <strong>{Math.round((weightSummary.adg || 0) * 1000)} g/day</strong></span>
                      </div>
                    )}
                  </div>
                  {/* Filter controls */}
                  <div className="flex items-center gap-2 mb-2">
                    <button className={`px-3 py-1 rounded text-sm ${weightFilter==='all' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setWeightFilter('all')}>All</button>
                    <button className={`px-3 py-1 rounded text-sm ${weightFilter==='30' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setWeightFilter('30')}>30d</button>
                    <button className={`px-3 py-1 rounded text-sm ${weightFilter==='90' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`} onClick={() => setWeightFilter('90')}>90d</button>
                  </div>
                  {weightSeriesFiltered.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noData')}</p>
                  ) : (
                    <div style={{ width: '100%', height: 280 }}>
                      <ResponsiveContainer>
                        <LineChart data={weightSeriesFiltered} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="dateLabel" minTickGap={20} />
                          <YAxis unit=" kg" allowDecimals domain={['dataMin - 2', 'dataMax + 2']} />
                          <Tooltip formatter={(v) => [`${v} kg`, getTranslation(language, 'weight')]} labelFormatter={(l) => l} />
                          <Line type="monotone" dataKey="weight" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{getTranslation(language, 'add')} {getTranslation(language, 'weight')}</h3>
                  <form onSubmit={submitWeight} className="space-y-3">
                    <div>
                      <label className="label">{getTranslation(language, 'date')}</label>
                      <input type="date" className="input" value={weightForm.date} onChange={(e) => setWeightForm({ ...weightForm, date: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">{getTranslation(language, 'weight')} (kg)</label>
                      <input type="number" step="0.01" min="0" className="input" value={weightForm.weight} onChange={(e) => setWeightForm({ ...weightForm, weight: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">{getTranslation(language, 'source') || 'Source'}</label>
                      <select className="input" value={weightForm.source} onChange={(e) => setWeightForm({ ...weightForm, source: e.target.value })}>
                        <option value="scale">Scale</option>
                        <option value="estimate">Estimate</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{getTranslation(language, 'notes')}</label>
                      <textarea className="input" rows={3} value={weightForm.notes} onChange={(e) => setWeightForm({ ...weightForm, notes: e.target.value })} />
                    </div>
                    <button type="submit" className="btn-primary w-full" disabled={addingWeight}>
                      {addingWeight ? getTranslation(language, 'saving') : getTranslation(language, 'save')}
                    </button>
                  </form>
                </div>
              </div>

              {goat.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">{getTranslation(language, 'notes')}</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{goat.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Health Records Tab */}
          {activeTab === 'health' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{getTranslation(language, 'health')}</h3>
                <Link to="/health" className="btn-primary">
                  {getTranslation(language, 'addHealthRecord')}
                </Link>
              </div>
              {healthRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noData')}</p>
              ) : (
                <div className="space-y-4">
                  {healthRecords.map((record) => (
                    <div key={record._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{record.type}</h4>
                          <p className="text-gray-600 text-sm">{record.description}</p>
                          <p className="text-gray-500 text-sm mt-1">
                            Date: {formatDate(record.date)} • Vet: {record.veterinarian || 'N/A'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Breeding Records Tab */}
          {activeTab === 'breeding' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{getTranslation(language, 'breeding')}</h3>
                <Link to="/breeding" className="btn-primary">
                  {getTranslation(language, 'addBreedingRecord')}
                </Link>
              </div>
              {breedingRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noData')}</p>
              ) : (
                <div className="space-y-4">
                  {breedingRecords.map((record) => (
                    <div key={record._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Mating: {formatDate(record.matingDate)}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Expected Due: {formatDate(record.expectedDueDate)} • 
                            Status: {record.status}
                          </p>
                          {record.kiddingDate && (
                            <p className="text-gray-500 text-sm mt-1">
                              Kidding Date: {formatDate(record.kiddingDate)} • 
                              Kids: {record.kidsBorn} born, {record.kidsSurvived} survived
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(record.matingDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feed Records Tab */}
          {activeTab === 'feed' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{getTranslation(language, 'feed')}</h3>
                <Link to="/feed" className="btn-primary">
                  {getTranslation(language, 'addFeedRecord')}
                </Link>
              </div>
              {feedRecords.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{getTranslation(language, 'noData')}</p>
              ) : (
                <div className="space-y-4">
                  {feedRecords.map((record) => (
                    <div key={record._id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{record.feedType}</h4>
                          <p className="text-gray-600 text-sm">
                            Quantity: {record.quantity} {record.unit} • 
                            Cost: ${record.cost}
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            Date: {formatDate(record.date)} • 
                            Feeding Time: {record.feedingTime || 'N/A'}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoatDetail; 