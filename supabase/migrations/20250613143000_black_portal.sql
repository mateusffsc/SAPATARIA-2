/*
  # Fix Product Stock Reduction on Sales

  1. Problem
    - Product sales are not reducing inventory stock as expected
    - The trigger function may not be working correctly

  2. Solution
    - Check and fix the update_product_stock_on_sale function
    - Ensure the trigger is properly attached to product_sale_items
    - Add logging for better debugging
*/

-- First, check if the trigger exists and recreate it if needed
DROP TRIGGER IF EXISTS update_stock_on_sale ON product_sale_items;

-- Recreate the function with improved error handling and logging
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  product_name TEXT;
BEGIN
  -- Get current stock level and product name for logging
  SELECT stock, name INTO current_stock, product_name
  FROM products
  WHERE id = NEW.product_id;
  
  -- Log the operation for debugging
  RAISE NOTICE 'Updating stock for product % (ID: %): Current stock: %, Quantity sold: %', 
    product_name, NEW.product_id, current_stock, NEW.quantity;
  
  -- Decrease product stock
  UPDATE products
  SET 
    stock = GREATEST(0, stock - NEW.quantity),
    updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Get the new stock level for logging
  SELECT stock INTO current_stock
  FROM products
  WHERE id = NEW.product_id;
  
  RAISE NOTICE 'New stock level for product % (ID: %): %', 
    product_name, NEW.product_id, current_stock;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock update
CREATE TRIGGER update_stock_on_sale
AFTER INSERT ON product_sale_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_sale();

-- Verify the trigger is properly attached
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_stock_on_sale' 
    AND tgrelid = 'product_sale_items'::regclass
  ) THEN
    RAISE EXCEPTION 'Trigger was not created properly';
  END IF;
END $$;

-- Add a function to manually update stock for existing sales
CREATE OR REPLACE FUNCTION update_stock_for_existing_sales()
RETURNS void AS $$
DECLARE
  sale_item RECORD;
BEGIN
  FOR sale_item IN 
    SELECT psi.product_id, psi.quantity, p.name, p.stock
    FROM product_sale_items psi
    JOIN products p ON psi.product_id = p.id
  LOOP
    RAISE NOTICE 'Processing product % (ID: %): Current stock: %, Quantity to deduct: %', 
      sale_item.name, sale_item.product_id, sale_item.stock, sale_item.quantity;
    
    UPDATE products
    SET 
      stock = GREATEST(0, stock - sale_item.quantity),
      updated_at = NOW()
    WHERE id = sale_item.product_id;
    
    RAISE NOTICE 'Updated stock for product % (ID: %)', 
      sale_item.name, sale_item.product_id;
  END LOOP;
  
  RAISE NOTICE 'Stock update for existing sales completed';
END;
$$ LANGUAGE plpgsql;

-- Run the function to update stock for existing sales
-- Uncomment this line if you want to update stock for existing sales
-- SELECT update_stock_for_existing_sales();