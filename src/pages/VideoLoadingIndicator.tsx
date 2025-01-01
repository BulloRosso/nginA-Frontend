import React from 'react';

const VideoLoadingIndicator = () => {
  // Create array of 8 segments for the loading animation
  const segments = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-16 h-16">
        {segments.map((index) => (
          <div
            key={index}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              transform: `rotate(${index * 45}deg) translate(24px)`,
              animation: `videoLoadingFade 1s linear ${index * 0.125}s infinite`
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes videoLoadingFade {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VideoLoadingIndicator;