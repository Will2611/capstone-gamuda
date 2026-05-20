import { Play, ExternalLink } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface TikTokVideo {
  id: number;
  thumbnailUrl: string;
  videoUrl: string;
  duration: string;
}

interface TikTokVideosProps {
  videos: TikTokVideo[];
  profileUrl: string;
}

export function TikTokVideos({ videos, profileUrl }: TikTokVideosProps) {
  const handleOpenTikTok = () => {
    window.open(profileUrl, "_blank", "noopener,noreferrer");
  };

  const handleOpenVideo = (videoUrl: string) => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      {/* Videos Grid - Preview Thumbnails */}
      <div className="grid grid-cols-2 gap-4">
        {videos.slice(0, 2).map((video) => (
          <button
            key={video.id}
            onClick={() => handleOpenVideo(video.videoUrl)}
            className="group relative overflow-hidden rounded-lg hover:shadow-lg transition-all"
          >
            {/* Thumbnail */}
            <div className="aspect-[9/16] bg-bs-neutral-900 overflow-hidden relative">
              <ImageWithFallback
                src={video.thumbnailUrl}
                alt="TikTok video"
                className="w-full h-full object-cover"
              />

              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                <div className="w-16 h-16 bg-bs-red rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={32} className="text-white ml-1" fill="white" />
                </div>
              </div>

              {/* Duration Badge */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={handleOpenTikTok}
        className="w-full py-3 bg-bs-gold text-bs-neutral-900 rounded-lg hover:bg-[#FFE44D] transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink size={20} />
        Watch on TikTok
      </button>

      <p className="text-xs text-center text-bs-neutral-500 italic">
        Click to watch videos on TikTok
      </p>
    </div>
  );
}
