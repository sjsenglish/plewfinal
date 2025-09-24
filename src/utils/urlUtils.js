/**
 * Utility functions for URL handling and Firebase Storage URL conversion
 */

/**
 * Converts Firebase Storage gs:// URLs to public HTTPS URLs
 * @param {string} url - The URL to convert (can be gs:// or already a public URL)
 * @returns {string} - The converted public URL or the original URL if not a gs:// URL
 */
export const convertFirebaseStorageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    console.warn('convertFirebaseStorageUrl: Invalid URL provided:', url);
    return '';
  }
  
  console.log('convertFirebaseStorageUrl: Processing URL:', url);
  
  // Handle filename-only values by constructing full gs:// URL
  if (url && !url.startsWith('gs://') && !url.startsWith('http')) {
    console.warn('convertFirebaseStorageUrl: Received filename-only value:', url);
    console.log('convertFirebaseStorageUrl: Constructing full gs:// URL from filename');
    
    // Construct full gs:// URL assuming default bucket and path structure
    // This assumes images are stored in a standard path structure
    url = `gs://plewcsat1.firebasestorage.app/${url}`;
    console.log('convertFirebaseStorageUrl: Constructed gs:// URL:', url);
  }
  
  // If it's already a public Firebase Storage URL, return as-is
  if (url.startsWith('https://firebasestorage.googleapis.com/')) {
    console.log('convertFirebaseStorageUrl: URL is already public, returning as-is');
    return url;
  }
  
  // If it's a Firebase Storage gs:// URL, convert it
  if (url.startsWith('gs://')) {
    const gsMatch = url.match(/^gs:\/\/([^/]+)\/(.+)$/);
    if (gsMatch) {
      const bucket = gsMatch[1];
      const path = gsMatch[2];
      const convertedUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
      console.log('convertFirebaseStorageUrl: Converted gs:// URL to:', convertedUrl);
      return convertedUrl;
    } else {
      console.error('convertFirebaseStorageUrl: Invalid gs:// URL format:', url);
      return url;
    }
  }
  
  // For any other URL (http, https, etc.), return as-is
  console.log('convertFirebaseStorageUrl: Returning URL as-is (not Firebase Storage):', url);
  return url;
};

/**
 * Legacy method using manual string replacement (for compatibility)
 * This method is kept for reference but convertFirebaseStorageUrl is preferred
 * @param {string} imageFile - The gs:// URL to convert
 * @returns {string} - The converted public URL
 */
export const convertFirebaseStorageUrlLegacy = (imageFile) => {
  if (!imageFile || typeof imageFile !== 'string') {
    return '';
  }
  
  if (imageFile.startsWith('gs://plewcsat1.firebasestorage.app/')) {
    const publicUrl = imageFile.replace(
      'gs://plewcsat1.firebasestorage.app/',
      'https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/'
    ).replace(/\//g, '%2F') + '?alt=media';
    
    console.log('convertFirebaseStorageUrlLegacy: Converted:', imageFile, 'to:', publicUrl);
    return publicUrl;
  }
  
  return imageFile;
};

/**
 * Get image URL from question object, handling various field names
 * @param {Object} question - The question object
 * @returns {string} - The image URL
 */
export const getQuestionImageUrl = (question) => {
  if (!question) return '';
  
  const imageUrl = question?.image_url || 
                  question?.imageFile || 
                  question?.image_file || 
                  question?.imageUrl ||
                  question?.image;
  
  return imageUrl ? convertFirebaseStorageUrl(imageUrl) : '';
};

/**
 * Batch convert multiple URLs
 * @param {string[]} urls - Array of URLs to convert
 * @returns {string[]} - Array of converted URLs
 */
export const convertMultipleFirebaseStorageUrls = (urls) => {
  if (!Array.isArray(urls)) {
    console.warn('convertMultipleFirebaseStorageUrls: Expected array, got:', typeof urls);
    return [];
  }
  
  return urls.map(url => convertFirebaseStorageUrl(url));
};