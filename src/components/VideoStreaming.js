import React, { useState, useRef, useEffect } from 'react';
import './VideoStreaming.css';

// Sample video data - replace with your actual video content
const SAMPLE_VIDEOS = {
  hero: {
    id: 'hero-video',
    title: '',
    description: '.',
    videoUrl: 'https://www.youtube.com/embed/PtnI54sUc84?start=2&autoplay=1&mute=1&controls=1&loop=1&playlist=PtnI54sUc84',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg'
  },
  categories: [
    {
      title: 'PLEW',
      videos: [
        {
          id: 'v1',
          title: 'Korean Grammar Fundamentals',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+1Final.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson1Thumbnail.jpg'
        },
        {
          id: 'v2',
          title: 'Advanced Vocabulary Building',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+2.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/02.jpg'
        },
        {
          id: 'v3',
          title: 'Speaking Practice Sessions',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson3final.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/03.jpg'
        },
        {
          id: 'v4',
          title: 'Cultural Context Learning',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+4.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/04.jpg'
        },
        {
          id: 'v5',
          title: 'Pronunciation Guide',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+5.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/05.jpg'
        }
      ]
    },
    {
      title: 'PLEW',
      videos: [
        {
          id: 'v6',
          title: 'TOPIK Preparation',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+6_SS.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/06.jpg'
        },
        {
          id: 'v8',
          title: 'Daily Conversation',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+8_SS.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/08.jpg'
        }
      ]
    }
  ]
};

const VideoStreaming = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const heroVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const carouselRefs = useRef({});

  useEffect(() => {
    // YouTube iframe auto-plays with autoplay=1 parameter
    // No need to manually call play() on iframe elements

    // Add keyboard event listeners
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
      if (e.key === 'ArrowLeft') {
        // Handle left arrow for carousel navigation
      }
      if (e.key === 'ArrowRight') {
        // Handle right arrow for carousel navigation
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  const playVideo = (video) => {
    setCurrentVideo(video);
    setIsFullscreen(true);
    setIsPlaying(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setCurrentVideo(null);
    setIsPlaying(false);
    // YouTube iframes don't have pause() method - they're controlled via URL parameters
  };

  const scrollCarousel = (categoryIndex, direction) => {
    const carousel = carouselRefs.current[categoryIndex];
    if (carousel) {
      const scrollAmount = 320; // Width of one card plus gap
      carousel.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="video-streaming">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-video-container">
          <iframe
            ref={heroVideoRef}
            className="hero-video"
            src={SAMPLE_VIDEOS.hero.videoUrl}
            title={SAMPLE_VIDEOS.hero.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">{SAMPLE_VIDEOS.hero.title}</h1>
            <p className="hero-description">{SAMPLE_VIDEOS.hero.description}</p>
            <button 
              className="hero-play-btn"
              onClick={() => playVideo(SAMPLE_VIDEOS.hero)}
            >
              <span className="play-icon">▶</span>
              Play
            </button>
          </div>
        </div>
      </section>

      {/* Video Carousels */}
      <section className="video-carousels">
        {SAMPLE_VIDEOS.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="video-category">
            <div className="category-header">
              <h2 className="category-title">{category.title}</h2>
              <div className="carousel-controls">
                <button 
                  className="carousel-arrow left"
                  onClick={() => scrollCarousel(categoryIndex, 'left')}
                >
                  ‹
                </button>
                <button 
                  className="carousel-arrow right"
                  onClick={() => scrollCarousel(categoryIndex, 'right')}
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              className="video-carousel"
              ref={el => carouselRefs.current[categoryIndex] = el}
            >
              {category.videos.map((video) => (
                <div 
                  key={video.id} 
                  className="video-card"
                  onClick={() => playVideo(video)}
                >
                  <div className="video-thumbnail">
                    <img src={video.poster} alt={video.title} />
                    <div className="video-overlay">
                      <div className="play-button">
                        <span className="play-icon">▶</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Fullscreen Video Player */}
      {isFullscreen && currentVideo && (
        <div className="fullscreen-overlay">
          <div className="fullscreen-player">
            <button className="close-button" onClick={closeFullscreen}>
              ×
            </button>
            <iframe
              ref={fullscreenVideoRef}
              className="fullscreen-video"
              src={currentVideo.videoUrl}
              title={currentVideo.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStreaming;