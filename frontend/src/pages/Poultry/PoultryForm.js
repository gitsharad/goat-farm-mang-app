import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const PoultryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const { t } = useTranslation('poultry');
  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, formState: { errors }, watch } = useForm({
    defaultValues: {
      tagNumber: '',
      batchNumber: '',
      breed: '',
      type: 'Layer',
      dateOfHatch: '',
      source: 'Hatchery',
      status: 'Active',
      location: '',
      notes: '',
      health: {
        status: 'Healthy',
        lastCheckup: new Date().toISOString().split('T')[0],
        issues: ''
      },
      vaccination: {
        lastVaccine: '',
        lastVaccineDate: '',
        nextVaccineDate: ''
      }
    }
  });

  useEffect(() => {
    if (isEditing) {
      const fetchPoultry = async () => {
        try {
          const response = await api.get(`/poultry/${id}`);
          reset({
            ...response.data,
            dateOfHatch: response.data.dateOfHatch
              ? new Date(response.data.dateOfHatch).toISOString().split('T')[0]
              : ''
          });
        } catch (error) {
          console.error('Error fetching poultry:', error);
          toast.error('Failed to load poultry data');
        } finally {
          setLoading(false);
        }
      };
      fetchPoultry();
    }
  }, [id, isEditing, reset]);

  const lastVaccine = watch('vaccination.lastVaccine');
  const lastVaccineDate = watch('vaccination.lastVaccineDate');

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data };

      if (data.vaccination.lastVaccine && data.vaccination.lastVaccineDate) {
        payload.vaccination = [{
          vaccine: data.vaccination.lastVaccine,
          date: data.vaccination.lastVaccineDate,
          nextDate: data.vaccination.nextVaccineDate || null,
        }];
      } else {
        payload.vaccination = [];
      }

      if (isEditing) {
        await api.put(`/poultry/${id}`, payload);
        toast.success(t('pages.poultryForm.success.updated'));
      } else {
        await api.post('/poultry', payload);
        toast.success(t('pages.poultryForm.success.added'));
      }
      navigate('/poultry');
    } catch (error) {
      console.error('Error saving poultry:', error);
      const errorMessage = error.response?.data?.message || t(`pages.poultryForm.error.${isEditing ? 'updateFailed' : 'addFailed'}`);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {isEditing ? t('pages.poultryForm.editTitle') : t('pages.poultryForm.addTitle')}
          </h1>
          <button
            onClick={() => navigate('/poultry')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">{t('pages.poultryForm.sections.basicInfo')}</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.tagNumber')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('tagNumber', { required: t('pages.poultryForm.validation.tagNumberRequired') })}
                  className={`input ${errors.tagNumber ? 'border-red-500' : ''}`}
                  placeholder={t('pages.poultryForm.placeholders.tagNumber')}
                />
                {errors.tagNumber && (
                  <p className="mt-1 text-sm text-red-600">{t('pages.poultryForm.validation.tagNumberRequired')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryForm.labels.batchNumber')}</label>
                <input
                  type="text"
                  {...register('batchNumber')}
                  className="input"
                  placeholder={t('pages.poultryForm.placeholders.batchNumber')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.breed')} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('breed', { required: t('pages.poultryForm.validation.breedRequired') })}
                  className={`input ${errors.breed ? 'border-red-500' : ''}`}
                >
                  <option value="">{t('pages.poultryForm.labels.selectBreed')}</option>
                  <option value="Broiler">{t('types.Broiler')}</option>
                  <option value="Layer">{t('types.Layer')}</option>
                  <option value="Desi">{t('types.Desi')}</option>
                  <option value="Kadaknath">{t('types.Kadaknath')}</option>
                  <option value="Aseel">{t('types.Aseel')}</option>
                  <option value="Rhode Island Red">{t('types.RhodeIslandRed')}</option>
                  <option value="Other">{t('types.Other')}</option>
                </select>
                {errors.breed && (
                  <p className="mt-1 text-sm text-red-600">{t('pages.poultryForm.validation.breedRequired')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryForm.labels.type')}</label>
                <select {...register('type')} className="input">
                  <option value="Layer">{t('types.Layer')}</option>
                  <option value="Broiler">{t('types.Broiler')}</option>
                  <option value="Dual Purpose">{t('types.DualPurpose')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryForm.labels.dateOfHatch')}</label>
                <input
                  type="date"
                  {...register('dateOfHatch')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('pages.poultryForm.labels.source')}</label>
                <select {...register('source')} className="input">
                  <option value="Hatchery">{t('sources.Hatchery')}</option>
                  <option value="Farm Raised">{t('sources.FarmRaised')}</option>
                  <option value="Local Market">{t('sources.LocalMarket')}</option>
                  <option value="Other">{t('sources.Other')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.status')}
                </label>
                <select {...register('status')} className="input">
                  <option value="Active">{t('status.active')}</option>
                  <option value="Inactive">{t('status.inactive')}</option>
                  <option value="Sold">{t('status.sold')}</option>
                  <option value="Deceased">{t('status.deceased')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.location')}
                </label>
                <input
                  type="text"
                  {...register('location')}
                  className="input"
                  placeholder={t('pages.poultryForm.placeholders.location')}
                />
              </div>
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b pb-2">
                {t('pages.poultryForm.sections.healthInfo')}
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.healthStatus')}
                </label>
                <select {...register('health.status')} className="input">
                  <option value="Healthy">{t('healthStatus.healthy')}</option>
                  <option value="Sick">{t('healthStatus.sick')}</option>
                  <option value="Under Treatment">{t('healthStatus.underTreatment')}</option>
                  <option value="Recovering">{t('healthStatus.recovering')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.lastCheckup')}
                </label>
                <input
                  type="date"
                  {...register('health.lastCheckup')}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.healthIssues')}
                </label>
                <textarea
                  {...register('health.issues')}
                  className="input"
                  rows="3"
                  placeholder={t('pages.poultryForm.placeholders.healthIssues')}
                ></textarea>
              </div>

              <h3 className="text-md font-medium text-gray-900 mt-6 mb-2">
                {t('pages.poultryForm.sections.vaccination')}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.lastVaccine')}
                </label>
                <input
                  type="text"
                  {...register('vaccination.lastVaccine', {
                    validate: value => {
                      if (lastVaccineDate && !value) {
                        return t('pages.poultryForm.validation.vaccineNameRequired');
                      }
                      return true;
                    }
                  })}
                  className={`input ${errors.vaccination?.lastVaccine ? 'border-red-500' : ''}`}
                  placeholder={t('pages.poultryForm.placeholders.vaccineName')}
                />
                {errors.vaccination?.lastVaccine && (
                  <p className="mt-1 text-sm text-red-600">{errors.vaccination.lastVaccine.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.poultryForm.labels.vaccineDate')}
                  </label>
                  <input
                    type="date"
                    {...register('vaccination.lastVaccineDate', {
                      validate: value => {
                        if (lastVaccine && !value) {
                          return t('pages.poultryForm.validation.vaccineDateRequired');
                        }
                        return true;
                      }
                    })}
                    className={`input ${errors.vaccination?.lastVaccineDate ? 'border-red-500' : ''}`}
                  />
                  {errors.vaccination?.lastVaccineDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.vaccination.lastVaccineDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('pages.poultryForm.labels.nextVaccineDate')}
                  </label>
                  <input
                    type="date"
                    {...register('vaccination.nextVaccineDate')}
                    className="input"
                  />
                </div>
              </div>

              <div className="pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('pages.poultryForm.labels.notes')}
                </label>
                <textarea
                  {...register('notes')}
                  className="input"
                  rows="4"
                  placeholder={t('pages.poultryForm.placeholders.notes')}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/poultry')}
              className="btn-secondary"
            >
              {t('pages.poultryForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {submitting ? t('common:loading') : t('pages.poultryForm.buttons.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PoultryForm;
