/**
 * Utility functions for handling URLs, particularly S3 URLs and proxy generation
 */

/**
 * Checks if a URL is an S3 URL that needs proxying
 * @param url - The URL to check
 * @returns true if the URL is an S3 URL that needs proxying
 */
export const isS3Url = (url: string): boolean => {
  return url.includes('.s3.') || url.includes('s3.amazonaws.com');
};

/**
 * Generates a proxy URL for S3 URLs to handle CORS issues
 * @param audioUrl - The original audio URL
 * @returns The proxy URL if it's an S3 URL, otherwise returns the original URL
 */
export const getProxyUrl = (audioUrl: string): string => {
  if (isS3Url(audioUrl)) {
    return `/api/proxy?url=${encodeURIComponent(audioUrl)}`;
  }
  return audioUrl;
};
