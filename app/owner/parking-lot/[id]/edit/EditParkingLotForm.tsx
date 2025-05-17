"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Layout from '@/app/components/layout/Layout';
import Card from '@/app/components/ui/Card';

interface ParkingLot {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_spaces: number;
  available_spaces: number;
  price_per_hour: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface FormData {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalSpaces: number;
  availableSpaces: number;
  pricePerHour: number;
}

interface EditParkingLotFormProps {
  parkingLotId: string;
}

export default function EditParkingLotForm({ parkingLotId }: EditParkingLotFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    totalSpaces: 0,
    availableSpaces: 0,
    pricePerHour: 0,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchParkingLot();
  }, [user, parkingLotId]);

  const fetchParkingLot = async () => {
    try {
      const { data: parkingLot, error } = await supabase
        .from('parking_lots')
        .select('*')
        .eq('id', parkingLotId)
        .single();

      if (error) throw error;

      if (parkingLot) {
        setFormData({
          name: parkingLot.name,
          address: parkingLot.address,
          latitude: parkingLot.latitude,
          longitude: parkingLot.longitude,
          totalSpaces: parkingLot.total_spaces,
          availableSpaces: parkingLot.available_spaces,
          pricePerHour: parkingLot.price_per_hour,
        });
      }
    } catch (error: any) {
      console.error('Error fetching parking lot:', error.message);
      setError('無法載入停車場資料');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const { error } = await supabase
        .from('parking_lots')
        .update({
          name: formData.name,
          address: formData.address,
          latitude: formData.latitude,
          longitude: formData.longitude,
          total_spaces: formData.totalSpaces,
          available_spaces: formData.availableSpaces,
          price_per_hour: formData.pricePerHour,
          updated_at: new Date().toISOString(),
        })
        .eq('id', parkingLotId);

      if (error) throw error;

      router.push('/owner/parking-lots');
    } catch (error: any) {
      console.error('Error updating parking lot:', error.message);
      setError('更新停車場資料失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">編輯停車場</h1>
          </div>

          <Card className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="停車場名稱"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
                <Input
                  type="number"
                  label="緯度"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="經度"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="總車位數"
                  value={formData.totalSpaces}
                  onChange={(e) => setFormData({ ...formData, totalSpaces: parseInt(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="可用車位數"
                  value={formData.availableSpaces}
                  onChange={(e) => setFormData({ ...formData, availableSpaces: parseInt(e.target.value) })}
                  required
                />
                <Input
                  type="number"
                  label="每小時價格"
                  value={formData.pricePerHour}
                  onChange={(e) => setFormData({ ...formData, pricePerHour: parseFloat(e.target.value) })}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/owner/parking-lots')}
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  disabled={saving}
                >
                  儲存
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 