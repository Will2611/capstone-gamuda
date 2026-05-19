# Review API Integration Guide - Click-to-Direction Links

## Overview
BiteScouts Restaurant Finder uses a **minimal token usage** approach for reviews. Instead of displaying full review content, the system stores only URLs and redirects users to external platforms (Google, Instagram, TikTok). This eliminates the need for content summarization and dramatically reduces token consumption.

## Architecture Philosophy

**Key Principle**: Backend stores only URLs, not content.
- No text summarization or generation
- No inline display of review text
- Thumbnails + links only
- Users click to view full content on external platforms

## Backend Endpoints

### 1. Google Reviews
**Endpoint:** `/getGoogleReviews`

**Query Parameters:**
- `restaurantId` (number, required): The unique ID of the restaurant

**Response Format:**
```json
{
  "averageRating": 4.7,
  "totalReviews": 324,
  "reviewUrl": "https://www.google.com/maps/search/?api=1&query=restaurant_name"
}
```

**What to Store:**
- Average rating (number)
- Total review count (number)
- URL to Google reviews page (string)

**What NOT to Store:**
- Individual review text
- Reviewer names
- Review dates
- Review details

### 2. Instagram Posts
**Endpoint:** `/getInstagramPosts`

**Query Parameters:**
- `restaurantId` (number, required): The unique ID of the restaurant

**Response Format:**
```json
{
  "profileUrl": "https://www.instagram.com/restaurant_profile/",
  "posts": [
    {
      "id": 1,
      "thumbnailUrl": "https://cdn.instagram.com/thumbnail1.jpg",
      "postUrl": "https://www.instagram.com/p/abc123/"
    },
    {
      "id": 2,
      "thumbnailUrl": "https://cdn.instagram.com/thumbnail2.jpg",
      "postUrl": "https://www.instagram.com/p/def456/"
    },
    {
      "id": 3,
      "thumbnailUrl": "https://cdn.instagram.com/thumbnail3.jpg",
      "postUrl": "https://www.instagram.com/p/ghi789/"
    }
  ]
}
```

**What to Store:**
- Instagram profile URL (string)
- Thumbnail URLs (for preview display)
- Post URLs (for click-through)
- Post IDs (for tracking)

**What NOT to Store:**
- Captions
- Likes/comments counts
- Post dates
- Hashtags

### 3. TikTok Videos
**Endpoint:** `/getTikTokVideos`

**Query Parameters:**
- `restaurantId` (number, required): The unique ID of the restaurant

**Response Format:**
```json
{
  "profileUrl": "https://www.tiktok.com/@restaurant_profile",
  "videos": [
    {
      "id": 1,
      "thumbnailUrl": "https://cdn.tiktok.com/thumbnail1.jpg",
      "videoUrl": "https://www.tiktok.com/@restaurant/video/1234567890",
      "duration": "0:28"
    },
    {
      "id": 2,
      "thumbnailUrl": "https://cdn.tiktok.com/thumbnail2.jpg",
      "videoUrl": "https://www.tiktok.com/@restaurant/video/9876543210",
      "duration": "0:15"
    }
  ]
}
```

**What to Store:**
- TikTok profile URL (string)
- Thumbnail URLs (for preview display)
- Video URLs (for click-through)
- Video duration (for display badge)
- Video IDs (for tracking)

**What NOT to Store:**
- Video titles
- Descriptions
- View counts
- Like counts
- Comments

## Frontend Integration

### Service Layer
The frontend uses `src/app/services/reviewsApi.ts` to fetch review URLs:

```typescript
import { getGoogleReviews, getInstagramPosts, getTikTokVideos } from './services/reviewsApi';

// Fetch only URLs and basic metadata
const googleData = await getGoogleReviews(restaurantId);
const instagramData = await getInstagramPosts(restaurantId);
const tiktokData = await getTikTokVideos(restaurantId);
```

### Component Structure

**ReviewPanel** (`src/app/components/reviews/ReviewPanel.tsx`)
- Tabbed interface with Google/Instagram/TikTok
- Fetches data on mount via `useEffect`
- Shows loading state while fetching
- Passes data to individual tab components

**GoogleReviews** (`src/app/components/reviews/GoogleReviews.tsx`)
- Displays large star rating
- Shows total review count
- "Read More on Google" button → opens `reviewUrl` in new tab

**InstagramPosts** (`src/app/components/reviews/InstagramPosts.tsx`)
- Grid of 3 thumbnail images
- Clicking thumbnail → opens individual `postUrl` in new tab
- "View on Instagram" button → opens `profileUrl` in new tab

**TikTokVideos** (`src/app/components/reviews/TikTokVideos.tsx`)
- Grid of 2 video thumbnails with play button overlay
- Duration badge on each thumbnail
- Clicking thumbnail → opens individual `videoUrl` in new tab
- "Watch on TikTok" button → opens `profileUrl` in new tab

## User Flow

