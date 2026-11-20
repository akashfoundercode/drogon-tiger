import React from 'react';
import { Info, RotateCw, Maximize } from 'lucide-react';
import { GameProvider } from './game/GameContext.jsx';
import { useScale } from './hooks/useScale.js';
import { useMobileFullscreen } from './hooks/useMobileFullscreen.js';
import { enterFullscreen } from './utils/fullscreen.js';
import { CANVAS_W, CANVAS_H } from './game/constants.js';
import Scene from './components/Scene.jsx';
import Header from './components/Header.jsx';
import PlayerSidebar from './components/PlayerSidebar.jsx';
import ResultHistory from './components/ResultHistory.jsx';
import BetPanel from './components/BetPanel.jsx';
import BottomBar from './components/BottomBar.jsx';
import FlyingChips from './components/FlyingChips.jsx';
import SettlementAnimation from './components/SettlementAnimation.jsx';
import PhaseOverlay from './components/PhaseOverlay.jsx';
import WinnerAnimation from './components/WinnerAnimation.jsx';

function Game() {
  return (
    <>
      <Scene />
      <Header />
      <PlayerSidebar side="left" />
      <PlayerSidebar side="right" />
      <ResultHistory />

      {/* betting panels */}
      <div className="absolute" style={{ left: 405, top: 326, zIndex: 12 }}>
        <BetPanel side="dragon" />
      </div>
      <div className="absolute" style={{ left: 770, top: 326, zIndex: 12 }}>
        <BetPanel side="tie" />
      </div>
      <div className="absolute" style={{ left: 1126, top: 326, zIndex: 12 }}>
        <BetPanel side="tiger" />
      </div>

      <BottomBar />
      <WinnerAnimation />
      <PhaseOverlay />
      <FlyingChips />
      <SettlementAnimation />
    </>
  );
}

export default function App() {
  const { scaleX, scaleY, portrait } = useScale();
  useMobileFullscreen();

  const handleRotateTap = async () => {
    await enterFullscreen();
  };

  return (
    <GameProvider>
      <div className="fixed inset-0 overflow-hidden" style={{ background: '#05020c' }}>
        <div
          data-canvas
          className="absolute overflow-hidden"
          style={{
            width: CANVAS_W,
            height: CANVAS_H,
            left: 0,
            top: 0,
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: 'top left',
          }}
        >
          <Game />
        </div>
        {portrait && (
          <div
            onClick={handleRotateTap}
            className="absolute inset-0 z-[200] flex flex-col items-center justify-center gap-5 text-center px-8 cursor-pointer select-none"
            style={{ background: 'radial-gradient(circle at center, rgba(30,10,25,0.96), rgba(5,2,12,0.98))' }}
          >
            <div className="relative">
              <RotateCw size={64} color="#ffd84a" className="animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <p className="font-display font-black text-2xl text-gold-grad">Rotate your device</p>
            <p className="text-white/80 font-body text-sm flex items-center gap-1.5">
              <Info size={16} /> Dragon vs Tiger plays in landscape fullscreen
            </p>
            <button
              onClick={handleRotateTap}
              className="mt-2 flex items-center gap-2 px-6 py-3 rounded-full font-display font-extrabold text-[15px] tracking-wider text-[#4a2d00] transition-transform active:scale-95"
              style={{
                background: 'linear-gradient(180deg,#fff1a8,#e0a912)',
                boxShadow: '0 4px 16px rgba(224,169,18,0.5), inset 0 1px 1px rgba(255,255,255,0.8)',
              }}
            >
              <Maximize size={18} strokeWidth={2.5} /> TAP FOR FULLSCREEN
            </button>
          </div>
        )}
      </div>
    </GameProvider>
  );
}
