// 繁體中文化的車位詳情與預約頁面

"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { useParking } from '@/app/providers/ParkingProvider';
import Image from 'next/image';

export default function ParkingLotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { getParkingLotById, requestBooking, loading } = useParking();

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [hours, setHours] = useState(1);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const id = params?.id as string;
  const parkingLot = getParkingLotById(id);

  useEffect(() => {
    // Simulate loading time to ensure data is fetched
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const calculateEndTime = (start: Date, hoursToAdd: number) => {
    const end = new Date(start);
    end.setHours(end.getHours() + hoursToAdd);
    return end;
  };

  const calculatePrice = (hoursToAdd: number) => {
    if (parkingLot) {
      return parkingLot.pricePerHour * hoursToAdd;
    }
    return 0;
  };

  const formatTimeLabel = (time: string) => {
    const [hh, mm] = time.split(':');
    const hour = parseInt(hh);
    const period = hour >= 12 ? '下午' : '上午';
    const displayHour = hour % 12 || 12;
    return `${period} ${displayHour}:${mm}`;
  };

  const timeSlots = useMemo(() => {
    const slots: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hh = h.toString().padStart(2, '0');
        const mm = m.toString().padStart(2, '0');
        const val = `${hh}:${mm}`;
        slots.push({ value: val, label: formatTimeLabel(val) });
      }
    }
    return slots;
  }, []);

  const handleBookingRequest = async () => {
    if (!user) {
      router.push(`/auth/login?next=/renter/parking-lot/${id}`);
      return;
    }

    if (!startDate || !startTime) {
      setError('請選擇預約日期與時間');
      return;
    }

    try {
      const startDT = new Date(`${startDate}T${startTime}`);
      if (startDT < new Date()) {
        setError('開始時間不可早於現在');
        return;
      }
      const endDT = calculateEndTime(startDT, hours);
      const booking = await requestBooking(id, startDT, endDT, user.id);
      if (booking) {
        setRequestSent(true);
        setError('');
      } else {
        setError('預約請求失敗，請稍後再試');
      }
    } catch {
      setError('無效的日期或時間格式');
    }
  };

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (val >= 1) {
      setHours(val);
      setEstimatedPrice(calculatePrice(val));
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                <span className="ml-3 text-gray-600">載入中...</span>
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
              <h2 className="text-lg font-semibold text-gray-900">找不到此車位</h2>
              <p className="mt-2 text-sm text-gray-600">您查看的車位不存在或已被移除。</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/renter/map')}>返回地圖</Button>
              </div>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!parkingLot.is_available) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">此車位目前已被佔用</h2>
              <p className="mt-2 text-sm text-gray-600">請稍後再看看其他可用車位。</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/renter/map')}>返回地圖</Button>
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
          <div className="flex flex-col md:flex-row gap-8">
            {/* 左側：車位詳情 */}
            <div className="md:w-2/3">
              <Card className="overflow-hidden">
                <Image
                  src={parkingLot.photo_url || '/placeholder-parking.jpg'}
                  alt={`車位圖片：${parkingLot.address}`}
                  width={800}
                  height={400}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{parkingLot.address}</h1>
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      {parkingLot.is_available ? '可供使用' : '使用中'}
                    </span>
                  </div>
                  <div className="mt-6">
                    <h2 className="text-lg font-semibold text-gray-900">車位詳情</h2>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">價格</p>
                        <p className="text-lg font-semibold text-gray-900">{`$${parkingLot.pricePerHour}`}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">車主</p>
                        <p className="text-lg text-gray-900">{parkingLot.owner.name}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            {/* 右側：預約表單 */}
            <div className="md:w-1/3">
              <Card className="p-6">
                {requestSent ? (
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900">已送出預約請求！</h2>
                    <p className="mt-2 text-gray-600">車主確認後，您將收到通知</p>
                    <p className="mt-2 text-gray-600">為確保效率，請您直接聯繫車主確認細節</p>
                    <div className="mt-6">
                      <Button onClick={() => router.push('/bookings')} fullWidth>
                        查看我的預約
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-gray-900">發送預約請求</h2>
                    <p className="mt-2 text-gray-600">選擇日期和時間向車主發送預約請求。</p>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">日期</label>
                        <input
                          type="date"
                          id="start-date"
                          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-rose-500"
                          value={startDate}
                          onChange={e => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">開始時間</label>
                        <select
                          id="start-time"
                          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-rose-500"
                          value={startTime}
                          onChange={e => setStartTime(e.target.value)}
                        >
                          <option value="">請選擇時間</option>
                          {timeSlots.map(slot => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">時長（小時）</label>
                        <input
                          type="number"
                          id="duration"
                          min={1}
                          className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 focus:border-rose-500 focus:ring-rose-500"
                          value={hours}
                          onChange={handleHoursChange}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">預估費用</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900">{`$${(parkingLot.pricePerHour * hours).toFixed(2)}`}</p>
                      </div>
                      {error && <p className="text-sm text-red-600">{error}</p>}
                      <Button onClick={handleBookingRequest} isLoading={loading} fullWidth>
                        發送預約請求
                      </Button>
                    </div>
                  </>
                )}
              </Card>
              <Card className="p-6 mt-6">
                <h2 className="text-lg font-semibold text-gray-900">聯絡資訊</h2>
                <p className="mt-2 text-gray-600">
                  <strong>姓名：</strong> {parkingLot.owner.name}<br/>
                  <strong>Email：</strong> {parkingLot.owner.email}<br/>
                </p>
              </Card>
              <div className="mt-6 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => router.push('/renter/map')}>
                  返回地圖
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}