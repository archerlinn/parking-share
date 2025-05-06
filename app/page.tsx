"use client";

import React from 'react';
import Link from 'next/link';
import Layout from './components/layout/Layout';
import Button from './components/ui/Button';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="relative isolate">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                  Share or Find Parking Spaces Near You
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  ParkingShare connects people with unused parking spaces to those who need a place to park. Earn money by renting out your empty parking spot or find convenient parking in busy areas.
                </p>
                <div className="mt-10 flex items-center gap-x-6">
                  <Link href="/auth/signup?type=owner">
                    <Button size="lg">Share Your Parking Space</Button>
                  </Link>
                  <Link href="/auth/signup?type=renter">
                    <Button variant="outline" size="lg">Find Parking</Button>
                  </Link>
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
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">How It Works</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Simple, secure, and convenient way to share parking spaces.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
                    1
                  </div>
                  Register Your Space
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Sign up, share your parking spot details, and set your availability. It takes less than 5 minutes to get started.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
                    2
                  </div>
                  Get Booking Requests
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Drivers searching for parking will see your spot on our map and can request to book it for their desired time.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-lg font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-600 text-white">
                    3
                  </div>
                  Earn Money
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Confirm bookings, provide access to your parking spot, and get paid. It's that simple!
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Featured Parking Spots */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Featured Parking Spots</h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Discover convenient parking options in popular locations.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            {/* Card 1 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://images.unsplash.com/photo-1590674899484-8abe528c1d36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8M3x8cGFya2luZyUyMGxvdHxlbnwwfHwwfHw%3D&w=1000&q=80"
                  alt="Downtown parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">San Francisco, CA</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $15/hour
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      Downtown Private Spot #12
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    Covered parking spot in downtown area, close to major attractions and office buildings. 24/7 access with security cameras.
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* Card 2 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://media.istockphoto.com/id/1409304338/photo/indoor-car-park.jpg?s=612x612&w=0&k=20&c=mKXYjgz1MWXGzdf3U7LbpKHVKMaRYjRjEU1Ut88UueY="
                  alt="Indoor parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">San Francisco, CA</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $20/hour
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      Indoor Garage with EV Charging
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    Indoor parking spot with electric vehicle charging station. Located in a secured building with 24/7 security guard on duty.
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            </article>

            {/* Card 3 */}
            <article className="flex flex-col items-start shadow-sm rounded-xl border border-gray-200 overflow-hidden">
              <div className="w-full">
                <img
                  src="https://storage.googleapis.com/gweb-cloudblog-publish/images/parking_lot_prediction_hero.max-2000x2000.jpg"
                  alt="Outdoor parking"
                  className="w-full h-48 object-cover"
                />
              </div>
              <div className="max-w-xl p-6">
                <div className="flex items-center gap-x-4 text-xs mb-2">
                  <span className="text-gray-500">San Francisco, CA</span>
                  <span className="relative z-10 rounded-full bg-gray-100 px-3 py-1.5 font-medium text-gray-600">
                    $18/hour
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900">
                    <Link href="/renter/map">
                      <span className="absolute inset-0"></span>
                      Well-lit Outdoor Parking
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
                    Outdoor parking spot in a well-lit area with easy access. Perfect for short-term parking needs in the city center.
                  </p>
                </div>
                <div className="mt-4">
                  <Link href="/renter/map">
                    <Button variant="outline" size="sm">View Details</Button>
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
              Ready to start sharing or finding parking?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-rose-100">
              Join thousands of users who are already making money from their unused parking spaces or finding convenient parking when they need it.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/auth/signup?type=owner">
                <Button size="lg" variant="secondary">Share Your Parking Space</Button>
              </Link>
              <Link href="/auth/signup?type=renter">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-rose-500">Find Parking</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
