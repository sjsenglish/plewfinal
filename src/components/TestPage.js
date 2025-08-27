// src/components/TestPage.js
import React, { useState } from 'react';
import { Button, Input, Loading, ErrorBoundary, ErrorMessage } from './ui';

const TestPage = () => {
  const [theme, setTheme] = useState('tsa');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  const themes = ['tsa', 'plew', 'maths'];

  const handleLoadingTest = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <ErrorBoundary theme={theme}>
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        <h1>UI Components Test Page</h1>

        {/* Theme Selector */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Theme Selector</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {themes.map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'primary' : 'secondary'}
                theme={t}
                onClick={() => setTheme(t)}
              >
                {t.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Button Variants</h2>

          {/* Primary variants */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>
              Primary Buttons
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Button variant="primary" theme={theme}>
                Primary
              </Button>
              <Button variant="secondary" theme={theme}>
                Secondary
              </Button>
              <Button variant="outline" theme={theme}>
                Outline
              </Button>
              <Button variant="ghost" theme={theme}>
                Ghost
              </Button>
            </div>
          </div>

          {/* Semantic variants */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>
              Semantic Buttons
            </h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Button variant="success" theme={theme}>
                Success
              </Button>
              <Button variant="danger" theme={theme}>
                Danger
              </Button>
              <Button variant="link" theme={theme}>
                Link Style
              </Button>
            </div>
          </div>

          {/* Sizes */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>Sizes</h3>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <Button size="small" theme={theme}>
                Small
              </Button>
              <Button size="medium" theme={theme}>
                Medium
              </Button>
              <Button size="large" theme={theme}>
                Large
              </Button>
            </div>
          </div>

          {/* States */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: '#666' }}>States</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Button disabled theme={theme}>
                Disabled
              </Button>
              <Button loading theme={theme}>
                Loading
              </Button>
              <Button fullWidth theme={theme} style={{ maxWidth: '200px' }}>
                Full Width
              </Button>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Inputs</h2>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            <Input label="Basic Input" placeholder="Enter text..." theme={theme} />
            <Input label="Required Input" required placeholder="Required field" theme={theme} />
            <Input label="Input with Error" error="This field is required" theme={theme} />
            <Input
              label="Input with Help Text"
              helpText="This is some helpful information"
              theme={theme}
            />
            <Input type="email" label="Email Input" placeholder="Enter your email" theme={theme} />
          </div>
        </div>

        {/* Loading States */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Loading States</h2>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
            <Loading size="small" theme={theme} text="Small" />
            <Loading size="medium" theme={theme} text="Medium" />
            <Loading size="large" theme={theme} text="Large" />
          </div>

          <Button onClick={handleLoadingTest} theme={theme}>
            Test Loading Overlay (3s)
          </Button>

          {loading && (
            <div
              style={{
                position: 'relative',
                marginTop: '1rem',
                padding: '2rem',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f9f9f9',
              }}
            >
              <p>This content is behind a loading overlay...</p>
              <Loading overlay={true} theme={theme} />
            </div>
          )}
        </div>

        {/* Error States */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Error States</h2>
          <Button onClick={() => setShowError(!showError)} variant="secondary" theme={theme}>
            Toggle Error Message
          </Button>

          {showError && (
            <div style={{ marginTop: '1rem' }}>
              <ErrorMessage
                error="This is an example error message"
                onRetry={() => setShowError(false)}
                theme={theme}
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default TestPage;