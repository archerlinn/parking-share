"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';
import TextArea from '../../../../components/ui/TextArea';
import Card from '../../../../components/ui/Card';
import LocationSearch from '../../../../components/ui/LocationSearch';
import { useAuth } from '../../../../providers/AuthProvider';
import { useParking } from '../../../../providers/ParkingProvider';

export default function EditParkingLotPage() {
  const params = useParams();
  const parkingLotId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const { user } = useAuth();
  const { getParkingLotById, updateParkingLot, loading } = useParking();
  
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    latitude: '',
    longitude: '',
    floor: '',
    number: '',
    restriction: '',
    notes: '',
    photoUrl: '',
    pricePerHour: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [notFoundError, setNotFoundError] = useState('');
  
  // Load parking lot data
  useEffect(() => {
    if (parkingLotId) {
      const parkingLot = getParkingLotById(parkingLotId);
      if (parkingLot) {
        setFormData({
          street: parkingLot.street,
          city: parkingLot.city,
          state: parkingLot.state,
          zipCode: parkingLot.zip_code,
          country: parkingLot.country || 'United States',
          latitude: parkingLot.latitude.toString(),
          longitude: parkingLot.longitude.toString(),
          floor: parkingLot.floor || '',
          number: parkingLot.number || '',
          restriction: parkingLot.restriction || '',
          notes: parkingLot.notes || '',
          photoUrl: parkingLot.photo_url || '',
          pricePerHour: parkingLot.price_per_hour.toString(),
        });
      } else {
        setNotFoundError('找不到車位。');
      }
    }
  }, [parkingLotId, getParkingLotById]);
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.street.trim()) {
      newErrors.street = '請輸入街道地址';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = '請輸入城市';
    }
    
    if (!formData.state.trim()) {
      newErrors.state = '請輸入州/省';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = '請輸入郵遞區號';
    }
    
    if (!formData.latitude.trim() || !formData.longitude.trim()) {
      newErrors.latitude = '請輸入座標';
      newErrors.longitude = '請輸入座標';
    } else {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = '緯度必須在 -90 到 90 之間';
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = '經度必須在 -180 到 180 之間';
      }
    }
    
    if (!formData.notes.trim()) {
      newErrors.notes = '請輸入使用說明';
    }
    
    if (!formData.pricePerHour.trim()) {
      newErrors.pricePerHour = '請輸入每小時價格';
    } else {
      const price = parseFloat(formData.pricePerHour);
      if (isNaN(price) || price < 0) {
        newErrors.pricePerHour = '價格不能為負數';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user) {
      setErrors({
        form: '您必須登入才能更新車位資訊',
      });
      return;
    }
    
    const parkingLotData = {
      street: formData.street,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zipCode,
      country: formData.country,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      floor: formData.floor || null,
      number: formData.number || null,
      restriction: formData.restriction || null,
      notes: formData.notes || null,
      photo_url: formData.photoUrl || null,
      price_per_hour: parseFloat(formData.pricePerHour),
    };
    
    const updatedParkingLot = await updateParkingLot(parkingLotId, parkingLotData);
    
    if (updatedParkingLot) {
      setSuccessMessage('車位更新成功！即將跳轉...');
      setTimeout(() => {
        router.push(`/owner/parking-lot/${parkingLotId}/page`);
      }, 2000);
    } else {
      setErrors({
        form: '更新失敗，請稍後再試。',
      });
    }
  };
  
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
          setErrors(prev => ({
            ...prev,
            latitude: 'Could not get your current location',
          }));
        }
      );
    } else {
      setErrors(prev => ({
        ...prev,
        latitude: 'Geolocation is not supported by your browser',
      }));
    }
  };
  
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">您需要登入才能編輯車位</h2>
              <p className="mt-2 text-sm text-gray-600">請登入或註冊帳號以繼續。</p>
              <div className="mt-6">
                <Button onClick={() => router.push(`/auth/login?next=/owner/parking-lot/${parkingLotId}/edit`)}>
                  登入
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (notFoundError) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">{notFoundError}</h2>
              <div className="mt-6">
                <Button onClick={() => router.push(`/owner/parking-lot/${parkingLotId}/page`)}>
                  返回至車位詳情
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              編輯車位
            </h1>
            <Button
              variant="outline"
              onClick={() => router.push(`/owner/parking-lot/${parkingLotId}/page`)}
            >
              返回至車位詳情
            </Button>
          </div>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            更新您的車位資訊。
          </p>
            
          <div className="mt-10">
            <Card className="p-6 sm:p-8 border border-gray-200 shadow-sm">
              {successMessage ? (
                <div className="text-center text-green-600 py-12">
                  <div className="text-3xl mb-4">✓</div>
                  <p className="text-xl font-semibold">{successMessage}</p>
                </div>
              ) : (
                <form className="space-y-8" onSubmit={handleSubmit}>
                  {errors.form && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                      <p>{errors.form}</p>
                    </div>
                  )}
                  
                  <div className="space-y-8 divide-y divide-gray-200">
                    <div className="space-y-6 pt-4">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">位置資訊</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-6 mb-4">
                          <LocationSearch
                            defaultValue={formData.street}
                            onLocationSelect={(location) => {
                              setFormData(prev => ({
                                ...prev,
                                street: location.address,
                                city: location.city,
                                state: location.state,
                                zipCode: location.zipCode,
                                country: location.country,
                                latitude: location.latitude.toString(),
                                longitude: location.longitude.toString(),
                              }));
                              setErrors(prev => {
                                const newErrors = {...prev};
                                delete newErrors.street;
                                delete newErrors.city;
                                delete newErrors.state;
                                delete newErrors.zipCode;
                                delete newErrors.latitude;
                                delete newErrors.longitude;
                                return newErrors;
                              });
                            }}
                            error={errors.street}
                          />
                        </div>
                      
                        <div className="sm:col-span-3">
                          <Input
                            id="street"
                            name="street"
                            type="text"
                            label="街道地址"
                            value={formData.street}
                            onChange={handleChange}
                            error={errors.street}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="city"
                            name="city"
                            type="text"
                            label="城市"
                            value={formData.city}
                            onChange={handleChange}
                            error={errors.city}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="state"
                            name="state"
                            type="text"
                            label="州/省"
                            value={formData.state}
                            onChange={handleChange}
                            error={errors.state}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="zipCode"
                            name="zipCode"
                            type="text"
                            label="郵遞區號"
                            value={formData.zipCode}
                            onChange={handleChange}
                            error={errors.zipCode}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-2">
                          <Input
                            id="country"
                            name="country"
                            type="text"
                            label="國家"
                            value={formData.country}
                            onChange={handleChange}
                            error={errors.country}
                            fullWidth
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">座標</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <Input
                            id="latitude"
                            name="latitude"
                            type="text"
                            label="緯度"
                            value={formData.latitude}
                            onChange={handleChange}
                            error={errors.latitude}
                            fullWidth
                            disabled
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="longitude"
                            name="longitude"
                            type="text"
                            label="經度"
                            value={formData.longitude}
                            onChange={handleChange}
                            error={errors.longitude}
                            fullWidth
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-6 pt-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">車位詳情</h3>
                      
                      <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <Input
                            id="floor"
                            name="floor"
                            type="text"
                            label="樓層"
                            value={formData.floor}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <Input
                            id="number"
                            name="number"
                            type="text"
                            label="車位號碼"
                            value={formData.number}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <Input
                            id="restriction"
                            name="restriction"
                            type="text"
                            label="使用限制"
                            value={formData.restriction}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <Input
                            id="pricePerHour"
                            name="pricePerHour"
                            type="text"
                            label="每小時價格 ($)"
                            value={formData.pricePerHour}
                            onChange={handleChange}
                            error={errors.pricePerHour}
                            fullWidth
                          />
                        </div>
                        
                        <div className="sm:col-span-3">
                          <Input
                            id="photoUrl"
                            name="photoUrl"
                            type="text"
                            label="照片網址 (選填)"
                            value={formData.photoUrl}
                            onChange={handleChange}
                            fullWidth
                          />
                        </div>

                        {formData.photoUrl && (
                          <div className="sm:col-span-6 mt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              照片預覽
                            </label>
                            <div className="relative h-48 w-full bg-gray-100 rounded-md overflow-hidden">
                              <img
                                src={formData.photoUrl}
                                alt="車位預覽"
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = 'none';
                                  setErrors(prev => ({
                                    ...prev,
                                    photoUrl: '無效的圖片網址，請提供有效的網址。'
                                  }));
                                }}
                                onLoad={() => {
                                  if (errors.photoUrl) {
                                    setErrors(prev => {
                                      const newErrors = {...prev};
                                      delete newErrors.photoUrl;
                                      return newErrors;
                                    });
                                  }
                                }}
                              />
                            </div>
                            {errors.photoUrl && (
                              <p className="mt-1 text-sm text-red-600">
                                {errors.photoUrl}
                              </p>
                            )}
                          </div>
                        )}
                        
                        <div className="sm:col-span-6">
                          <TextArea
                            id="notes"
                            name="notes"
                            label="使用說明"
                            value={formData.notes}
                            onChange={handleChange}
                            error={errors.notes}
                            rows={4}
                            fullWidth
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-x-4 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/owner/parking-lot/${parkingLotId}/page`)}
                    >
                      取消
                    </Button>
                    <Button type="submit" isLoading={loading} className="min-w-[120px]">
                      更新
                    </Button>
                  </div>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 