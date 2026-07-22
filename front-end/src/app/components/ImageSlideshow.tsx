import { useState, useEffect } from "react";

interface ImageSlideshowProps {
  images: string[];
  interval?: number; // milliseconds between slides
}

export function ImageSlideshow({ images, interval = 4000 }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {images.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={image}
            alt={`Malaysian food ${index + 1}`}
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {/* Dark overlay to keep text readable */}
      <div className="absolute inset-0 bg-black opacity-40"></div>
    </div>
  );
}