import React, { useState, useEffect } from 'react';
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
import CV from './components/CV';
import './App.css';

function App() {
  const [theme, setTheme] = useState('modern');
  const [currentPage, setCurrentPage] = useState('home');

  // Handle hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#cv' || hash === '#/cv') {
        setCurrentPage('cv');
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

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('modern-theme', 'geocities-theme', 'myspace-theme');
    };
  }, [theme]);

  // Render CV page
  if (currentPage === 'cv') {
    return <CV />;
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
      </main>
      <Footer />
      <ThemeSwitcher currentTheme={theme} setTheme={setTheme} />
      <MySpacePlayer isActive={theme === 'myspace'} />
      <DancingBabies isActive={theme === 'geocities'} />
    </div>
  );
}

export default App;
