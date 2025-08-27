// CommunityPage.js - Updated with consistent styling
import React from 'react';

export const CommunityPage = () => {
  const discordInfo = {
    inviteLink: 'https://discord.gg/examrizzsearch',
    serverName: 'examrizzsearch',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section - Clean redesign */}
      <div style={{ 
        background: 'white', 
        padding: '64px 24px', 
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '48px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: '#5865f2', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            margin: '0 auto 24px auto',
            fontSize: '36px',
            color: 'white'
          }}>
            <i className="fab fa-discord"></i>
          </div>
          
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: '#1e293b', 
            margin: '0 0 16px 0' 
          }}>
            Join the Community
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#64748b', 
            margin: '0 0 32px 0',
            lineHeight: '1.6'
          }}>
            Connect with fellow students, get help from teachers, and level up your study game
          </p>
          
          <a
            href={discordInfo.inviteLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 32px',
              background: '#5865f2',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '1.1rem',
              fontWeight: '600'
            }}
          >
            <i className="fab fa-discord"></i>
            <span>Join {discordInfo.serverName}</span>
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '0 24px 48px 24px' 
      }}>
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '48px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e2e8f0',
          marginBottom: '48px'
        }}>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '700', 
            color: '#1e293b', 
            margin: '0 0 40px 0',
            textAlign: 'center'
          }}>
            What You'll Get
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20blue.svg?alt=media&token=aadb885b-8372-45c4-8e1b-eaed70bcdc87"
                  alt="Subject Channels"
                  style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                margin: '0 0 12px 0' 
              }}>
                Subject Channels
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                lineHeight: '1.6', 
                margin: '0' 
              }}>
                Find others applying for the same degree, universities, etc.
              </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20white.svg?alt=media&token=599d4414-99cf-4084-858b-5b3512557023"
                  alt="Teacher Support"
                  style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                margin: '0 0 12px 0' 
              }}>
                @teacher
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                lineHeight: '1.6', 
                margin: '0' 
              }}>
                Stuck? Ask teachers & top students!
              </p>
            </div>
            
            <div style={{
              textAlign: 'center',
              padding: '24px'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/plewcsat1.firebasestorage.app/o/icons%2Fghost%20badge%20yellow.svg?alt=media&token=816a1190-9e2c-4ba4-a4e2-18578658fb5a"
                  alt="Weekly Quizzes"
                  style={{ width: '64px', height: '64px', objectFit: 'contain' }}
                />
              </div>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                margin: '0 0 12px 0' 
              }}>
                Weekly Quizzes
              </h3>
              <p style={{ 
                fontSize: '1rem', 
                color: '#64748b', 
                lineHeight: '1.6', 
                margin: '0' 
              }}>
                Rank yourself against others.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '48px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e2e8f0',
          marginBottom: '48px'
        }}>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '700', 
            color: '#1e293b', 
            margin: '0 0 40px 0',
            textAlign: 'center'
          }}>
            Upcoming Workshops - 4 week courses
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Monday 1st September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                4:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                TSA Fundamentals for beginners
              </div>
            </div>
            
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Monday 15th September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                TSA Intermediate - focus on timing and strategy
              </div>
            </div>
            
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                Tuesday 9th September - one day course
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                Maths for TSA
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Wednesday 3rd September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                TSA Section 2
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Tuesday 8th September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                LNAT for beginners
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Wednesday 9th September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                Maths for ESAT, MAT, TMUA, etc. - Beginners
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Thursday 10th September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                Maths for ESAT, MAT, TMUA, etc. - Advanced
              </div>
            </div>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '24px'
            }}>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: '600', 
                color: '#1e293b', 
                marginBottom: '8px' 
              }}>
                First Session: Monday 1st September
              </div>
              <div style={{ 
                fontSize: '0.875rem', 
                color: '#6366f1', 
                fontWeight: '500',
                marginBottom: '12px' 
              }}>
                6:00 PM GMT
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#374151',
                fontWeight: '500'
              }}>
                LNAT for beginners
              </div>
            </div>
          </div>
        </div>

        {/* Workshop Signup */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '48px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ 
              fontSize: '1.875rem', 
              fontWeight: '700', 
              color: '#1e293b', 
              margin: '0 0 12px 0'
            }}>
              Sign-up below
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: '#64748b', 
              margin: '0'
            }}>
              Register for upcoming workshops and get notified about new sessions
            </p>
          </div>
          
          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            background: '#f8fafc',
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <iframe 
              src="https://docs.google.com/forms/d/e/1FAIpQLSeSe131i3BklFD9EJers63P8SLQdhBpQTf1ITm8hBVeUlzzUA/viewform?embedded=true" 
              style={{
                width: '100%',
                height: '600px',
                border: 'none',
                borderRadius: '8px'
              }}
              frameBorder="0" 
              marginHeight="0" 
              marginWidth="0"
              title="Workshop Waitlist Form"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
};