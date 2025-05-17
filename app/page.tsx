"use client";

import React from 'react';
import Link from 'next/link';
import Layout from './components/layout/Layout';
import Button from './components/ui/Button';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const handleShare = () => {
    if (!user) {
      router.push("/auth/login?next=/owner/parking-lot");
    } else {
      router.push("/owner/dashboard");
    }
  };

  const handleRent = () => {
    if (!user) {
      router.push("/auth/login?next=/renter/map");
    } else {
      router.push("/renter/map");
    }
  };
  
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  分享或尋找附近的停車位
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  LuckyPark 讓擁有閒置車位的人可以出租，幫助需要停車的駕駛人找到方便的停車空間。出租空車位賺錢，或在繁忙地區快速找到車位。
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                    <Button size="lg" onClick={handleShare}>我要出租車位 </Button>
                    <Button variant="outline" size="lg" onClick={handleRent}>我要找車位</Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <img
                  src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"
                  alt="Parking lot"
                  className="rounded-xl shadow-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              如何運作
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              無論你是要出租空位還是找停車位，只需三個簡單步驟，就能輕鬆完成。
            </p>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-x-12 gap-y-16 sm:mt-24 lg:grid-cols-3">
            {/* Step 1 */}
            <div className="flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white text-lg font-bold shadow-sm mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">註冊並上架車位</h3>
              <p className="text-base text-gray-600 leading-7">
                註冊帳號後，填寫車位位置、照片、可用時段與收費方式。你的車位就會出現在地圖上，供駕駛搜尋與預訂。
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white text-lg font-bold shadow-sm mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">收到預訂通知</h3>
              <p className="text-base text-gray-600 leading-7">
                有駕駛想停車時，他們會透過平台發送預訂請求。你將收到通知，並可選擇是否接受。
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-start">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white text-lg font-bold shadow-sm mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">輕鬆賺取收入</h3>
              <p className="text-base text-gray-600 leading-7">
                一旦預訂確認，駕駛將根據時間抵達停車，你也將收到付款。全程無需接觸，安全又安心。
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Featured Parking Spots */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">精選車位</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              探索熱門地區的便利車位。
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {/* Card 1 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://images.unsplash.com/photo-1621929747188-0b4dc28498d2?q=80&w=1932&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Downtown parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">舊金山, 加州</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $15/小時
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      市中心公園車位 #12
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    有遮蔽的停車位，靠近景點與辦公大樓，全天候開放並配有監視器。
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">查看詳情</Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://images.unsplash.com/photo-1712193424561-d1e2c09f524e?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="EV parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">舊金山, 加州</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $20/小時
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      電動車私人充電停車位
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    私人停車位，附電動車充電樁。大樓有警衛全天候駐守，安全性高。
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">查看詳情</Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://images.unsplash.com/photo-1582639510494-c80b5de9f148?q=80&w=2043&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Outdoor parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">舊金山, 加州</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $18/小時
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      明亮戶外停車場
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    位於光線充足的區域，出入便利。適合短期停車需求。
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">查看詳情</Button>
                  </Link>
                </div>
              </div>
            </article>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-rose-600 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              準備好分享或尋找停車位了嗎？
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-rose-100">
              加入數千名使用者，透過出租閒置車位賺錢，或在需要時快速找到車位。
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" variant="secondary" onClick={handleShare}>我要出租車位</Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-rose-500" onClick={handleRent}>我要找車位</Button>
            </div>
          </div>
        </div>
      </div>  
    </Layout>
  );
}
