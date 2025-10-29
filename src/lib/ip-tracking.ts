/**
 * Utility functions for IP tracking and view counting
 */

// Function to get user's IP address
export async function getUserIP(): Promise<string> {
  try {
    // Try multiple IP services for reliability
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];
    
    for (const service of ipServices) {
      try {
        const response = await fetch(service, { 
          method: 'GET',
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Extract IP from different response formats
        const ip = data.ip || data.query || data.origin?.split(' ')[0];
        
        if (ip && isValidIP(ip)) {
          return ip;
        }
      } catch (error) {
        console.warn(`IP service ${service} failed:`, error);
        continue;
      }
    }
    
    // Fallback: try to get IP from headers (works if behind proxy)
    return 'unknown';
    
  } catch (error) {
    console.warn('Failed to get user IP:', error);
    return 'unknown';
  }
}

// Validate IP address format
function isValidIP(ip: string): boolean {
  // Simple IPv4 validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // Simple IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

// Get user agent string
export function getUserAgent(): string {
  return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
}

// Get referrer URL
export function getReferrer(): string {
  return typeof document !== 'undefined' ? document.referrer : 'unknown';
}

// Cache IP for session to avoid multiple API calls
let cachedIP: string | null = null;

export async function getCachedUserIP(): Promise<string> {
  if (cachedIP) {
    return cachedIP;
  }
  
  // Check sessionStorage first
  if (typeof window !== 'undefined') {
    const sessionIP = sessionStorage.getItem('user_ip');
    if (sessionIP && sessionIP !== 'unknown') {
      cachedIP = sessionIP;
      return sessionIP;
    }
  }
  
  // Get fresh IP
  cachedIP = await getUserIP();
  
  // Cache in session
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('user_ip', cachedIP);
  }
  
  return cachedIP;
}

// Clean up old view tracking entries from localStorage
export function cleanupOldViewTracking(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    // Get all localStorage keys
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('property_view_')) {
        // Extract date from key: property_view_{id}_{date}
        const parts = key.split('_');
        if (parts.length >= 4) {
          const dateStr = parts.slice(3).join('_');
          const viewDate = new Date(dateStr);
          
          // If view is older than 7 days, mark for removal
          if (viewDate < sevenDaysAgo) {
            keysToRemove.push(key);
          }
        }
      }
    }
    
    // Remove old entries
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 Cleaned up ${keysToRemove.length} old view tracking entries`);
    }
    
  } catch (error) {
    console.warn('Failed to cleanup old view tracking:', error);
  }
}

// Run cleanup on import (once per session)
if (typeof window !== 'undefined') {
  // Delay cleanup to not block initial page load
  setTimeout(cleanupOldViewTracking, 2000);
}