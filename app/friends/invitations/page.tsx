"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import Button from '@/app/components/ui/Button';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Card from '@/app/components/ui/Card';

interface FriendInvitation {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export default function InvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [invitations, setInvitations] = useState<FriendInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchInvitations();
  }, [user]);

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('friend_invitations')
        .select(`
          id,
          status,
          created_at,
          sender:sender_id (
            id,
            name,
            email
          )
        `)
        .eq('receiver_id', user?.id)
        .eq('status', 'pending');

      if (error) throw error;

      // Transform the data to match FriendInvitation type
      const transformedData = (data || []).map(invitation => ({
        id: invitation.id,
        status: invitation.status,
        created_at: invitation.created_at,
        sender: invitation.sender[0] // Take the first sender since it's a one-to-one relationship
      }));

      setInvitations(transformedData);
    } catch (error: any) {
      console.error('Error fetching invitations:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('friend_invitations')
        .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      // Refresh the invitations list
      fetchInvitations();
    } catch (error: any) {
      console.error(`Error ${action}ing invitation:`, error.message);
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

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Card className="p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">您需要登入才能查看邀請</h2>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">好友邀請</h1>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => router.push('/friends/search')}>
                搜尋好友
              </Button>
              <Button variant="outline" onClick={() => router.push('/lucky-friends')}>
                返回幸運好友
              </Button>
            </div>
          </div>

          <Card className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              </div>
            ) : invitations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                目前沒有待處理的好友邀請
              </div>
            ) : (
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-gray-600">
                          {invitation.sender.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{invitation.sender.name}</h3>
                        <p className="text-sm text-gray-500">{invitation.sender.email}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleInvitation(invitation.id, 'reject')}
                        variant="outline"
                      >
                        拒絕
                      </Button>
                      <Button
                        onClick={() => handleInvitation(invitation.id, 'accept')}
                      >
                        接受
                      </Button>
                    </div>
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