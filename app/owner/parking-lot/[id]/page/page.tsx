"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '../../../../components/layout/Layout';
import Button from '../../../../components/ui/Button';
import Card from '../../../../components/ui/Card';
import { useAuth } from '../../../../providers/AuthProvider';
import { useParking } from '../../../../providers/ParkingProvider';

export default function ParkingLotDetailsPage() {
  const params = useParams();
  const parkingLotId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const router = useRouter();
  const { user } = useAuth();
  const { getParkingLotById, updateParkingLotAvailability, loading } = useParking();
  
  const parkingLot = getParkingLotById(parkingLotId);
  
  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">您需要登入才能查看此車位</h2>
              <p className="mt-2 text-sm text-gray-600">請登入或註冊帳號以繼續。</p>
              <div className="mt-6">
                <Button onClick={() => router.push(`/auth/login?next=/owner/parking-lot/${parkingLotId}/page`)}>
                  登入
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!parkingLot) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">找不到車位</h2>
              <p className="mt-2 text-sm text-gray-600">您查看的車位不存在或已被移除。</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/owner/dashboard')}>
                  返回至我的車位
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  const toggleAvailability = async () => {
    await updateParkingLotAvailability(parkingLot.id, !parkingLot.is_available);
  };
  
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  車位詳情
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  {parkingLot.street}, {parkingLot.city}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/owner/dashboard')}
                  className="w-full sm:w-auto"
                >
                  返回至我的車位
                </Button>
                {user.id === parkingLot.owner_id && (
                  <Button 
                    variant="primary" 
                    onClick={() => router.push(`/owner/parking-lot/${parkingLot.id}/edit`)}
                    className="w-full sm:w-auto"
                  >
                    編輯車位
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image and Status */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {parkingLot.photo_url ? (
                  <div className="relative aspect-video w-full bg-gray-100">
                    <img
                      src={parkingLot.photo_url}
                      alt={`Parking lot at ${parkingLot.street}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/placeholder-parking.jpg';
                      }}
                    />
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                          parkingLot.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {parkingLot.is_available ? '可供使用' : '使用中'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video w-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">無圖片</span>
                    <div className="absolute top-4 right-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                          parkingLot.is_available
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {parkingLot.is_available ? '可供使用' : '使用中'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Location and Price Info */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">位置資訊</h2>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-500">地址</div>
                          <div className="mt-1 text-base text-gray-900">
                            {parkingLot.street}, {parkingLot.city}, {parkingLot.state} {parkingLot.zip_code}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">價格</h2>
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-500">每小時價格</div>
                          <div className="mt-1 text-2xl font-semibold text-gray-900">
                            ${parkingLot.price_per_hour.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details and Actions */}
            <div className="space-y-6">
              {/* Parking Space Info */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">車位資訊</h2>
                <div className="space-y-4">
                  {parkingLot.floor && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">樓層</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.floor}
                      </div>
                    </div>
                  )}
                  {parkingLot.number && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">車位號碼</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.number}
                      </div>
                    </div>
                  )}
                  {parkingLot.restriction && (
                    <div>
                      <div className="text-sm font-medium text-gray-500">使用限制</div>
                      <div className="mt-1 text-base text-gray-900">
                        {parkingLot.restriction}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">使用說明</h2>
                <div className="text-base text-gray-700 whitespace-pre-line">
                  {parkingLot.notes || '無使用說明。'}
                </div>
              </div>

              {/* Availability Toggle - Only show for owner */}
              {user.id === parkingLot.owner_id && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">使用狀態</h2>
                  <Button
                    variant={parkingLot.is_available ? 'danger' : 'primary'}
                    onClick={toggleAvailability}
                    isLoading={loading}
                    className="w-full"
                  >
                    {parkingLot.is_available ? '標記為使用中' : '標記為可供使用'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 