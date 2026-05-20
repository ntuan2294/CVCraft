-- Fix admin password to: Admin@123
UPDATE users
SET password = '$2a$10$Mq/5dEWFQU9uDswmjNmDiupaxWHjBpSpaO/K7xA7uEvVnSK1UmqzS'
WHERE email = 'admin@cvcraft.com';
