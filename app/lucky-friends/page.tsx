"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/app/components/layout/Layout';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Modal from '@/app/components/ui/Modal';
import { useAuth } from '@/app/providers/AuthProvider';
import CreateLuckyGroupModal from '@/app/components/modals/CreateLuckyGroupModal';
import { supabase } from '@/lib/supabase';

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface GroupMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

interface LuckyGroup {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  createdBy: string;
  members?: GroupMember[];
}

interface FriendshipWithFriend {
  id: string;
  status: string;
  friend: {
    id: string;
    name: string;
    email: string;
  };
}

interface GroupMemberResponse {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface GroupResponse {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  group_members: GroupMemberResponse[];
}

export default function LuckyFriendsPage() {
  const router = useRouter();
  const { user, loading: isAuthLoading } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<LuckyGroup[]>([]);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<LuckyGroup | null>(null);
  const [isGroupDetailsModalOpen, setIsGroupDetailsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<LuckyGroup | null>(null);
  const [invitingFriendId, setInvitingFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchFriendsAndGroups();
    }
  }, [isAuthLoading]);

  const fetchFriendsAndGroups = async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error('User not logged in');
      }

      // Fetch friends
      console.log('Fetching friends for user:', user.id);
      
      // First, let's check all friendships for this user
      const { data: allFriendships, error: allFriendshipsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      console.log('All friendships:', allFriendships);
      if (allFriendshipsError) {
        console.error('Error fetching all friendships:', allFriendshipsError);
      }

      // Now fetch sent friend requests
      const { data: friendsData, error: friendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend:users!friendships_receiver_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('sender_id', user.id)
        .eq('status', 'ACCEPTED');

      if (friendsError) {
        console.error('Error fetching sent friends:', friendsError);
        throw friendsError;
      }

      console.log('Sent friends data:', friendsData);

      // Fetch received friend requests
      const { data: receivedFriendsData, error: receivedFriendsError } = await supabase
        .from('friendships')
        .select(`
          id,
          status,
          friend:users!friendships_sender_id_fkey (
            id,
            name,
            email
          )
        `)
        .eq('receiver_id', user.id)
        .eq('status', 'ACCEPTED');

      if (receivedFriendsError) {
        console.error('Error fetching received friends:', receivedFriendsError);
        throw receivedFriendsError;
      }

      console.log('Received friends data:', receivedFriendsData);

      // Process sent friends
      const sentFriends = (friendsData as unknown as FriendshipWithFriend[])
        ?.filter(f => f.friend && typeof f.friend === 'object')
        .map(f => ({
          id: f.friend.id,
          name: f.friend.name,
          email: f.friend.email
        })) || [];

      console.log('Processed sent friends:', sentFriends);

      // Process received friends
      const receivedFriends = (receivedFriendsData as unknown as FriendshipWithFriend[])
        ?.filter(f => f.friend && typeof f.friend === 'object')
        .map(f => ({
          id: f.friend.id,
          name: f.friend.name,
          email: f.friend.email
        })) || [];

      console.log('Processed received friends:', receivedFriends);

      const allFriends = [...sentFriends, ...receivedFriends];
      console.log('Combined friends:', allFriends);

      const uniqueFriends = allFriends.filter((friend, index, self) =>
        index === self.findIndex((f) => f.id === friend.id)
      );

      console.log('Final unique friends:', uniqueFriends);

      setFriends(uniqueFriends);

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('lucky_groups')
        .select(`
          id,
          name,
          created_at,
          created_by,
          group_members (
            id,
            status,
            user:user_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('created_by', user.id);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }

      // Fetch groups where user is a member
      const { data: memberGroupsData, error: memberGroupsError } = await supabase
        .from('lucky_groups')
        .select(`
          id,
          name,
          created_at,
          created_by,
          group_members (
            id,
            status,
            user:user_id (
              id,
              name,
              email
            )
          )
        `)
        .eq('group_members.user_id', user.id);

      if (memberGroupsError) {
        console.error('Error fetching member groups:', memberGroupsError);
        throw memberGroupsError;
      }

      // Combine and deduplicate groups
      const allGroups = [...(groupsData || []), ...(memberGroupsData || [])];
      const uniqueGroups = allGroups.filter((group, index, self) =>
        index === self.findIndex((g) => g.id === group.id)
      );

      const formattedGroups = uniqueGroups.map(group => {
        const members = (group.group_members || [])
          .map(member => {
            // Ensure we have valid user data
            if (!member.user) {
              console.warn('Invalid user data for member:', member);
              return null;
            }

            // Handle both array and object user data structures
            const userData = Array.isArray(member.user) ? member.user[0] : member.user;

            if (!userData || !userData.id || !userData.name || !userData.email) {
              console.warn('Invalid user data structure:', userData);
              return null;
            }

            return {
              id: member.id,
              user: {
                id: userData.id,
                name: userData.name,
                email: userData.email
              },
              status: member.status
            } as GroupMember;
          })
          .filter((member): member is GroupMember => member !== null);

        return {
          id: group.id,
          name: group.name,
          memberCount: members.length,
          createdAt: group.created_at,
          createdBy: group.created_by,
          members
        };
      });

      setGroups(formattedGroups);
    } catch (error: any) {
      console.error('Error fetching friends and groups:', error?.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async (name: string, selectedFriendIds: string[]) => {
    if (!user) return;
    
    try {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('lucky_groups')
        .insert({
          name,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add members to the group, including the creator
      const { error: membersError } = await supabase
        .from('group_members')
        .insert([
          // Add creator as a member
          {
            group_id: group.id,
            user_id: user.id,
            sender_id: user.id,
            status: 'ACCEPTED'
          },
          // Add other members
          ...selectedFriendIds.map(friendId => ({
            group_id: group.id,
            user_id: friendId,
            sender_id: user.id,
            status: 'ACCEPTED'
          }))
        ]);

      if (membersError) throw membersError;

      // Refresh the groups list
      fetchFriendsAndGroups();
    } catch (error: any) {
      console.error('Error creating group:', error?.message || 'Unknown error');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    
    setProcessingId(groupId);
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the groups list
      fetchFriendsAndGroups();
    } catch (error: any) {
      console.error('Error leaving group:', error?.message || 'Unknown error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return;
    
    setProcessingId(friendId);
    try {
      // Delete both sent and received friendships
      const { error: sentError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`);

      if (sentError) throw sentError;

      // Refresh the friends list
      fetchFriendsAndGroups();
    } catch (error: any) {
      console.error('Error removing friend:', error?.message || 'Unknown error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveMember = async (groupId: string, memberId: string) => {
    if (!user) return;
    
    setProcessingId(memberId);
    try {
      // First get the member's user_id
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('id', memberId)
        .single();

      if (memberError) throw memberError;

      // Then delete the member
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', memberData.user_id);

      if (deleteError) throw deleteError;

      // Refresh the groups list
      fetchFriendsAndGroups();
    } catch (error: any) {
      console.error('Error removing member:', error?.message || 'Unknown error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewGroupDetails = async (group: LuckyGroup) => {
    setSelectedGroup(group);
    setIsGroupDetailsModalOpen(true);
  };

  const handleInviteMember = async (friendId: string) => {
    if (!user || !selectedGroupForInvite) return;
    
    setInvitingFriendId(friendId);
    try {
      // First check if the user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('id, status')
        .eq('group_id', selectedGroupForInvite.id)
        .eq('user_id', friendId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw checkError;
      }

      if (existingMember) {
        if (existingMember.status === 'PENDING') {
          throw new Error('邀請已發送');
        } else if (existingMember.status === 'ACCEPTED') {
          throw new Error('用戶已在群組中');
        } else if (existingMember.status === 'REJECTED') {
          // If previously rejected, update the status to PENDING
          const { error: updateError } = await supabase
            .from('group_members')
            .update({ status: 'PENDING' })
            .eq('id', existingMember.id);

          if (updateError) throw updateError;
        }
      } else {
        // Create new invitation
        const { error: membersError } = await supabase
          .from('group_members')
          .insert({
            group_id: selectedGroupForInvite.id,
            user_id: friendId,
            sender_id: user.id,
            status: 'PENDING'
          });

        if (membersError) throw membersError;
      }

      // Refresh the groups list
      fetchFriendsAndGroups();
    } catch (error: any) {
      console.error('Error inviting member:', error?.message || 'Unknown error');
      alert(error?.message || '邀請失敗');
    } finally {
      setInvitingFriendId(null);
    }
  };

  const handleOpenInviteModal = (group: LuckyGroup) => {
    if (!group) return;
    setSelectedGroupForInvite(group);
    setIsInviteModalOpen(true);
  };

  const isFriendInGroup = (friendId: string) => {
    if (!selectedGroupForInvite?.members) return false;
    return selectedGroupForInvite.members.some(member => member.user.id === friendId);
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
              <h2 className="text-lg font-semibold text-gray-900">您需要登入才能查看幸運好友</h2>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">幸運好友</h1>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push('/friends/invitations')}>
                查看邀請
              </Button>
              <Button onClick={() => router.push('/friends/search')}>
                新增好友
              </Button>
              <Button onClick={() => setIsCreateGroupModalOpen(true)}>
                建立幸運群組
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* My Friends Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">我的好友</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  您還沒有好友。點擊「新增好友」開始建立您的幸運好友圈！
                </div>
              ) : (
                <div className="space-y-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {friend.avatar ? (
                            <img
                              src={friend.avatar}
                              alt={friend.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium text-gray-600">
                              {friend.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{friend.name}</h3>
                          <p className="text-sm text-gray-500">{friend.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleRemoveFriend(friend.id)}
                        isLoading={processingId === friend.id}
                        disabled={processingId === friend.id}
                      >
                        移除好友
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* My Groups Section */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">我的群組</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  您還沒有加入任何群組。點擊「建立幸運群組」開始建立您的第一個群組！
                </div>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{group.name}</h3>
                        <p className="text-sm text-gray-500">
                          {group.memberCount} 位成員 · 建立於 {new Date(group.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewGroupDetails(group)}
                        >
                          查看成員
                        </Button>
                        {group.createdBy !== user.id && (
                          <Button
                            variant="outline"
                            onClick={() => handleLeaveGroup(group.id)}
                            isLoading={processingId === group.id}
                            disabled={processingId === group.id}
                          >
                            退出群組
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <CreateLuckyGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        friends={friends}
        onCreateGroup={handleCreateGroup}
      />

      {/* Group Details Modal */}
      <Modal
        isOpen={isGroupDetailsModalOpen}
        onClose={() => {
          setIsGroupDetailsModalOpen(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup?.name || '群組成員'}
      >
        <div className="space-y-4">
          {selectedGroup?.createdBy === user.id && (
            <div className="mb-4">
              <Button
                onClick={() => selectedGroup && handleOpenInviteModal(selectedGroup)}
                className="w-full"
              >
                邀請新成員
              </Button>
            </div>
          )}
          {selectedGroup?.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-lg font-medium text-gray-600">
                    {member.user?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{member.user?.name || 'Unknown User'}</h3>
                  <p className="text-sm text-gray-500">{member.user?.email || 'No email'}</p>
                </div>
              </div>
              {selectedGroup.createdBy === user.id && member.user?.id !== user.id && (
                <Button
                  variant="outline"
                  onClick={() => handleRemoveMember(selectedGroup.id, member.id)}
                  isLoading={processingId === member.id}
                  disabled={processingId === member.id}
                >
                  移除成員
                </Button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Invite Members Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setSelectedGroupForInvite(null);
        }}
        title="邀請新成員"
      >
        <div className="space-y-4">
          {friends.map((friend) => {
            const isInGroup = isFriendInGroup(friend.id);
            return (
              <div
                key={friend.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {friend.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{friend.name}</h3>
                    <p className="text-sm text-gray-500">{friend.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => handleInviteMember(friend.id)}
                  disabled={isInGroup || invitingFriendId === friend.id}
                  isLoading={invitingFriendId === friend.id}
                >
                  {isInGroup ? '已在群組中' : '邀請'}
                </Button>
              </div>
            );
          })}
        </div>
      </Modal>
    </Layout>
  );
} 