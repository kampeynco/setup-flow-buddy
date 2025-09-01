-- Remove the campaign_mappings table since it's no longer needed
-- The ActBlue webhook now directly matches committee names from the payload
-- to the committee_name field in the profiles table

DROP TABLE IF EXISTS campaign_mappings;