UPDATE user_account 
SET 
  locked_at = NULL, 
  password = :password
WHERE system = :system
  AND username = :username
  