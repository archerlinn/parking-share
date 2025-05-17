"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import Button from '../ui/Button';
import { useRouter } from "next/navigation";

const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="text-rose-600 text-xl font-bold">
            停停圈 LuckyPark
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/owner/dashboard" className="text-gray-700 hover:text-rose-600 text-sm font-medium px-3 py-2">
                  我的車位
                </Link>
                <Link href="/renter/map" className="text-gray-700 hover:text-rose-600 text-sm font-medium px-3 py-2">
                  尋找車位
                </Link>
                <Link href="/bookings" className="text-gray-700 hover:text-rose-600 text-sm font-medium px-3 py-2">
                  我的預訂
                </Link>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 text-sm">{profile?.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      router.push("/auth/login");
                    }}
                  >
                    登出
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-gray-700 hover:text-rose-600 text-sm font-medium px-3 py-2">
                  登入
                </Link>
                <Link href="/auth/signup" className="text-gray-700 hover:text-rose-600 text-sm font-medium px-3 py-2">
                  註冊
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-4 space-y-1 border-t border-gray-200">
          {user ? (
            <>
              <Link href="/owner/dashboard" className="block text-gray-700 hover:text-rose-600 text-base py-2">
                我的車位
              </Link>
              <Link href="/renter/map" className="block text-gray-700 hover:text-rose-600 text-base py-2">
                尋找車位
              </Link>
              <Link href="/bookings" className="block text-gray-700 hover:text-rose-600 text-base py-2">
                我的預訂
              </Link>
              <div className="border-t border-gray-100 pt-2">
                <p className="text-gray-600 text-sm mb-1">{profile?.name}</p>
                <button
                  onClick={signOut}
                  className="w-full text-left text-gray-700 hover:text-rose-600 py-2"
                >
                  登出
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="block text-gray-700 hover:text-rose-600 text-base py-2">
                登入
              </Link>
              <Link href="/auth/signup" className="block text-gray-700 hover:text-rose-600 text-base py-2">
                註冊
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
