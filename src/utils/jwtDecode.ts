// src/utils/jwtDecode.ts

/**
 * Decodes a JWT token without requiring external libraries
 * 
 * @param token JWT token to decode
 * @returns Decoded token payload
 */
export function decodeJwt(token: string): any {
  try {
    console.log('Decoding token:', token.substring(0, 15) + '...');

    // JWT has three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format, parts:', parts.length);
      throw new Error('Invalid JWT format');
    }

    // The payload is the second part, base64 encoded
    const base64Payload = parts[1];

    // Replace characters for base64url format and add padding
    const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const jsonPayload = atob(base64 + padding);

    // Parse the JSON
    const payload = JSON.parse(jsonPayload);
    console.log('Decoded JWT payload:', payload);

    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Extracts the user role from a JWT token
 * 
 * @param token JWT token
 * @returns User role or null if not found
 */
export function getUserRoleFromToken(token: string): string | null {
  try {
    const decoded = decodeJwt(token);
    // Check for user_role in custom claims
    const userRole = decoded?.user_role || null;

    console.log('Extracted user_role from token:', userRole);

    // For testing purposes when role is not in token:
    // Uncomment one of these for testing UI without proper JWT
    // return "developer";
    // return "customer";

    return userRole;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}