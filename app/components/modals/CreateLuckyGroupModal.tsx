"use client";

import React, { useState } from 'react';
import Modal from '@/app/components/ui/Modal';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Select from '@/app/components/ui/Select';

interface Friend {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreateLuckyGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onCreateGroup: (name: string, selectedFriendIds: string[]) => Promise<void>;
}

export default function CreateLuckyGroupModal({
  isOpen,
  onClose,
  friends,
  onCreateGroup,
}: CreateLuckyGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('請輸入群組名稱');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('請至少選擇一位好友');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateGroup(groupName, selectedFriends);
      onClose();
    } catch (error) {
      setError('建立群組失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="建立幸運群組"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            type="text"
            label="群組名稱"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="輸入群組名稱"
            fullWidth
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            選擇好友
          </label>
          <Select
            multiple
            value={selectedFriends}
            onChange={(value) => setSelectedFriends(Array.isArray(value) ? value : [value])}
            options={friends.map(friend => ({
              value: friend.id,
              label: friend.name,
            }))}
            placeholder="選擇好友..."
            fullWidth
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            建立群組
          </Button>
        </div>
      </form>
    </Modal>
  );
} 