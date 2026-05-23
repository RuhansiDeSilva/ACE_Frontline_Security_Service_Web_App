-- Migration: Allow nullable columns for Chairman/Director registration
ALTER TABLE users MODIFY COLUMN nic_number VARCHAR(255) NULL;
ALTER TABLE users MODIFY COLUMN sex ENUM('MALE', 'FEMALE') NULL;
ALTER TABLE users MODIFY COLUMN residential_address TEXT NULL;
ALTER TABLE users MODIFY COLUMN mobile_number VARCHAR(255) NULL;
ALTER TABLE users MODIFY COLUMN date_of_birth DATE NULL;
ALTER TABLE users MODIFY COLUMN emergency_contact VARCHAR(255) NULL;

-- Migration: Add QR Code activation column for security officers
ALTER TABLE users ADD COLUMN qr_activated BOOLEAN DEFAULT FALSE AFTER active;
