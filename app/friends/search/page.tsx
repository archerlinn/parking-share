"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Input from '@/app/components/ui/Input';
import { useAuth } from '@/app/providers/AuthProvider';
import Fuse from 'fuse.js';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  friendshipStatus?: 'PENDING' | 'ACCEPTED' | null;
}

export default function FriendSearchPage() {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingInvite, setIsSendingInvite] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchUsers();
    }
  }, [isAuthLoading]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error('User not logged in');
      }
      
      // Fetch all users except the current user
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .neq('id', user.id);

      if (error) throw error;

      // Fetch existing friendships to mark users who are already friends
      const { data: friendships, error: friendshipError } = await supabase
        .from('friendships')
        .select('sender_id, receiver_id, status')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (friendshipError) throw friendshipError;

      // Create a map of user IDs to their friendship status
      const friendshipMap = new Map<string, 'PENDING' | 'ACCEPTED'>();
      friendships?.forEach(f => {
        const otherUserId = f.sender_id === user.id ? f.receiver_id : f.sender_id;
        friendshipMap.set(otherUserId, f.status);
      });

      // Add friendship status to users
      const usersWithStatus = users?.map(u => ({
        ...u,
        friendshipStatus: friendshipMap.get(u.id) || null
      })) || [];

      setAllUsers(usersWithStatus);
      setSearchResults(usersWithStatus.slice(0, 10));
    } catch (error: any) {
      console.error('Error fetching users:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(allUsers.slice(0, 10));
      return;
    }

    // Configure Fuse.js for better Chinese text search
    const fuse = new Fuse(allUsers, {
      keys: [
        { name: 'name', weight: 2 },
        { name: 'email', weight: 1 }
      ],
      threshold: 0.4,
      ignoreLocation: true,
      useExtendedSearch: true,
      minMatchCharLength: 1,
      includeScore: true,
      shouldSort: true,
      findAllMatches: true,
      location: 0,
      distance: 100,
      getFn: (obj: User, path: string | string[]) => {
        const pathStr = Array.isArray(path) ? path[0] : path;
        const value = pathStr.split('.').reduce((o: any, i: string) => o[i], obj);
        return value ? value.toString().toLowerCase() : '';
      }
    });

    const results = fuse.search(searchQuery);
    const validResults = results
      .map(result => result.item)
      .filter(item => item !== null);
    
    setSearchResults(validResults);
  }, [searchQuery, allUsers]);

  const handleSendInvite = async (userId: string) => {
    if (!user) return;
    
    setIsSendingInvite(userId);
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          sender_id: user.id,
          receiver_id: userId,
          status: 'PENDING'
        });

      if (error) throw error;

      // Update the user's friendship status in the local state
      setAllUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, friendshipStatus: 'PENDING' } : u
      ));
      setSearchResults(prev => prev.map(u => 
        u.id === userId ? { ...u, friendshipStatus: 'PENDING' } : u
      ));
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setIsSendingInvite(null);
    }
  };

  const getButtonText = (status: 'PENDING' | 'ACCEPTED' | null) => {
    switch (status) {
      case 'PENDING':
        return '邀請已發送';
      case 'ACCEPTED':
        return '已是好友';
      default:
        return '發送邀請';
    }
  };

  if (isAuthLoading) {
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

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">您需要登入才能搜尋好友</h2>
              <p className="mt-2 text-sm text-gray-600">請登入或註冊帳號以繼續。</p>
              <div className="mt-6">
                <Button onClick={() => router.push('/auth/login')}>
                  登入
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
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">搜尋好友</h1>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.push('/friends/invitations')}>
                查看邀請
              </Button>
              <Button variant="outline" onClick={() => router.push('/lucky-friends')}>
                返回幸運好友
              </Button>
            </div>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <Input
                type="text"
                placeholder="搜尋用戶名稱或電子郵件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery.trim() === ''
                  ? '目前沒有可用的用戶'
                  : '找不到符合的用戶'}
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {result.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{result.name}</h3>
                        <p className="text-sm text-gray-500">{result.email}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSendInvite(result.id)}
                      isLoading={isSendingInvite === result.id}
                      disabled={isSendingInvite === result.id || result.friendshipStatus !== null}
                      variant={result.friendshipStatus ? "outline" : "primary"}
                    >
                      {getButtonText(result.friendshipStatus || null)}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
} 