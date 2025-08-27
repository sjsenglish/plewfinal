import React, { useState, useEffect } from 'react';
import './VocabularyProgress.css';

const VocabularyProgress = ({ userProgress, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('week'); // week, month, all
  const [selectedMetric, setSelectedMetric] = useState('wordsLearned');

  // Mock data - in real app this would come from Firebase/backend
  const mockProgressData = {
    overview: {
      totalWordsLearned: 342,
      currentStreak: 7,
      longestStreak: 23,
      averageAccuracy: 87,
      totalTestsTaken: 48,
      studyTimeThisWeek: 185, // minutes
      wordsReviewedToday: 15,
      nextReviewWords: 23
    },
    recentActivity: [
      { date: '2024-01-15', wordsStudied: 12, testsCompleted: 2, accuracy: 92 },
      { date: '2024-01-14', wordsStudied: 8, testsCompleted: 1, accuracy: 85 },
      { date: '2024-01-13', wordsStudied: 15, testsCompleted: 3, accuracy: 88 },
      { date: '2024-01-12', wordsStudied: 10, testsCompleted: 2, accuracy: 91 },
      { date: '2024-01-11', wordsStudied: 7, testsCompleted: 1, accuracy: 79 },
      { date: '2024-01-10', wordsStudied: 13, testsCompleted: 2, accuracy: 94 },
      { date: '2024-01-09', wordsStudied: 9, testsCompleted: 1, accuracy: 86 }
    ],
    weakWords: [
      { word: 'ubiquitous', attempts: 5, successRate: 40, lastAttempt: '2024-01-14' },
      { word: 'ephemeral', attempts: 4, successRate: 50, lastAttempt: '2024-01-13' },
      { word: 'serendipity', attempts: 6, successRate: 33, lastAttempt: '2024-01-15' },
      { word: 'perspicacious', attempts: 3, successRate: 33, lastAttempt: '2024-01-12' },
      { word: 'magnanimous', attempts: 4, successRate: 25, lastAttempt: '2024-01-11' }
    ],
    strongWords: [
      { word: 'abundant', attempts: 8, successRate: 100, lastAttempt: '2024-01-15' },
      { word: 'significant', attempts: 6, successRate: 100, lastAttempt: '2024-01-14' },
      { word: 'elaborate', attempts: 7, successRate: 95, lastAttempt: '2024-01-13' },
      { word: 'comprehensive', attempts: 5, successRate: 100, lastAttempt: '2024-01-12' },
      { word: 'fundamental', attempts: 9, successRate: 95, lastAttempt: '2024-01-11' }
    ],
    achievements: [
      { id: 'first_week', title: 'First Week', description: 'Studied for 7 consecutive days', earned: true, date: '2024-01-08' },
      { id: 'hundred_words', title: '100 Words', description: 'Learned 100 vocabulary words', earned: true, date: '2024-01-10' },
      { id: 'perfect_score', title: 'Perfect Score', description: 'Got 100% on a vocabulary test', earned: true, date: '2024-01-12' },
      { id: 'speed_demon', title: 'Speed Demon', description: 'Complete 5 tests in one day', earned: false },
      { id: 'thousand_words', title: '1000 Words', description: 'Learn 1000 vocabulary words', earned: false }
    ]
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatStudyTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStreakIcon = (streak) => {
    if (streak >= 30) return '🔥';
    if (streak >= 14) return '⚡';
    if (streak >= 7) return '✨';
    return '💪';
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'words', label: 'Words', icon: '📝' },
    { id: 'achievements', label: 'Achievements', icon: '🏆' }
  ];

  const OverviewTab = () => {
    const { overview } = mockProgressData;
    
    return (
      <div className="tab-content">
        {/* Key Stats */}
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <div className="stat-value">{overview.totalWordsLearned}</div>
              <div className="stat-label">Words Learned</div>
            </div>
          </div>
          
          <div className="stat-card streak">
            <div className="stat-icon">{getStreakIcon(overview.currentStreak)}</div>
            <div className="stat-content">
              <div className="stat-value">{overview.currentStreak}</div>
              <div className="stat-label">Day Streak</div>
              <div className="stat-note">Longest: {overview.longestStreak} days</div>
            </div>
          </div>
          
          <div className="stat-card accuracy">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-value">{overview.averageAccuracy}%</div>
              <div className="stat-label">Avg. Accuracy</div>
            </div>
          </div>
          
          <div className="stat-card time">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <div className="stat-value">{formatStudyTime(overview.studyTimeThisWeek)}</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
        </div>

        {/* Today's Summary */}
        <div className="today-summary">
          <h3>Today's Progress</h3>
          <div className="today-stats">
            <div className="today-stat">
              <span className="today-label">Words Reviewed</span>
              <span className="today-value">{overview.wordsReviewedToday}</span>
            </div>
            <div className="today-stat">
              <span className="today-label">Up for Review</span>
              <span className="today-value">{overview.nextReviewWords}</span>
            </div>
          </div>
          
          <div className="quick-actions">
            <button className="action-btn primary">Continue Studying</button>
            <button className="action-btn secondary">Take Quick Test</button>
          </div>
        </div>

        {/* Recent Performance Chart */}
        <div className="performance-chart">
          <h3>Recent Performance</h3>
          <div className="chart-container">
            <div className="chart-bars">
              {mockProgressData.recentActivity.slice(0, 7).map((day, index) => (
                <div key={index} className="chart-bar-container">
                  <div 
                    className="chart-bar accuracy-bar"
                    style={{ height: `${day.accuracy}%` }}
                    title={`${day.accuracy}% accuracy`}
                  ></div>
                  <div 
                    className="chart-bar words-bar"
                    style={{ height: `${(day.wordsStudied / 20) * 100}%` }}
                    title={`${day.wordsStudied} words studied`}
                  ></div>
                  <div className="chart-label">{formatDate(day.date)}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color accuracy"></span>
                <span>Accuracy %</span>
              </div>
              <div className="legend-item">
                <span className="legend-color words"></span>
                <span>Words Studied</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ActivityTab = () => (
    <div className="tab-content">
      <div className="activity-header">
        <h3>Study Activity</h3>
        <div className="time-filters">
          {['week', 'month', 'all'].map(filter => (
            <button
              key={filter}
              className={`time-filter ${timeFilter === filter ? 'active' : ''}`}
              onClick={() => setTimeFilter(filter)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="activity-list">
        {mockProgressData.recentActivity.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-date">
              <div className="date-day">{new Date(activity.date).getDate()}</div>
              <div className="date-month">{formatDate(activity.date)}</div>
            </div>
            
            <div className="activity-content">
              <div className="activity-stats">
                <div className="activity-stat">
                  <span className="stat-icon">📚</span>
                  <span>{activity.wordsStudied} words studied</span>
                </div>
                <div className="activity-stat">
                  <span className="stat-icon">✅</span>
                  <span>{activity.testsCompleted} tests completed</span>
                </div>
                <div className="activity-stat">
                  <span className="stat-icon">🎯</span>
                  <span>{activity.accuracy}% accuracy</span>
                </div>
              </div>
            </div>
            
            <div className="activity-score">
              <div className={`score-badge ${activity.accuracy >= 90 ? 'excellent' : activity.accuracy >= 80 ? 'good' : 'needs-work'}`}>
                {activity.accuracy}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const WordsTab = () => (
    <div className="tab-content">
      <div className="words-header">
        <h3>Word Performance</h3>
        <div className="word-filters">
          <button className="word-filter active">All Words</button>
          <button className="word-filter">Needs Practice</button>
          <button className="word-filter">Mastered</button>
        </div>
      </div>

      <div className="words-sections">
        {/* Weak Words */}
        <div className="words-section">
          <h4 className="section-title needs-work">
            <span className="section-icon">⚠️</span>
            Words Needing Practice
          </h4>
          <div className="words-list">
            {mockProgressData.weakWords.map((wordData, index) => (
              <div key={index} className="word-item needs-practice">
                <div className="word-info">
                  <div className="word-name">{wordData.word}</div>
                  <div className="word-stats">
                    <span>Success rate: {wordData.successRate}%</span>
                    <span>{wordData.attempts} attempts</span>
                    <span>Last: {formatDate(wordData.lastAttempt)}</span>
                  </div>
                </div>
                <div className="word-actions">
                  <div className="success-rate-bar">
                    <div 
                      className="success-fill"
                      style={{ width: `${wordData.successRate}%` }}
                    ></div>
                  </div>
                  <button className="practice-btn">Practice</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strong Words */}
        <div className="words-section">
          <h4 className="section-title mastered">
            <span className="section-icon">✅</span>
            Well-Known Words
          </h4>
          <div className="words-list">
            {mockProgressData.strongWords.map((wordData, index) => (
              <div key={index} className="word-item mastered">
                <div className="word-info">
                  <div className="word-name">{wordData.word}</div>
                  <div className="word-stats">
                    <span>Success rate: {wordData.successRate}%</span>
                    <span>{wordData.attempts} attempts</span>
                    <span>Last: {formatDate(wordData.lastAttempt)}</span>
                  </div>
                </div>
                <div className="word-actions">
                  <div className="success-rate-bar">
                    <div 
                      className="success-fill mastered-fill"
                      style={{ width: `${wordData.successRate}%` }}
                    ></div>
                  </div>
                  <span className="mastered-badge">Mastered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const AchievementsTab = () => (
    <div className="tab-content">
      <h3>Achievements</h3>
      <div className="achievements-grid">
        {mockProgressData.achievements.map((achievement) => (
          <div 
            key={achievement.id} 
            className={`achievement-card ${achievement.earned ? 'earned' : 'locked'}`}
          >
            <div className="achievement-icon">
              {achievement.earned ? '🏆' : '🔒'}
            </div>
            <div className="achievement-content">
              <div className="achievement-title">{achievement.title}</div>
              <div className="achievement-description">{achievement.description}</div>
              {achievement.earned && (
                <div className="achievement-date">
                  Earned on {formatDate(achievement.date)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="progress-overlay">
      <div className="progress-modal">
        {/* Header */}
        <div className="progress-header">
          <h2>Your Progress</h2>
          <button className="close-progress-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="progress-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="progress-content">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'words' && <WordsTab />}
          {activeTab === 'achievements' && <AchievementsTab />}
        </div>
      </div>
    </div>
  );
};

export default VocabularyProgress;