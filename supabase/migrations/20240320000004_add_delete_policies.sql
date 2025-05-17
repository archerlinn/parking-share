-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Policy for deleting friendships
CREATE POLICY "Users can delete their own friendships"
ON friendships
FOR DELETE
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy for deleting group members
CREATE POLICY "Group creators can remove members"
ON group_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM lucky_groups
    WHERE lucky_groups.id = group_members.group_id
    AND lucky_groups.created_by = auth.uid()
  )
);

-- Policy for members to leave groups
CREATE POLICY "Members can leave groups"
ON group_members
FOR DELETE
USING (
  user_id = auth.uid()
); 