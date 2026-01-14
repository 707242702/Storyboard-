
import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  currentTime?: number;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, currentTime }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && currentTime !== undefined) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  return (
    <div className="relative group rounded-xl overflow-hidden bg-black aspect-video shadow-2xl border border-slate-700">
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        controls
      />
      <div className="absolute inset-0 pointer-events-none border-4 border-transparent group-hover:border-blue-500/20 transition-colors duration-300"></div>
    </div>
  );
};

export default VideoPlayer;
