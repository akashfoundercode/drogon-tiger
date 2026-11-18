import React from 'react';
import { Info, RotateCw } from 'lucide-react';
import { GameProvider } from './game/GameContext.jsx';
import { useScale } from './hooks/useScale.js';
import { CANVAS_W, CANVAS_H } from './game/constants.js';
import Scene from './components/Scene.jsx';
import Header from './components/Header.jsx';
import PlayerSidebar from './components/PlayerSidebar.jsx';
import ResultHistory from './components/ResultHistory.jsx';
import BetPanel from './components/BetPanel.jsx';
import BottomBar from './components/BottomBar.jsx';
import FlyingChips from './components/FlyingChips.jsx';
import PhaseOverlay from './components/PhaseOverlay.jsx';
import NumberGuide from './components/NumberGuide.jsx';

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
      <PhaseOverlay />
      <FlyingChips />
      <NumberGuide />
    </>
  );
}

export default function App() {
  const { scaleX, scaleY, portrait } = useScale();
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
          <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center gap-4 text-center px-8" style={{ background: 'rgba(5,2,12,.94)' }}>
            <RotateCw size={56} color="#ffd84a" />
            <p className="font-display font-black text-2xl text-gold-grad">Rotate your device</p>
            <p className="text-white/70 font-body text-sm flex items-center gap-1.5">
              <Info size={16} /> Dragon vs Tiger plays in landscape
            </p>
          </div>
        )}
      </div>
    </GameProvider>
  );
}
