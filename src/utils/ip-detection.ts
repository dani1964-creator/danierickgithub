// Utility function to get user's IP address
import { logger } from '@/lib/logger';

export const getUserIP = async (): Promise<string> => {
  try {
    // In development, create a pseudo-unique identifier based on browser session
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // Generate or retrieve a session-based identifier
      let sessionId = localStorage.getItem('dev_session_id');
      if (!sessionId) {
        sessionId = `dev_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('dev_session_id', sessionId);
      }
      
      // Convert to IP-like format for compatibility
      const hash = sessionId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const ip = `192.168.1.${Math.abs(hash) % 254 + 1}`;
      logger.info('🔧 Development mode - using session-based IP:', ip);
      return ip;
    }

    // Try to get real IP for production
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
          if (data.ip && isValidIP(data.ip)) {
          logger.info('🌐 Real IP detected:', data.ip);
          return data.ip;
        }
      }
    } catch (error) {
      logger.warn('IP detection service failed:', error);
    }
    
    // Ultimate fallback
    const fallbackIP = '127.0.0.1';
  logger.warn('⚠️ Using fallback IP:', fallbackIP);
  return fallbackIP;
    
  } catch (error) {
    logger.error('❌ Error getting user IP:', error);
    return '127.0.0.1';
  }
};

// Simple IP validation
const isValidIP = (ip: string): boolean => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  if (ipv4Regex.test(ip)) {
    return ip.split('.').every(octet => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }
  
  return ipv6Regex.test(ip);
};

// Cache IP for session to avoid multiple API calls
let cachedIP: string | null = null;
let ipCacheTime: number = 0;
const IP_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedUserIP = async (): Promise<string> => {
  const now = Date.now();
  
  if (cachedIP && (now - ipCacheTime) < IP_CACHE_DURATION) {
    return cachedIP;
  }
  
  cachedIP = await getUserIP();
  ipCacheTime = now;
  
  return cachedIP;
};