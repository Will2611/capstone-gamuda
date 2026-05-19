/**
 * Reviews API Service
 *
 * This service handles fetching review URLs from backend endpoints.
 * Backend stores only URLs - no content summarization or text generation.
 * Minimal token usage approach - users are redirected to external platforms.
 *
 * Backend endpoints:
 * - /getGoogleReviews → returns Google review link + rating data
 * - /getInstagramPosts → returns Instagram post URLs
 * - /getTikTokVideos → returns TikTok video URLs
 */

interface GoogleReviewsData {
  averageRating: number;
  totalReviews: number;
  reviewUrl: string; // URL to Google reviews page
}

interface InstagramPostData {
  id: number;
  thumbnailUrl: string;
  postUrl: string; // URL to individual Instagram post
}

interface InstagramData {
  posts: InstagramPostData[];
  profileUrl: string; // URL to Instagram profile
}

interface TikTokVideoData {
  id: number;
  thumbnailUrl: string;
  videoUrl: string; // URL to individual TikTok video
  duration: string;
}

interface TikTokData {
  videos: TikTokVideoData[];
  profileUrl: string; // URL to TikTok profile
}

/**
 * Fetch Google Reviews data for a restaurant
 * Backend endpoint: /getGoogleReviews
 * Returns: rating data + URL to Google reviews (no text content)
 */
export async function getGoogleReviews(
  restaurantId: number
): Promise<GoogleReviewsData> {
  try {
    // In production, uncomment and use actual API call:
    // const response = await fetch(`/getGoogleReviews?restaurantId=${restaurantId}`);
    // if (!response.ok) throw new Error('Failed to fetch Google reviews data');
    // return await response.json();

    // Mock data - backend would return just the URL and basic stats
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      averageRating: 4.7,
      totalReviews: 324,
      reviewUrl: `https://www.google.com/maps/search/?api=1&query=restaurant+${restaurantId}&query_place_id=place_${restaurantId}`,
    };
  } catch (error) {
    console.error('Error fetching Google reviews data:', error);
    throw error;
  }
}

/**
 * Fetch Instagram Posts URLs for a restaurant
 * Backend endpoint: /getInstagramPosts
 * Returns: thumbnail URLs + post URLs (no captions or content)
 */
export async function getInstagramPosts(
  restaurantId: number
): Promise<InstagramData> {
  try {
    // In production, uncomment and use actual API call:
    // const response = await fetch(`/getInstagramPosts?restaurantId=${restaurantId}`);
    // if (!response.ok) throw new Error('Failed to fetch Instagram posts');
    // return await response.json();

    // Mock data - backend would return just URLs
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      profileUrl: 'https://www.instagram.com/restaurant_profile/',
      posts: [
        {
          id: 1,
          thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
          postUrl: 'https://www.instagram.com/p/example1/',
        },
        {
          id: 2,
          thumbnailUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400',
          postUrl: 'https://www.instagram.com/p/example2/',
        },
        {
          id: 3,
          thumbnailUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
          postUrl: 'https://www.instagram.com/p/example3/',
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    throw error;
  }
}

/**
 * Fetch TikTok Videos URLs for a restaurant
 * Backend endpoint: /getTikTokVideos
 * Returns: thumbnail URLs + video URLs (no titles or descriptions)
 */
export async function getTikTokVideos(
  restaurantId: number
): Promise<TikTokData> {
  try {
    // In production, uncomment and use actual API call:
    // const response = await fetch(`/getTikTokVideos?restaurantId=${restaurantId}`);
    // if (!response.ok) throw new Error('Failed to fetch TikTok videos');
    // return await response.json();

    // Mock data - backend would return just URLs
    await new Promise((resolve) => setTimeout(resolve, 300));

    return {
      profileUrl: 'https://www.tiktok.com/@restaurant_profile',
      videos: [
        {
          id: 1,
          thumbnailUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400',
          videoUrl: 'https://www.tiktok.com/@restaurant/video/1234567890',
          duration: '0:28',
        },
        {
          id: 2,
          thumbnailUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400',
          videoUrl: 'https://www.tiktok.com/@restaurant/video/9876543210',
          duration: '0:15',
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching TikTok videos:', error);
    throw error;
  }
}

/**
 * Example usage in a React component:
 *
 * import { getGoogleReviews, getInstagramPosts, getTikTokVideos } from './services/reviewsApi';
 *
 * const fetchReviewLinks = async () => {
 *   try {
 *     const googleData = await getGoogleReviews(restaurantId);
 *     const instagramData = await getInstagramPosts(restaurantId);
 *     const tiktokData = await getTikTokVideos(restaurantId);
 *     // Display thumbnails and links - no content processing needed
 *   } catch (error) {
 *     console.error('Failed to fetch review links:', error);
 *   }
 * };
 */
