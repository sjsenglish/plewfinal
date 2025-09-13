// Utility functions to safely render values in React components

/**
 * Safely converts any value to a string for rendering
 * Prevents React error #31 (objects as children)
 */
export const safeString = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => safeString(item)).join(', ');
    }
    
    // Handle dates
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Handle React elements (don't convert them)
    if (value.$$typeof) {
      return value;
    }
    
    // Handle objects with specific properties
    if (value.message) {
      return String(value.message);
    }
    
    if (value.error) {
      return String(value.error);
    }
    
    if (value.text) {
      return String(value.text);
    }
    
    if (value.name) {
      return String(value.name);
    }
    
    if (value.toString && typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
      return value.toString();
    }
    
    // Last resort - try JSON stringify
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '[Object]';
    }
  }
  
  return String(value);
};

/**
 * Safely access nested properties
 */
export const safeGet = (obj, path, defaultValue = '') => {
  if (!obj || !path) return defaultValue;
  
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn('Error accessing path:', path, error);
    return defaultValue;
  }
};

/**
 * Safe match function for strings
 */
export const safeMatch = (str, pattern) => {
  if (!str || typeof str !== 'string') {
    return null;
  }
  
  try {
    return str.match(pattern);
  } catch (error) {
    console.warn('Error matching pattern:', error);
    return null;
  }
};

/**
 * Safe JSON parse
 */
export const safeJSONParse = (str, defaultValue = null) => {
  if (!str) return defaultValue;
  
  try {
    return JSON.parse(str);
  } catch (error) {
    console.warn('Error parsing JSON:', error);
    return defaultValue;
  }
};

/**
 * Check if value is safe to render as React child
 */
export const isRenderSafe = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return true;
  if (value.$$typeof) return true; // React element
  if (Array.isArray(value)) {
    return value.every(item => isRenderSafe(item));
  }
  return false;
};

/**
 * Ensure value is safe for React rendering
 */
export const ensureRenderSafe = (value) => {
  if (isRenderSafe(value)) {
    return value;
  }
  return safeString(value);
};