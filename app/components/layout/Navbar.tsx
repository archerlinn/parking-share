"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import Button from '../ui/Button';

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-rose-600 text-xl font-bold">ParkingShare</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                {profile?.user_type === 'owner' ? (
                  <Link href="/owner/dashboard" className="text-gray-700 hover:text-rose-600 px-3 py-2 text-sm font-medium">
                    My Parking Lots
                  </Link>
                ) : (
                  <Link href="/renter/map" className="text-gray-700 hover:text-rose-600 px-3 py-2 text-sm font-medium">
                    Find Parking
                  </Link>
                )}
                <Link href="/bookings" className="text-gray-700 hover:text-rose-600 px-3 py-2 text-sm font-medium">
                  My Bookings
                </Link>
                <div className="relative ml-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-700 text-sm font-medium">{profile?.name}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                    >
                      Logout
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-rose-600 px-3 py-2 text-sm font-medium">
                  Login
                </Link>
                <Link href="/auth/signup" className="text-gray-700 hover:text-rose-600 px-3 py-2 text-sm font-medium">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-rose-500"
              aria-expanded="false"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu, toggle classes based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          {user ? (
            <>
              {profile?.user_type === 'owner' ? (
                <Link href="/owner/dashboard" className="text-gray-700 hover:bg-gray-50 hover:text-rose-600 block px-3 py-2 text-base font-medium">
                  My Parking Lots
                </Link>
              ) : (
                <Link href="/renter/map" className="text-gray-700 hover:bg-gray-50 hover:text-rose-600 block px-3 py-2 text-base font-medium">
                  Find Parking
                </Link>
              )}
              <Link href="/bookings" className="text-gray-700 hover:bg-gray-50 hover:text-rose-600 block px-3 py-2 text-base font-medium">
                My Bookings
              </Link>
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-3">
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{profile?.name}</div>
                    <div className="text-sm font-medium text-gray-500">{profile?.email}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={signOut}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-rose-600"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-gray-700 hover:bg-gray-50 hover:text-rose-600 block px-3 py-2 text-base font-medium">
                Login
              </Link>
              <Link href="/auth/signup" className="text-gray-700 hover:bg-gray-50 hover:text-rose-600 block px-3 py-2 text-base font-medium">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 