1. **Select Restaurant**: User clicks a pin on the map
2. **Review Panel Loads**: ReviewPanel appears with loading spinner
3. **Data Fetched**: Backend returns URLs (not content)
4. **Tab Display**: User sees thumbnails and rating (no text)
5. **Click to External**: User clicks button → opens in new tab on external platform
6. **No Modal**: No inline content display, no modals, no token usage for content

## Token Usage Optimization

### Before (Old Approach)
❌ Fetch full review text (100+ tokens per review)  
❌ Display reviews inline  
❌ Modal with all reviews (1000+ tokens)  
**Total: ~3000+ tokens per restaurant**

### After (New Approach)
✅ Fetch only URLs and thumbnails  
✅ Display thumbnails only  
✅ Redirect to external platform  
**Total: ~50 tokens per restaurant**

**Token Savings: 98%+**

## Implementation Details

### External Link Handling
All buttons use `window.open()` with security flags:

```typescript
const handleOpenExternal = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

### Loading States
```typescript
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    // Fetch all three data sources in parallel
    const [google, instagram, tiktok] = await Promise.all([...]);
    setLoading(false);
  };
  fetchData();
}, [restaurantId]);
```

### Error Handling
```typescript
try {
  const data = await getGoogleReviews(restaurantId);
  setGoogleData(data);
} catch (error) {
  console.error('Failed to fetch Google reviews:', error);
  // Show error state or fallback UI
}
```

## Design Specifications

### Icons
- **Google Reviews**: Star icon
- **Instagram**: Camera icon
- **TikTok**: Play button icon

### Buttons
- Primary CTA: Gold background with ExternalLink icon
- Labels: "Read More on Google", "View on Instagram", "Watch on TikTok"
- Hover state: Lighter gold background

### Thumbnails
- **Instagram**: 3 square thumbnails in grid
- **TikTok**: 2 vertical thumbnails (9:16 aspect ratio)
- Hover effect: Show camera/play icon overlay

### Responsive Design
- **Desktop**: Horizontal tabs with labels
- **Mobile**: Icon-only tabs (labels hidden)
- **Grid**: Responsive breakpoints for thumbnails

### Privacy Notice
Bottom of panel:
> "Reviews link to external platforms. No personal data is stored by BiteScouts."

## Backend Implementation Checklist

1. ✅ Store only URLs in database (no review content)
2. ✅ Endpoint returns rating + URL for Google
3. ✅ Endpoint returns thumbnail URLs + post URLs for Instagram
4. ✅ Endpoint returns thumbnail URLs + video URLs for TikTok
5. ✅ Implement caching to reduce API calls to external platforms
6. ✅ Handle expired/broken URLs gracefully
7. ✅ Rate limiting on external API calls

## Caching Strategy

```typescript
// Server-side caching (pseudo-code)
const CACHE_TTL = 86400; // 24 hours

async function getGoogleReviews(restaurantId) {
  const cacheKey = `review_urls:google:${restaurantId}`;
  const cached = await cache.get(cacheKey);
  
  if (cached) return cached;
  
  // Fetch only URLs from Google Places API
  const data = {
    averageRating: await fetchGoogleRating(restaurantId),
    totalReviews: await fetchGoogleReviewCount(restaurantId),
    reviewUrl: generateGoogleReviewUrl(restaurantId)
  };
  
  await cache.set(cacheKey, data, CACHE_TTL);
  return data;
}
```

## Testing

### Mock Data
`reviewsApi.ts` includes mock URLs for development:
- Google review page URLs
- Instagram post URLs
- TikTok video URLs

### Production Readiness
To enable real API calls:

```typescript
export async function getGoogleReviews(restaurantId: number) {
  const response = await fetch(`/getGoogleReviews?restaurantId=${restaurantId}`);
  if (!response.ok) throw new Error('Failed to fetch Google reviews data');
  return await response.json();
}
```

## Analytics Tracking

Track user engagement with external links:

```typescript
const handleOpenExternal = (platform: string, url: string) => {
  // Analytics event
  analytics.track('review_link_clicked', {
    platform,
    restaurantId,
    url
  });
  
  window.open(url, '_blank', 'noopener,noreferrer');
};
```

## Benefits of This Approach

1. **Minimal Token Usage**: 98%+ reduction vs. inline content display
2. **Faster Loading**: No need to fetch/process large text content
3. **Always Fresh**: Users see real-time content on external platforms
4. **Simpler Backend**: Just store URLs, not full content
5. **No Copyright Issues**: No reproduction of copyrighted content
6. **Better UX**: Users see full features on native platforms
7. **Lower Costs**: Reduced API calls and token consumption

## Migration from Old Approach

If migrating from inline content display:

1. Update `reviewsApi.ts` to fetch URLs only
2. Update components to remove text display
3. Replace modals with external links
4. Update database schema to store URLs
5. Clear old review content from database
6. Test all external links work correctly

## Support

For backend integration questions, contact the BiteScouts API team.
