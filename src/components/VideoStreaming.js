import React, { useState, useRef, useEffect } from 'react';
import { usePaywall } from '../hooks/usePaywall';
import './VideoStreaming.css';

// Sample video data - replace with your actual video content
const SAMPLE_VIDEOS = {
  hero: {
    id: 'hero-video',
    title: 'PLEW 강의 소개',
    description: '옥스포드 테크닉으로 배우는 영어 독해',
    videoUrl: 'https://www.youtube.com/embed/PtnI54sUc84?start=2&autoplay=1&controls=1',
    backgroundUrl: 'https://www.youtube.com/embed/PtnI54sUc84?start=2&autoplay=1&mute=1&controls=0&loop=1&playlist=PtnI54sUc84',
    poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg'
  },
  categories: [
    {
      title: 'PLEW 강의 시리즈',
      videos: [
        {
          id: 'v1',
          title: 'Lesson 1',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson1_Cut2.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson1Thumbnail.jpg'
        },
        {
          id: 'v2',
          title: 'Lesson 2',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+2.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/02.jpg'
        },
        {
          id: 'v3',
          title: 'Lesson 3',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson3final.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/03.jpg'
        },
        {
          id: 'v4',
          title: 'Lesson 4',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+4.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/04.jpg'
        },
        {
          id: 'v5',
          title: 'Lesson 5',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+5.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/05.jpg'
        },
        {
          id: 'v6',
          title: 'Lesson 6',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+6_SS.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/06.jpg'
        },
        {
          id: 'v8',
          title: 'Lesson 8',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson8_Cut2.mp4',
          poster: 'https://plewvideos.s3.eu-north-1.amazonaws.com/08.jpg'
        }
      ]
    }
  ]
};

const VideoStreaming = () => {
  const { checkUsage, isPaidUser, isGuest } = usePaywall();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const heroVideoRef = useRef(null);
  const fullscreenVideoRef = useRef(null);
  const carouselRefs = useRef({});

  useEffect(() => {
    // Add keyboard event listeners
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isFullscreen]);

  const playVideo = async (video) => {
    const usageCheck = await checkUsage('video_playback');
    
    if (!usageCheck.allowed) {
      // Do nothing - make videos unplayable
      return;
    }
    
    setCurrentVideo(video);
    setIsFullscreen(true);
    setIsPlaying(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    setCurrentVideo(null);
    setIsPlaying(false);
  };

  const scrollCarousel = (categoryIndex, direction) => {
    const carousel = carouselRefs.current[categoryIndex];
    if (carousel) {
      const scrollAmount = 340; // Width of one card plus gap
      carousel.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="video-streaming">
      {/* Hero Section with Enhanced Message */}
      <section className="hero-section">
        <div className="hero-video-container">
          <iframe
            ref={heroVideoRef}
            className="hero-video"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '100vw',
              height: '100vh',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              border: 'none',
              minWidth: '100%',
              minHeight: '100%'
            }}
            src={SAMPLE_VIDEOS.hero.backgroundUrl || SAMPLE_VIDEOS.hero.videoUrl}
            title={SAMPLE_VIDEOS.hero.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <div className="hero-overlay"></div>
        </div>
        
        {/* Enhanced Message Card */}
        <div className="hero-content">
          <h1 className="hero-title">
            옥스포드 테크닉
            <br/>
            <span className="brand-highlight">PLEW</span>
          </h1>
          
          <h2 className="hero-subtitle">
            쉽고 심플하게 해설해 주는 강의 시리즈
          </h2>
          
          <p className="hero-description">
            시리즈를 완성한 후에는 문제 은행에서 다양한 오리지널 문제들을 연습해 보세요.
            방법을 알면 독해가 어렵지 않아요. PLEW의 체계적인 학습 방법으로 
            영어 독해 실력을 확실하게 향상시킬 수 있습니다.
          </p>
          
          <div className="hero-features">
            <div className="feature-badge">
              <div className="feature-icon"></div>
              7개 레슨
            </div>
            <div className="feature-badge">
              <div className="feature-icon"></div>
              HD 화질
            </div>
            <div className="feature-badge">
              <div className="feature-icon"></div>
              한국어 설명
            </div>
            <div className="feature-badge">
              <div className="feature-icon"></div>
              전문 강의
            </div>
          </div>

          <div className="hero-cta">
            <button 
              className={`cta-primary ${!isPaidUser ? 'disabled' : ''}`}
              onClick={() => playVideo(SAMPLE_VIDEOS.hero)}
            >
              <span>{!isPaidUser ? '🔒' : '▶'}</span>
              {!isPaidUser 
                ? (isGuest ? '로그인 후 시청' : '구독 후 시청') 
                : '강의 시작하기'
              }
            </button>
          </div>
        </div>
      </section>

      {/* Video Grid Section */}
      <section className="video-carousels">
        {SAMPLE_VIDEOS.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="video-category">
            <div className="category-header">
              <h2 className="category-title">
                {category.title}
              </h2>
              <div className="carousel-controls">
                <button 
                  onClick={() => scrollCarousel(categoryIndex, 'left')}
                  className="carousel-arrow"
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollCarousel(categoryIndex, 'right')}
                  className="carousel-arrow"
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              ref={el => carouselRefs.current[categoryIndex] = el}
              className="video-carousel"
            >
              {category.videos.map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => playVideo(video)}
                  className={`video-card ${!isPaidUser ? 'video-locked' : ''}`}
                >
                  <div className="video-thumbnail">
                    <img 
                      src={video.poster} 
                      alt={video.title}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="video-overlay">
                      <div className="play-button">
                        <span className="play-icon">{!isPaidUser ? '🔒' : '▶'}</span>
                      </div>
                      {!isPaidUser && (
                        <div className="subscription-notice">
                          <span>{isGuest ? 'Sign up to watch' : 'Subscription required'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="video-info">
                    <h3 className="video-title">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Fullscreen Video Player */}
      {isFullscreen && currentVideo && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            position: 'relative',
            width: '90vw',
            maxWidth: '1200px',
            height: '80vh'
          }}>
            <button 
              onClick={closeFullscreen}
              style={{
                position: 'absolute',
                top: '-50px',
                right: '0',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '28px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              ×
            </button>
            {currentVideo.videoUrl.includes('youtube.com') ? (
              <iframe
                ref={fullscreenVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  borderRadius: '12px'
                }}
                src={currentVideo.videoUrl}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video
                ref={fullscreenVideoRef}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  objectFit: 'contain'
                }}
                src={currentVideo.videoUrl}
                controls
                autoPlay
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStreaming;