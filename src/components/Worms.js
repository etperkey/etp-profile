import { useEffect } from 'react';
import './Worms.css';

function Worms() {
  useEffect(() => {
    // Set document title
    document.title = '🪱 WORMS';

    return () => {
      document.title = 'Eric Perkey, MD-PhD';
    };
  }, []);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="worms-container">
      <button className="worms-back-button" onClick={handleBack}>
        ← Back to Portfolio
      </button>
      <iframe
        src="/projects/worms-parody/animation/index.html"
        title="WORMS - A Viagra Boys Parody"
        className="worms-iframe"
        allow="autoplay"
      />
    </div>
  );
}

export default Worms;
