-- Add sortswift_reservation_id to order_items for holding SortSwift cards during checkout
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS sortswift_reservation_id TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_sortswift_reservation_id 
ON order_items(sortswift_reservation_id);

NOTIFY pgrst, 'reload schema';
