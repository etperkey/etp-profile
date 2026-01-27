import { useState, useEffect, useRef } from 'react';
import './MySpacePlayer.css';

function MySpacePlayer({ isActive }) {
  const playerRef = useRef(null);

  const playlist = [
    {
      id: 'RRKJiM9Njr8',
      title: 'Welcome to the Black Parade',
      artist: 'My Chemical Romance',
    },
    {
      id: 'gGdGFtwCNBE',
      title: 'Mr. Brightside',
      artist: 'The Killers',
    },
    {
      id: 'vc6vs-l5dkc',
      title: 'I Write Sins Not Tragedies',
      artist: 'Panic! At The Disco',
    },
    {
      id: 'aCyGvGEtOwc',
      title: 'Misery Business',
      artist: 'Paramore',
    },
  ];

  const [currentTrack, setCurrentTrack] = useState(0);

  useEffect(() => {
    // Reload iframe when track changes to trigger new video
    if (isActive && playerRef.current) {
      const iframe = playerRef.current;
      // eslint-disable-next-line no-self-assign
      iframe.src = iframe.src;
    }
  }, [isActive, currentTrack]);

  const nextTrack = () => {
    setCurrentTrack((prev) => (prev + 1) % playlist.length);
  };

  const prevTrack = () => {
    setCurrentTrack((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  if (!isActive) return null;

  const current = playlist[currentTrack];

  return (
    <div className="myspace-player">
      <div className="player-container">
        <div className="player-header">
          <span className="player-title">♫ MySpace Music Player ♫</span>
          <span className="player-status">NOW PLAYING</span>
        </div>
        <div className="player-content">
          <iframe
            ref={playerRef}
            width="250"
            height="60"
            src={`https://www.youtube.com/embed/${current.id}?autoplay=1&loop=1&playlist=${current.id}`}
            title={current.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          ></iframe>
        </div>
        <div className="player-controls">
          <button onClick={prevTrack} className="player-btn">
            ◄◄
          </button>
          <span className="track-number">
            {currentTrack + 1} / {playlist.length}
          </span>
          <button onClick={nextTrack} className="player-btn">
            ►►
          </button>
        </div>
        <div className="player-info">
          <div className="marquee-container">
            <span className="marquee-text">
              ★ {current.artist} - {current.title} ★ Add to playlist ★ Share with friends ★
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MySpacePlayer;
