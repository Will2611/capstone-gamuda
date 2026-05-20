import { Camera, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface InstagramPost {
  id: number;
  thumbnailUrl: string;
  postUrl: string;
}

interface InstagramPostsProps {
  posts: InstagramPost[];
  profileUrl: string;
}

export function InstagramPosts({ posts, profileUrl }: InstagramPostsProps) {
  const handleOpenInstagram = () => {
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenPost = (postUrl: string) => {
    window.open(postUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Posts Grid - Preview Thumbnails */}
      <div className="grid grid-cols-3 gap-3">
        {posts.slice(0, 3).map((post) => (
          <button
            key={post.id}
            onClick={() => handleOpenPost(post.postUrl)}
            className="group relative overflow-hidden rounded-lg hover:shadow-lg transition-all aspect-square"
          >
            {/* Thumbnail */}
            <ImageWithFallback
              src={post.thumbnailUrl}
              alt="Instagram post"
              className="w-full h-full object-cover"
            />

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Camera size={24} className="text-bs-neutral-900" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleOpenInstagram}
        className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink size={20} />
        View on Instagram
      </button>

      <p className="text-xs text-center text-bs-neutral-500 italic">
        Click to view posts on Instagram
      </p>
    </div>
  );
}
