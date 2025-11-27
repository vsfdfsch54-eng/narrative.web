/**
 * CORS headers helper
 * Use this in all API routes to prevent CORS errors
 */
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

