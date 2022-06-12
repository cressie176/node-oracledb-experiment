UPDATE user_account 
SET 
  locked_at = :lockedAt
WHERE system = :system
  AND username = :username
