-- Step 1: Set default if not already set
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Step 2: Fix existing data
UPDATE "user" SET role = 'USER' WHERE role IS NULL;

-- Step 3: Set NOT NULL constraint
ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL;

-- Step 4: New Column added and Set NOT NULL constraint with default value
ALTER TABLE "subscriptions" ADD COLUMN "price" integer DEFAULT 0 NOT NULL;