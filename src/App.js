import { useState, useEffect, lazy, Suspense } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Publications from './components/Publications';
import Projects from './components/Projects';
import ResearchTools from './components/ResearchTools';
import Contact from './components/Contact';
import Footer from './components/Footer';
import ThemeSwitcher from './components/ThemeSwitcher';
import MySpacePlayer from './components/MySpacePlayer';
import DancingBabies from './components/DancingBabies';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Lazy-loaded components for code splitting
const CV = lazy(() => import('./components/CV'));
const BloodSmearViewer = lazy(() => import('./components/BloodSmearViewer'));
const MorphologyGuide = lazy(() => import('./components/MorphologyGuide'));

// Loading fallback component
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  const [theme, setTheme] = useState(() => {
    // Check hash for theme parameter first (e.g., #theme=myspace)
    const hash = window.location.hash;
    const themeMatch = hash.match(/theme=(\w+)/);
    if (themeMatch && ['modern', 'geocities', 'myspace'].includes(themeMatch[1])) {
      localStorage.setItem('etp-theme', themeMatch[1]);
      return themeMatch[1];
    }
    // Fall back to localStorage, default to 'modern'
    return localStorage.getItem('etp-theme') || 'modern';
  });
  const [currentPage, setCurrentPage] = useState('home');

  // Handle routing - supports both clean URLs (/smear) and hash (#smear)
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      // Check pathname first (clean URLs for Instagram, etc.)
      if (path === '/cv') {
        setCurrentPage('cv');
      } else if (path === '/smear') {
        setCurrentPage('smear');
      } else if (path === '/morphology') {
        setCurrentPage('morphology');
      // Fallback to hash-based routing for backwards compatibility
      } else if (hash === '#cv' || hash === '#/cv') {
        setCurrentPage('cv');
      } else if (hash === '#smear' || hash === '#/smear' || hash === '#blood-smear') {
        setCurrentPage('smear');
      } else if (hash === '#morphology' || hash === '#/morphology' || hash === '#morphology-guide') {
        setCurrentPage('morphology');
      } else {
        setCurrentPage('home');
      }
    };

    // Check on mount
    handleRouteChange();

    // Listen for hash changes (backwards compatibility)
    window.addEventListener('hashchange', handleRouteChange);
    // Listen for popstate (browser back/forward with clean URLs)
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Listen for theme changes via hash
  useEffect(() => {
    const handleThemeHash = () => {
      const hash = window.location.hash;
      const themeMatch = hash.match(/theme=(\w+)/);
      if (themeMatch && ['modern', 'geocities', 'myspace'].includes(themeMatch[1])) {
        setTheme(themeMatch[1]);
      }
    };

    window.addEventListener('hashchange', handleThemeHash);
    return () => window.removeEventListener('hashchange', handleThemeHash);
  }, []);

  useEffect(() => {
    // Remove all theme classes
    document.body.classList.remove('modern-theme', 'geocities-theme', 'myspace-theme');
    // Add current theme class
    document.body.classList.add(`${theme}-theme`);
    // Save to localStorage
    localStorage.setItem('etp-theme', theme);

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modern-theme', 'geocities-theme', 'myspace-theme');
    };
  }, [theme]);

  // Render CV page
  if (currentPage === 'cv') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <CV />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Render Blood Smear Viewer page
  if (currentPage === 'smear') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <BloodSmearViewer />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Render Morphology Guide page
  if (currentPage === 'morphology') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <MorphologyGuide />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <div className="App">
      <Header />
      <main>
        <Hero theme={theme} />
        <About />
        <Publications />
        <Projects />
        <ResearchTools />
        <Contact />
        <section className="quote-section">
          <p className="nietzsche-quote">
            &ldquo;He who fights with monsters should see to it that he himself does not become a{' '}
            <a
              href="https://www.nejm.org/doi/full/10.1056/NEJMoa2411507"
              target="_blank"
              rel="noopener noreferrer"
              className="monster-link"
            >
              monster
            </a>
            .&rdquo;
            <span className="quote-attribution">&mdash; Nietzsche</span>
          </p>
        </section>
      </main>
      <Footer />
      <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />
      <MySpacePlayer isActive={theme === 'myspace'} />
      <DancingBabies isActive={theme === 'geocities'} />
    </div>
  );
}

export default App;
