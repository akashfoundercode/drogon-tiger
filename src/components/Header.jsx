import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  HelpCircle,
  Settings,
  Volume2,
  VolumeX,
  Crown,
  Maximize,
  Minimize,
  Wallet,
  User,
  LogIn,
} from 'lucide-react';
import PlayingCard from './PlayingCard.jsx';
import StatusBanner from './StatusBanner.jsx';
import {
  StatsModal,
  HelpModal,
  SettingsModal,
  LoginModal,
  ProfileModal,
  WalletModal,
} from './Modals.jsx';
import { useGame } from '../game/GameContext.jsx';
import { PHASES } from '../game/constants.js';
import { formatINR } from '../game/format.js';
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
  const { state, actions, toast, modal, setModal, user } = useGame();
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
      {/* top-left: back + logo + wallet/profile quick pill */}
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

        {/* Profile & Wallet quick pill */}
        <div className="flex items-center gap-2 ml-2">
          {/* Wallet Balance Pill */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModal('wallet')}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border cursor-pointer select-none"
            style={{
              background: 'linear-gradient(180deg, rgba(40,10,20,0.95), rgba(15,2,8,0.98))',
              borderColor: 'rgba(255,216,74,0.65)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.2)',
            }}
          >
            <span className="text-[14px]">🪙</span>
            <span className="font-display font-extrabold text-[15px] text-[#ffe27a] leading-none">
              {formatINR(state.balance)}
            </span>
            <span className="w-5 h-5 rounded-full bg-yellow-400 text-[#4a2d00] flex items-center justify-center text-xs font-black shadow-sm">
              +
            </span>
          </motion.button>

          {/* User Profile / Login Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setModal(user.isLoggedIn ? 'profile' : 'login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer select-none"
            style={{
              background: user.isLoggedIn
                ? 'linear-gradient(180deg, rgba(20,50,30,0.92), rgba(5,20,10,0.96))'
                : 'linear-gradient(180deg, rgba(80,20,30,0.92), rgba(30,5,10,0.96))',
              borderColor: user.isLoggedIn ? 'rgba(74,222,128,0.6)' : 'rgba(255,216,74,0.6)',
            }}
          >
            <User size={15} className={user.isLoggedIn ? 'text-green-400' : 'text-[#ffe27a]'} />
            <span className="font-body font-bold text-xs text-white max-w-[95px] truncate">
              {user.isLoggedIn ? user.userName : 'LOGIN'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* top-right: controls */}
      <div className="absolute right-6 top-4 flex items-center gap-2.5" style={{ zIndex: 30 }}>
        <RoundButton label="Wallet" onClick={() => setModal('wallet')}>
          <Wallet size={23} color="#ffd84a" />
        </RoundButton>
        <RoundButton label="Profile" onClick={() => setModal(user.isLoggedIn ? 'profile' : 'login')}>
          <User size={23} color={user.isLoggedIn ? '#4ade80' : '#ffd84a'} />
        </RoundButton>
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
        className="absolute flex items-center justify-center gap-7 transition-opacity duration-300"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          top: 52,
          zIndex: 140,
          opacity: phase === PHASES.IDLE ? 0 : 1,
        }}
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
        {modal === 'login' && <LoginModal key="login" onClose={() => setModal(null)} />}
        {modal === 'profile' && <ProfileModal key="profile" onClose={() => setModal(null)} />}
        {modal === 'wallet' && <WalletModal key="wallet" onClose={() => setModal(null)} />}
        {modal === 'stats' && <StatsModal key="stats" onClose={() => setModal(null)} />}
        {modal === 'help' && <HelpModal key="help" onClose={() => setModal(null)} />}
        {modal === 'settings' && <SettingsModal key="settings" onClose={() => setModal(null)} />}
      </AnimatePresence>
    </>
  );
}
