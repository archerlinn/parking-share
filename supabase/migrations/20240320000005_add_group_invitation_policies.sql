-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own group memberships and invitations" ON group_members;
DROP POLICY IF EXISTS "Users can view groups they are members of or created" ON lucky_groups;

-- Policy for viewing group members (including invitations)
CREATE POLICY "Users can view their own group memberships and invitations"
ON group_members
FOR SELECT
USING (
  user_id = auth.uid() OR
  sender_id = auth.uid()
);

-- Policy for viewing groups
CREATE POLICY "Users can view groups they are members of or created"
ON lucky_groups
FOR SELECT
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = lucky_groups.id
    AND (group_members.user_id = auth.uid() OR group_members.sender_id = auth.uid())
  )
); 