import React, { useState, useRef, useEffect } from 'react';
import './VideoStreaming.css';

// Sample video data - replace with your actual video content
const SAMPLE_VIDEOS = {
  hero: {
    id: 'hero-video',
    title: 'Featured Study Series',
    description: 'Master your Korean-English vocabulary with our comprehensive video lessons designed to boost your learning efficiency.',
    videoUrl: 'https://www.youtube.com/embed/PtnI54sUc84?start=2&autoplay=1&mute=1&controls=1&loop=1&playlist=PtnI54sUc84',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg'
  },
  categories: [
    {
      title: '인트로',
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
          videoUrl: 'https://www.youtube.com/embed/PtnI54sUc84?start=2&autoplay=1&mute=1&controls=1',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v3',
          title: 'Speaking Practice Sessions',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v4',
          title: 'Cultural Context Learning',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v5',
          title: 'Pronunciation Guide',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        }
      ]
    },
    {
      title: '파트 2',
      videos: [
        {
          id: 'v6',
          title: 'TOPIK Preparation',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v7',
          title: 'Business Korean',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v8',
          title: 'Daily Conversation',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v9',
          title: 'Writing Skills',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        }
      ]
    },
    {
      title: '파트 3',
      videos: [
        {
          id: 'v10',
          title: 'K-Drama Vocabulary',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v11',
          title: 'Travel Korean',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
        },
        {
          id: 'v12',
          title: 'Food & Dining',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          poster: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Big_Buck_Bunny_thumbnail_vlc.png/1200px-Big_Buck_Bunny_thumbnail_vlc.png'
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
                  <div className="video-info">
                    <h3 className="video-title">{video.title}</h3>
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