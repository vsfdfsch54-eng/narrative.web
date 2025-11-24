-- Advisory lock functions for matchmaking race condition prevention
-- These locks ensure only one matchmaking processor runs at a time

CREATE OR REPLACE FUNCTION acquire_matching_lock()
RETURNS boolean AS $$
BEGIN
  PERFORM pg_advisory_lock(123456);
  RETURN true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION release_matching_lock()
RETURNS boolean AS $$
BEGIN
  PERFORM pg_advisory_unlock(123456);
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION acquire_matching_lock() TO authenticated;
GRANT EXECUTE ON FUNCTION acquire_matching_lock() TO service_role;
GRANT EXECUTE ON FUNCTION release_matching_lock() TO authenticated;
GRANT EXECUTE ON FUNCTION release_matching_lock() TO service_role;

