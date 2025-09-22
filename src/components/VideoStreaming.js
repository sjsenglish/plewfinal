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
      title: 'PLEW 강의 시리즈',
      videos: [
        {
          id: 'v1',
          title: 'Lesson 1',
          videoUrl: 'https://plewvideos.s3.eu-north-1.amazonaws.com/Lesson+1Final.mp4',
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
    // Add keyboard event listeners
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0f0f0f 0%, #1a1a1a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Hero Section with Message Overlay */}
      <section style={{
        position: 'relative',
        height: '85vh',
        overflow: 'hidden',
        marginBottom: '60px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden'
        }}>
          <iframe
            ref={heroVideoRef}
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
            src={SAMPLE_VIDEOS.hero.videoUrl}
            title={SAMPLE_VIDEOS.hero.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.8) 100%)'
          }}></div>
        </div>
        
        {/* Netflix-style Message Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '60px',
          zIndex: 10,
          maxWidth: '550px'
        }}>
          <h1 style={{
            fontSize: '56px',
            fontWeight: '800',
            marginBottom: '20px',
            textShadow: '2px 4px 8px rgba(0, 0, 0, 0.7)',
            letterSpacing: '-1.5px',
            lineHeight: '1.1'
          }}>
            옥스포드 테크닉<br/>
            <span style={{
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>PLEW</span>
          </h1>
          
          <p style={{
            fontSize: '20px',
            lineHeight: '1.5',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '16px',
            fontWeight: '400',
            textShadow: '1px 2px 4px rgba(0, 0, 0, 0.6)'
          }}>
            쉽고 심플하게 해설해 주는 강의 시리즈
          </p>
          
          <p style={{
            fontSize: '16px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '28px',
            fontWeight: '300',
            textShadow: '1px 2px 4px rgba(0, 0, 0, 0.6)',
            maxWidth: '450px'
          }}>
            시리즈를 완성한 후에는 문제 은행에서 다양한 오리지널 문제들을 연습해 보세요.
            방법을 알면 독해가 어렵지 않아요.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              <span style={{ color: '#4ade80' }}>●</span>
              7개 레슨
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              HD 화질
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              한국어
            </div>
          </div>
        </div>
      </section>

      {/* Video Grid Section */}
      <section style={{
        padding: '0 40px 80px'
      }}>
        {SAMPLE_VIDEOS.categories.map((category, categoryIndex) => (
          <div key={categoryIndex} style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}>
              <h2 style={{
                fontSize: '32px',
                fontWeight: '700',
                color: 'white',
                letterSpacing: '-0.5px'
              }}>
                {category.title}
              </h2>
              <div style={{
                display: 'flex',
                gap: '12px'
              }}>
                <button 
                  onClick={() => scrollCarousel(categoryIndex, 'left')}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  ‹
                </button>
                <button 
                  onClick={() => scrollCarousel(categoryIndex, 'right')}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '24px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  ›
                </button>
              </div>
            </div>
            
            <div 
              ref={el => carouselRefs.current[categoryIndex] = el}
              style={{
                display: 'flex',
                gap: '24px',
                overflowX: 'auto',
                scrollBehavior: 'smooth',
                paddingBottom: '20px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitScrollbar: { display: 'none' }
              }}
            >
              {category.videos.map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => playVideo(video)}
                  style={{
                    minWidth: '320px',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.5)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    position: 'relative',
                    paddingTop: '56.25%',
                    overflow: 'hidden',
                    background: '#1a1a1a'
                  }}>
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
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                    >
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                      }}>
                        <span style={{
                          color: '#1a1a1a',
                          fontSize: '24px',
                          marginLeft: '4px'
                        }}>▶</span>
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'white',
                      margin: 0
                    }}>
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