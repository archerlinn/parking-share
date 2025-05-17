"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../../components/layout/Layout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import LocationSearch from '../../../components/ui/LocationSearch';
import { useAuth } from '../../../providers/AuthProvider';
import { useParking } from '../../../providers/ParkingProvider';
import Image from 'next/image';

export default function RegisterParkingLotPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addParkingLot, uploadPhoto, loading } = useParking();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '台灣',
    latitude: '',
    longitude: '',
    floor: '',
    number: '',
    restriction: '',
    notes: '',
    photoUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
    try {
      setUploadingPhoto(true);
      const photoUrl = await uploadPhoto(file);
      setFormData(prev => ({ ...prev, photoUrl }));
      setErrors(prev => ({ ...prev, photo: '' }));
    } catch (error) {
      setErrors(prev => ({ ...prev, photo: '照片上傳失敗' }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.street.trim()) newErrors.street = '請選擇地址';
    if (!formData.city.trim()) newErrors.city = '請選擇城市';
    if (!formData.state.trim()) newErrors.state = '請選擇州/縣市';
    if (!formData.zipCode.trim()) newErrors.zipCode = '請選擇郵遞區號';
    if (!formData.latitude || !formData.longitude) {
      newErrors.latitude = '請選擇位置';
      newErrors.longitude = '請選擇位置';
    }
    if (!formData.floor.trim()) newErrors.floor = '請輸入樓層';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!user) return;

    const parkingLotData = {
      name: `${formData.street}, ${formData.city}`,
      address: `${formData.street}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      totalSpaces: 1,
      availableSpaces: 1,
      pricePerHour: 0,
      photo_url: formData.photoUrl || undefined,
      is_available: true,
      owner: {
        id: user.id,
        name: user.name || '',
        email: user.email || ''
      },
      isFriendOrGroupMember: false
    };

    try {
      await addParkingLot(parkingLotData);
      setSuccessMessage('車位註冊成功！即將跳轉...');
      setTimeout(() => router.push('/owner/dashboard'), 2000);
    } catch (err) {
      setErrors({ form: '提交失敗，請稍後再試。' });
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">請先登入以註冊車位</h2>
              <Button onClick={() => router.push('/auth/login?next=/owner/parking-lot/register')}>登入</Button>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">註冊您的停車位</h1>
          {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* 照片上傳 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">停車場照片</label>
              <div className="mt-2 flex items-center gap-3">
                {previewUrl ? (
                  <div className="relative h-32 w-32">
                    <Image src={previewUrl} alt="preview" fill className="rounded-lg object-cover" />
                  </div>
                ) : (
                  <div className="h-32 w-32 border rounded flex items-center justify-center text-gray-400">尚未上傳</div>
                )}
                <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>
                  {uploadingPhoto ? '上傳中...' : '上傳照片'}
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>
              {errors.photo && <p className="text-red-600 text-sm mt-1">{errors.photo}</p>}
            </div>

            {/* 地址搜尋元件 */}
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
              }}
              error={errors.street}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input id="city" name="city" label="城市" value={formData.city} onChange={handleChange} error={errors.city} fullWidth />
              <Input id="state" name="state" label="縣市/州" value={formData.state} onChange={handleChange} error={errors.state} fullWidth disabled />
              <Input id="zipCode" name="zipCode" label="郵遞區號" value={formData.zipCode} onChange={handleChange} error={errors.zipCode} fullWidth disabled />
            </div>

            {/* 經緯度 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input id="latitude" name="latitude" label="緯度" value={formData.latitude} onChange={handleChange} error={errors.latitude} fullWidth disabled />
              <Input id="longitude" name="longitude" label="經度" value={formData.longitude} onChange={handleChange} error={errors.longitude} fullWidth disabled />
            </div>

            {/* 細項填寫 */}
            <Input id="floor" name="floor" label="樓層（必填）" value={formData.floor} onChange={handleChange} error={errors.floor} fullWidth />
            <Input id="number" name="number" label="號碼（選填）" value={formData.number} onChange={handleChange} fullWidth />
            <Input id="restriction" name="restriction" label="限制事項（選填）" value={formData.restriction} onChange={handleChange} fullWidth />
            <Input id="notes" name="notes" label="其他事項（選填）" value={formData.notes} onChange={handleChange} fullWidth />

            {/* 錯誤 */}
            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => router.back()}>取消</Button>
              <Button type="submit" disabled={loading || uploadingPhoto}>註冊車位</Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}