"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAuth } from '../../providers/AuthProvider';
import { useParking } from '../../providers/ParkingProvider';
import Image from 'next/image';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const {
    myParkingLots,
    updateParkingLotAvailability,
  } = useParking();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleAvailabilityToggle = async (id: string, current: boolean) => {
    setLoadingStates(prev => ({ ...prev, [id]: true }));
    await updateParkingLotAvailability(id, !current);
    setLoadingStates(prev => ({ ...prev, [id]: false }));
  };

  // 未登入：提示登入
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">
                請先登入以使用車位管理功能
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                您需要登入或註冊帳號才能繼續。
              </p>
              <div className="mt-6">
                <Button onClick={() => router.push('/auth/login?next=/owner/dashboard')}>
                  前往登入
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
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的車位</h1>
              <p className="mt-2 text-lg text-gray-600">管理您登記的停車位</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => router.push('/owner/parking-lot/register')}>
                新增車位
              </Button>
              <Button variant="outline" onClick={() => router.push('/owner/bookings')}>
                查看預約申請
              </Button>
            </div>
          </div>

          {/* 車位清單 */}
          <div className="mt-8">
            {myParkingLots.length === 0 ? (
              <Card className="mt-4 p-6 text-center">
                <p className="text-gray-600">您尚未登記任何停車位。</p>
                <div className="mt-4">
                  <Button onClick={() => router.push('/owner/parking-lot/register')}>
                    前往登記車位
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {myParkingLots.map(lot => (
                  <Card key={lot.id} className="overflow-hidden" hover>
                    {/* 圖片 */}
                    <Image
                      src={lot.photo_url || '/placeholder-parking.jpg'}
                      alt={`停車位 - ${lot.street}`}
                      width={300}
                      height={200}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {lot.street}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {lot.city}, {lot.state} {lot.zip_code}
                      </p>
                      <p className="mt-1 text-sm font-semibold">${lot.price_per_hour} / 小時</p>

                      {/* 設施列表 */}
                      {lot.amenities.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500">提供設備：</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {lot.amenities.map((amenity, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800"
                              >
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 操作按鈕 */}
                      <div className="mt-6 flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/owner/parking-lot/${lot.id}/page`)}
                        >
                          查看詳情
                        </Button>
                        <div className="flex space-x-2">
                          <Button
                            variant={lot.is_available ? 'danger' : 'primary'}
                            size="sm"
                            onClick={() => handleAvailabilityToggle(lot.id, lot.is_available)}
                            isLoading={loadingStates[lot.id]}
                          >
                            {lot.is_available ? '標記為佔用' : '標記為可預約'}
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => router.push(`/owner/parking-lot/${lot.id}/edit`)}
                          >
                            編輯
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
