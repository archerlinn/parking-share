"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import { useAuth } from '@/app/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

interface FriendInvitation {
  id: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();
  const [invitations, setInvitations] = useState<FriendInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchInvitations();
    }
  }, [isAuthLoading]);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      const { data, error } = await supabase
        .from('friendships')
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
        .eq('receiver_id', user.id)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error fetching invitations:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'ACCEPT' | 'REJECT') => {
    if (!user) return;
    
    setProcessingId(invitationId);
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED' })
        .eq('id', invitationId);

      if (error) throw error;

      // Remove the processed invitation from the list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} invitation:`, error);
    } finally {
      setProcessingId(null);
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
            {isLoading ? (
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
                        onClick={() => handleInvitation(invitation.id, 'ACCEPT')}
                        isLoading={processingId === invitation.id}
                        disabled={processingId === invitation.id}
                        variant="primary"
                      >
                        接受
                      </Button>
                      <Button
                        onClick={() => handleInvitation(invitation.id, 'REJECT')}
                        isLoading={processingId === invitation.id}
                        disabled={processingId === invitation.id}
                        variant="outline"
                      >
                        拒絕
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