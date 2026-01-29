import { useEffect, useState } from 'react';
import './Worms.css';

function Worms() {
  const [isLoading, setIsLoading] = useState(true);

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

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="worms-container">
      <div className={`worms-loader ${isLoading ? '' : 'hidden'}`}>
        <div className="worms-spinner"></div>
        <span className="worms-loader-text">🪱 Loading worms...</span>
      </div>
      <button className="worms-back-button" onClick={handleBack}>
        ← Back to Portfolio
      </button>
      <iframe
        src="/projects/worms-parody/animation/index.html"
        title="WORMS - A Viagra Boys Parody"
        className="worms-iframe"
        allow="autoplay"
        onLoad={handleIframeLoad}
      />
    </div>
  );
}

export default Worms;
