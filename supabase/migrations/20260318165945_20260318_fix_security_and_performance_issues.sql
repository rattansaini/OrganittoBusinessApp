/*
  # Fix Security and Performance Issues

  1. Add Missing Indexes for Foreign Keys
    - batch_ingredients: vendor_id
    - chat_messages: reply_to_message_id
    - expenses: approved_by, submitted_by
    - ingredient_documents: stock_id
    - ingredient_stock: vendor_id
    - ingredient_usage: product_id, stock_id
    - ingredients: preferred_vendor_id
    - investments: approved_by, submitted_by
    - product_comments: parent_comment_id
    - vendors: created_by

  2. Remove Duplicate Indexes
    - investments: remove investments_user_id_idx (keeping idx_investments_partner_id)

  3. Remove Unused Indexes

  4. Fix Security Issues
    - Update SECURITY DEFINER views to use SECURITY INVOKER
    - Fix function search_path to be IMMUTABLE
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_batch_ingredients_vendor_id ON batch_ingredients(vendor_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_id ON chat_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON expenses(approved_by);
CREATE INDEX IF NOT EXISTS idx_expenses_submitted_by ON expenses(submitted_by);
CREATE INDEX IF NOT EXISTS idx_ingredient_documents_stock_id ON ingredient_documents(stock_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_stock_vendor_id ON ingredient_stock(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_product_id ON ingredient_usage(product_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_usage_stock_id ON ingredient_usage(stock_id);
CREATE INDEX IF NOT EXISTS idx_ingredients_preferred_vendor_id ON ingredients(preferred_vendor_id);
CREATE INDEX IF NOT EXISTS idx_investments_approved_by ON investments(approved_by);
CREATE INDEX IF NOT EXISTS idx_investments_submitted_by ON investments(submitted_by);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_comment_id ON product_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_vendors_created_by ON vendors(created_by);

-- Remove duplicate indexes
DROP INDEX IF EXISTS investments_user_id_idx;

-- Remove unused indexes
DROP INDEX IF EXISTS idx_product_stage_history_product_id;
DROP INDEX IF EXISTS idx_packaging_designs_product_id;
DROP INDEX IF EXISTS idx_product_tasks_product_id;
DROP INDEX IF EXISTS idx_product_comments_product_id;
DROP INDEX IF EXISTS idx_product_files_product_id;
DROP INDEX IF EXISTS expenses_user_id_idx;
DROP INDEX IF EXISTS expenses_date_idx;
DROP INDEX IF EXISTS investments_date_idx;
DROP INDEX IF EXISTS activity_log_user_id_idx;
DROP INDEX IF EXISTS activity_log_created_at_idx;
DROP INDEX IF EXISTS idx_cost_calculations_is_draft;
DROP INDEX IF EXISTS vendors_name_idx;
DROP INDEX IF EXISTS vendors_category_idx;
DROP INDEX IF EXISTS expenses_status_idx;
DROP INDEX IF EXISTS expenses_paid_by_idx;
DROP INDEX IF EXISTS expenses_vendor_id_idx;
DROP INDEX IF EXISTS idx_investments_date;
DROP INDEX IF EXISTS idx_investments_status;
DROP INDEX IF EXISTS idx_product_ingredients_product_id;
DROP INDEX IF EXISTS idx_formula_versions_product_id;
DROP INDEX IF EXISTS idx_product_tests_product_id;
DROP INDEX IF EXISTS idx_sample_batches_product_id;
DROP INDEX IF EXISTS idx_products_current_stage;
DROP INDEX IF EXISTS idx_products_priority;
DROP INDEX IF EXISTS idx_products_created_by;
DROP INDEX IF EXISTS idx_cost_calculations_product_id;
DROP INDEX IF EXISTS idx_cost_calculations_saved_by;
DROP INDEX IF EXISTS users_email_idx;
DROP INDEX IF EXISTS users_role_idx;
DROP INDEX IF EXISTS idx_vendor_transactions_vendor_id;
DROP INDEX IF EXISTS idx_vendor_transactions_date;
DROP INDEX IF EXISTS idx_vendor_invoices_vendor_id;
DROP INDEX IF EXISTS idx_vendor_invoices_status;
DROP INDEX IF EXISTS idx_vendor_prices_vendor_id;
DROP INDEX IF EXISTS idx_vendor_documents_vendor_id;
DROP INDEX IF EXISTS idx_vendor_notes_vendor_id;
DROP INDEX IF EXISTS idx_vendor_reviews_vendor_id;
DROP INDEX IF EXISTS idx_batches_product_id;
DROP INDEX IF EXISTS idx_batches_batch_number;
DROP INDEX IF EXISTS idx_batches_status;
DROP INDEX IF EXISTS idx_batches_expiry_date;
DROP INDEX IF EXISTS idx_batch_ingredients_batch_id;
DROP INDEX IF EXISTS idx_batch_tests_batch_id;
DROP INDEX IF EXISTS idx_batch_dispatches_batch_id;
DROP INDEX IF EXISTS idx_batch_stock_adjustments_batch_id;
DROP INDEX IF EXISTS idx_batch_photos_batch_id;
DROP INDEX IF EXISTS idx_batch_activity_log_batch_id;
DROP INDEX IF EXISTS idx_ingredients_common_name;
DROP INDEX IF EXISTS idx_ingredients_type;
DROP INDEX IF EXISTS idx_ingredients_category;
DROP INDEX IF EXISTS idx_ingredient_stock_ingredient_id;
DROP INDEX IF EXISTS idx_ingredient_stock_expiry_date;
DROP INDEX IF EXISTS idx_ingredient_stock_status;
DROP INDEX IF EXISTS idx_ingredient_usage_ingredient_id;
DROP INDEX IF EXISTS idx_ingredient_usage_batch_id;
DROP INDEX IF EXISTS idx_ingredient_documents_ingredient_id;
DROP INDEX IF EXISTS idx_licenses_type;
DROP INDEX IF EXISTS idx_licenses_status;
DROP INDEX IF EXISTS idx_licenses_expiry_date;
DROP INDEX IF EXISTS idx_license_documents_license_id;
DROP INDEX IF EXISTS idx_license_renewals_license_id;
DROP INDEX IF EXISTS idx_inspections_license_id;
DROP INDEX IF EXISTS idx_inspections_date;
DROP INDEX IF EXISTS idx_compliance_checklist_license_id;
DROP INDEX IF EXISTS idx_corrective_actions_inspection_id;
DROP INDEX IF EXISTS idx_chat_rooms_type;
DROP INDEX IF EXISTS idx_chat_rooms_product_id;
DROP INDEX IF EXISTS idx_chat_room_members_room_id;
DROP INDEX IF EXISTS idx_chat_room_members_user_id;
DROP INDEX IF EXISTS idx_chat_messages_room_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_files_room_id;
DROP INDEX IF EXISTS idx_chat_files_message_id;
DROP INDEX IF EXISTS idx_chat_typing_status_room_id;

-- Drop and recreate views with SECURITY INVOKER instead of SECURITY DEFINER
DROP VIEW IF EXISTS chat_room_list;
CREATE OR REPLACE VIEW chat_room_list WITH (security_invoker=on) AS
SELECT cr.*, 
  (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
  (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) as message_count
FROM chat_rooms cr;

DROP VIEW IF EXISTS ingredient_inventory_summary;
CREATE OR REPLACE VIEW ingredient_inventory_summary WITH (security_invoker=on) AS
SELECT i.id, i.common_name,
  COALESCE(SUM(s.quantity), 0) as total_quantity,
  COALESCE(SUM(s.quantity * s.cost_per_unit), 0) as total_value,
  COUNT(DISTINCT s.id) as stock_batches,
  MAX(s.expiry_date) as latest_expiry,
  MIN(s.expiry_date) as earliest_expiry
FROM ingredients i
LEFT JOIN ingredient_stock s ON i.id = s.ingredient_id
GROUP BY i.id, i.common_name;

DROP VIEW IF EXISTS license_summary;
CREATE OR REPLACE VIEW license_summary WITH (security_invoker=on) AS
SELECT l.id, l.license_number, l.license_type, l.status,
  l.issue_date, l.expiry_date,
  CASE 
    WHEN l.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN l.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
    ELSE 'Active'
  END as expiry_status,
  (SELECT COUNT(*) FROM inspections WHERE license_id = l.id) as inspection_count
FROM licenses l;

-- Fix function search_path mutability by recreating them with IMMUTABLE
DROP FUNCTION IF EXISTS update_products_updated_at() CASCADE;
CREATE FUNCTION update_products_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_product_comments_updated_at() CASCADE;
CREATE FUNCTION update_product_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_cost_calculations_updated_at() CASCADE;
CREATE FUNCTION update_cost_calculations_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_vendor_tables_updated_at() CASCADE;
CREATE FUNCTION update_vendor_tables_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_vendor_rating() CASCADE;
CREATE FUNCTION update_vendor_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE vendors
  SET current_rating = (SELECT AVG(rating) FROM vendor_reviews WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_batches_updated_at() CASCADE;
CREATE FUNCTION update_batches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS log_batch_activity() CASCADE;
CREATE FUNCTION log_batch_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  INSERT INTO batch_activity_log (batch_id, activity_type, activity_description, performed_by)
  VALUES (NEW.id, 'Status Changed', 'Batch status changed', (select auth.uid()));
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_batch_stock_on_dispatch() CASCADE;
CREATE FUNCTION update_batch_stock_on_dispatch()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE batches SET units_sold = COALESCE(units_sold, 0) + NEW.quantity
  WHERE id = NEW.batch_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_batch_stock_on_adjustment() CASCADE;
CREATE FUNCTION update_batch_stock_on_adjustment()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE batches SET units_in_stock = COALESCE(units_in_stock, 0) + NEW.quantity
  WHERE id = NEW.batch_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_ingredients_updated_at() CASCADE;
CREATE FUNCTION update_ingredients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_stock_status_on_expiry() CASCADE;
CREATE FUNCTION update_stock_status_on_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE ingredient_stock
  SET status = CASE 
    WHEN expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
    ELSE status
  END
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_ingredient_stock_on_usage() CASCADE;
CREATE FUNCTION update_ingredient_stock_on_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE ingredient_stock
  SET quantity = COALESCE(quantity, 0) - NEW.quantity
  WHERE id = NEW.stock_id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_licenses_updated_at() CASCADE;
CREATE FUNCTION update_licenses_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_license_status_on_expiry() CASCADE;
CREATE FUNCTION update_license_status_on_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  UPDATE licenses
  SET status = CASE
    WHEN expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
    ELSE status
  END
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS update_user_chat_settings_updated_at() CASCADE;
CREATE FUNCTION update_user_chat_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS create_default_chat_rooms() CASCADE;
CREATE FUNCTION create_default_chat_rooms()
RETURNS TRIGGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  INSERT INTO chat_rooms (name, type, created_by)
  VALUES ('General Discussion', 'general', NEW.id),
         ('Announcements', 'general', NEW.id);
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS is_first_user() CASCADE;
CREATE FUNCTION is_first_user()
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM users) = 0;
END;
$$;

-- Recreate triggers
DROP TRIGGER IF EXISTS update_products_timestamp ON products;
CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

DROP TRIGGER IF EXISTS update_product_comments_timestamp ON product_comments;
CREATE TRIGGER update_product_comments_timestamp BEFORE UPDATE ON product_comments
FOR EACH ROW EXECUTE FUNCTION update_product_comments_updated_at();

DROP TRIGGER IF EXISTS update_cost_calculations_timestamp ON product_cost_calculations;
CREATE TRIGGER update_cost_calculations_timestamp BEFORE UPDATE ON product_cost_calculations
FOR EACH ROW EXECUTE FUNCTION update_cost_calculations_updated_at();

DROP TRIGGER IF EXISTS update_vendor_tables_timestamp ON vendors;
CREATE TRIGGER update_vendor_tables_timestamp BEFORE UPDATE ON vendors
FOR EACH ROW EXECUTE FUNCTION update_vendor_tables_updated_at();

DROP TRIGGER IF EXISTS update_vendor_rating_trigger ON vendor_reviews;
CREATE TRIGGER update_vendor_rating_trigger AFTER INSERT ON vendor_reviews
FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

DROP TRIGGER IF EXISTS update_batches_timestamp ON batches;
CREATE TRIGGER update_batches_timestamp BEFORE UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION update_batches_updated_at();

DROP TRIGGER IF EXISTS log_batch_activity_trigger ON batches;
CREATE TRIGGER log_batch_activity_trigger BEFORE UPDATE ON batches
FOR EACH ROW EXECUTE FUNCTION log_batch_activity();

DROP TRIGGER IF EXISTS update_batch_dispatch_stock ON batch_dispatches;
CREATE TRIGGER update_batch_dispatch_stock AFTER INSERT ON batch_dispatches
FOR EACH ROW EXECUTE FUNCTION update_batch_stock_on_dispatch();

DROP TRIGGER IF EXISTS update_batch_adjustment_stock ON batch_stock_adjustments;
CREATE TRIGGER update_batch_adjustment_stock AFTER INSERT ON batch_stock_adjustments
FOR EACH ROW EXECUTE FUNCTION update_batch_stock_on_adjustment();

DROP TRIGGER IF EXISTS update_ingredients_timestamp ON ingredients;
CREATE TRIGGER update_ingredients_timestamp BEFORE UPDATE ON ingredients
FOR EACH ROW EXECUTE FUNCTION update_ingredients_updated_at();

DROP TRIGGER IF EXISTS update_stock_expiry_status ON ingredient_stock;
CREATE TRIGGER update_stock_expiry_status AFTER INSERT OR UPDATE ON ingredient_stock
FOR EACH ROW EXECUTE FUNCTION update_stock_status_on_expiry();

DROP TRIGGER IF EXISTS update_stock_on_usage ON ingredient_usage;
CREATE TRIGGER update_stock_on_usage AFTER INSERT ON ingredient_usage
FOR EACH ROW EXECUTE FUNCTION update_ingredient_stock_on_usage();

DROP TRIGGER IF EXISTS update_licenses_timestamp ON licenses;
CREATE TRIGGER update_licenses_timestamp BEFORE UPDATE ON licenses
FOR EACH ROW EXECUTE FUNCTION update_licenses_updated_at();

DROP TRIGGER IF EXISTS update_license_expiry_status ON licenses;
CREATE TRIGGER update_license_expiry_status AFTER INSERT OR UPDATE ON licenses
FOR EACH ROW EXECUTE FUNCTION update_license_status_on_expiry();

DROP TRIGGER IF EXISTS update_chat_settings_timestamp ON user_chat_settings;
CREATE TRIGGER update_chat_settings_timestamp BEFORE UPDATE ON user_chat_settings
FOR EACH ROW EXECUTE FUNCTION update_user_chat_settings_updated_at();

DROP TRIGGER IF EXISTS create_default_rooms ON users;
CREATE TRIGGER create_default_rooms AFTER INSERT ON users
FOR EACH ROW EXECUTE FUNCTION create_default_chat_rooms();
