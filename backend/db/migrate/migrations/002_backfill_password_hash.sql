UPDATE users
SET password_hash = password
WHERE password_hash = ''
  AND password <> '';
