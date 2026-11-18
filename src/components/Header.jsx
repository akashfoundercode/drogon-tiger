import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BarChart3, HelpCircle, Settings, Volume2, VolumeX, Crown, Maximize, Minimize } from 'lucide-react';
import PlayingCard from './PlayingCard.jsx';
import StatusBanner from './StatusBanner.jsx';
import { StatsModal, HelpModal, SettingsModal } from './Modals.jsx';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { isFullscreen, toggleFullscreen } from '../utils/fullscreen.js';

function RoundButton({ children, onClick, label }) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className="flex items-center justify-center rounded-full"
      style={{
        width: 52,
        height: 52,
        background: 'radial-gradient(circle at 35% 25%,#7a1d1d,#3a0a0a 70%)',
        border: '3px solid #f5c542',
        boxShadow: '0 0 0 2px #5c3b06, 0 6px 12px rgba(0,0,0,.6), inset 0 0 10px rgba(0,0,0,.6)',
      }}
    >
      {children}
    </motion.button>
  );
}



export default function Header() {
  const { state, actions, toast } = useGame();
  const [modal, setModal] = useState(null);
  const [fs, setFs] = useState(isFullscreen());

  useEffect(() => {
    const onFsChange = () => setFs(isFullscreen());
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
    };
  }, []);

  const { phase, cards, reveal, result } = state;
  const showResult = phase === PHASES.RESULT && result;
  const dWin = showResult && result.winner === 'dragon';
  const tWin = showResult && result.winner === 'tiger';
  const charging = phase === PHASES.CLOSED || (phase === PHASES.REVEAL && !(reveal.dragon && reveal.tiger));

  return (
    <>
      {/* top-left: back + logo */}
      <div className="absolute left-6 top-4 flex items-center gap-3" style={{ zIndex: 30 }}>
        <RoundButton label="Back" onClick={() => toast('Lobby is not part of this demo')}>
          <ArrowLeft size={26} color="#ffd84a" strokeWidth={3} />
        </RoundButton>
        <div className="flex flex-col items-center leading-[0.9]">
          <Crown size={20} color="#ffd84a" fill="#f5b81c" />
          <span className="font-display font-black text-[28px] text-gold-grad" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.8))', fontStyle: 'italic' }}>
            Dragon
          </span>
          <span className="font-display font-black text-[28px] text-gold-grad -mt-1" style={{ filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.8))', fontStyle: 'italic' }}>
            Tiger
          </span>
        </div>
      </div>

      {/* top-right: controls */}
      <div className="absolute right-6 top-4 flex items-center gap-2.5" style={{ zIndex: 30 }}>
        <RoundButton label={fs ? 'Exit Fullscreen' : 'Fullscreen'} onClick={() => toggleFullscreen()}>
          {fs ? <Minimize size={24} color="#ffd84a" /> : <Maximize size={24} color="#ffd84a" />}
        </RoundButton>
        <RoundButton label={state.soundOn ? 'Mute' : 'Unmute'} onClick={actions.toggleSound}>
          {state.soundOn ? <Volume2 size={24} color="#ffd84a" /> : <VolumeX size={24} color="#ffd84a" />}
        </RoundButton>
        <RoundButton label="Statistics" onClick={() => setModal('stats')}>
          <BarChart3 size={24} color="#ffd84a" />
        </RoundButton>
        <RoundButton label="How to play" onClick={() => setModal('help')}>
          <HelpCircle size={26} color="#ffd84a" />
        </RoundButton>
        <RoundButton label="Settings" onClick={() => setModal('settings')}>
          <Settings size={24} color="#ffd84a" />
        </RoundButton>
      </div>

      {/* centre: cards with VS emblem */}
      <div
        className="absolute flex items-center justify-center gap-7"
        style={{ left: '50%', transform: 'translateX(-50%)', top: 52, zIndex: 140 }}
      >
        <PlayingCard
          card={cards.dragon}
          faceUp={reveal.dragon}
          charging={charging}
          highlight={dWin}
          loser={tWin}
          tag={{ text: 'DRAGON', color: '#6fc8ff' }}
        />

        {/* VS emblem */}
        <div className="flex flex-col items-center justify-center relative select-none pointer-events-none">
          {/* subtle radial flare */}
          <div
            className="absolute w-24 h-24 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(255,190,40,0.35) 0%, rgba(230,60,20,0.15) 50%, transparent 75%)',
              filter: 'blur(8px)',
            }}
          />
          <div className="relative flex items-center justify-center">
            <span
              className="font-display font-black text-[42px] italic tracking-wider leading-none select-none"
              style={{
                background: 'linear-gradient(180deg, #ffffff 0%, #fff0a0 25%, #f5b81c 55%, #c85500 85%, #6e1000 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.95)) drop-shadow(0 0 16px rgba(255,180,30,0.8))',
              }}
            >
              VS
            </span>
          </div>
          {/* decorative golden accent line */}
          <div
            className="h-[2px] w-12 rounded-full mt-1"
            style={{
              background: 'linear-gradient(90deg, transparent, #ffd84a, transparent)',
              boxShadow: '0 0 6px #ffd84a',
            }}
          />
        </div>

        <PlayingCard
          card={cards.tiger}
          faceUp={reveal.tiger}
          charging={charging}
          highlight={tWin}
          loser={dWin}
          tag={{ text: 'TIGER', color: '#ffa04a' }}
        />
      </div>

      <StatusBanner />

      <AnimatePresence>
        {modal === 'stats' && <StatsModal key="stats" onClose={() => setModal(null)} />}
        {modal === 'help' && <HelpModal key="help" onClose={() => setModal(null)} />}
        {modal === 'settings' && <SettingsModal key="settings" onClose={() => setModal(null)} />}
      </AnimatePresence>
    </>
  );
}
