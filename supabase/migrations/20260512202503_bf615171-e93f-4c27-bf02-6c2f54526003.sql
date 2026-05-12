DELETE FROM vendor_documents
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY asset_id, file_name ORDER BY created_at ASC) AS rn
    FROM vendor_documents
    WHERE asset_id='8a903bcb-d9a0-443f-b9fe-6c7a2a01ad0d'
  ) t WHERE rn > 1
);