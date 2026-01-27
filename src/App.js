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
    // Load saved theme from localStorage, default to 'modern'
    return localStorage.getItem('etp-theme') || 'modern';
  });
  const [currentPage, setCurrentPage] = useState('home');

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#cv' || hash === '#/cv') {
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
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
