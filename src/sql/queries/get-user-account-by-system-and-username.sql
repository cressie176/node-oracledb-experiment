SELECT 
  system "system", 
  username "username", 
  password "password", 
  locked_at "lockedAt"
FROM user_account
WHERE system = :system
  AND username = :username
