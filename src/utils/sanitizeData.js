// Deep sanitization utility to prevent React error #31
export const deepSanitize = (obj, maxDepth = 5, currentDepth = 0) => {
  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    return String(obj);
  }

  if (obj === null || obj === undefined) {
    return '';
  }

  if (typeof obj === 'string' || typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSanitize(item, maxDepth, currentDepth + 1));
  }

  if (typeof obj === 'object') {
    // For objects that look like they should be strings
    if (obj.sentence) return String(obj.sentence);
    if (obj.text) return String(obj.text);
    if (obj.content) return String(obj.content);
    if (obj.value) return String(obj.value);
    
    // For other objects, recursively sanitize
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = deepSanitize(value, maxDepth, currentDepth + 1);
    }
    return sanitized;
  }

  return String(obj);
};