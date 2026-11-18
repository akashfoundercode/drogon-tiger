import React, { useState } from 'react';
import { useGame } from '../game/GameContext.jsx';

export const GUIDE_ZONES = [
  // 1 & 2: Sidebars
  { id: 1, label: 'Left Player Panel', x: 68, y: 276, w: 156, h: 295, bx: 146, by: 301, sz: 36, color: '#3b82f6' },
  { id: 2, label: 'Right Player Panel', x: 1646, y: 276, w: 156, h: 295, bx: 1724, by: 301, sz: 36, color: '#3b82f6' },

  // 3 & 4: Top headers
  { id: 3, label: 'Top-Left (Logo & Back)', x: 24, y: 16, w: 220, h: 85, bx: 134, by: 58, sz: 32, color: '#a855f7' },
  { id: 4, label: 'Top-Right (Controls)', x: 1560, y: 16, w: 280, h: 70, bx: 1700, by: 51, sz: 32, color: '#a855f7' },

  // 5: Top Plaque
  { id: 5, label: 'Top Center Plaque (Status Banner)', x: 755, y: 198, w: 380, h: 36, bx: 945, by: 216, sz: 34, color: '#eab308' },

  // 6: Cards Area
  { id: 6, label: 'Cards & VS Area', x: 795, y: 48, w: 280, h: 125, bx: 935, by: 105, sz: 38, color: '#ec4899' },

  // 7 to 20: 14 Small History Boxes
  { id: 7, label: 'Small Box 1', x: 637, y: 264, w: 39, h: 30, bx: 656, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 8, label: 'Small Box 2', x: 690, y: 264, w: 39, h: 30, bx: 709, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 9, label: 'Small Box 3', x: 743, y: 264, w: 39, h: 30, bx: 762, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 10, label: 'Small Box 4', x: 796, y: 264, w: 39, h: 30, bx: 815, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 11, label: 'Small Box 5', x: 848, y: 264, w: 40, h: 30, bx: 867, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 12, label: 'Small Box 6', x: 901, y: 264, w: 39, h: 30, bx: 920, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 13, label: 'Small Box 7', x: 953, y: 264, w: 39, h: 30, bx: 972, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 14, label: 'Small Box 8', x: 1005, y: 264, w: 39, h: 30, bx: 1024, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 15, label: 'Small Box 9', x: 1056, y: 264, w: 39, h: 30, bx: 1075, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 16, label: 'Small Box 10', x: 1108, y: 264, w: 39, h: 30, bx: 1127, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 17, label: 'Small Box 11', x: 1160, y: 264, w: 39, h: 30, bx: 1179, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 18, label: 'Small Box 12', x: 1212, y: 264, w: 39, h: 30, bx: 1231, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 19, label: 'Small Box 13', x: 1264, y: 264, w: 39, h: 30, bx: 1283, by: 279, sz: 22, color: '#06b6d4', small: true },
  { id: 20, label: 'Small Box 14', x: 1316, y: 264, w: 39, h: 30, bx: 1335, by: 279, sz: 22, color: '#06b6d4', small: true },

  // 21, 22, 23: 3 Big Betting Boxes
  { id: 21, label: 'Left Blue Box (Dragon)', x: 405, y: 326, w: 343, h: 284, bx: 576, by: 468, sz: 46, color: '#38bdf8' },
  { id: 22, label: 'Middle Green Box (Tie)', x: 770, y: 326, w: 334, h: 284, bx: 937, by: 468, sz: 46, color: '#22c55e' },
  { id: 23, label: 'Right Red Box (Tiger)', x: 1126, y: 326, w: 343, h: 284, bx: 1297, by: 468, sz: 46, color: '#ef4444' },

  // 24: Bottom Left User Profile
  { id: 24, label: 'Bottom-Left Frame (User Profile)', x: 210, y: 656, w: 306, h: 78, bx: 363, by: 695, sz: 36, color: '#f59e0b' },

  // 25 to 29: Bottom 5 Chip Rings
  { id: 25, label: 'Chip Ring 1 (10)', x: 613, y: 657, w: 74, h: 74, bx: 650, by: 694, sz: 32, color: '#eab308' },
  { id: 26, label: 'Chip Ring 2 (50)', x: 713, y: 657, w: 74, h: 74, bx: 750, by: 694, sz: 32, color: '#eab308' },
  { id: 27, label: 'Chip Ring 3 (100)', x: 813, y: 657, w: 74, h: 74, bx: 850, by: 694, sz: 32, color: '#eab308' },
  { id: 28, label: 'Chip Ring 4 (500)', x: 913, y: 657, w: 74, h: 74, bx: 950, by: 694, sz: 32, color: '#eab308' },
  { id: 29, label: 'Chip Ring 5 (1000)', x: 1014, y: 657, w: 74, h: 74, bx: 1051, by: 694, sz: 32, color: '#eab308' },

  // 30: Bottom Right Frame (Clear Button & Status)
  { id: 30, label: 'Clear Button & Info', x: 1360, y: 665, w: 480, h: 58, bx: 1418, by: 694, sz: 36, color: '#f59e0b' },
];

export default function NumberGuide() {
  const [show, setShow] = useState(true);
  const { forceWinner, setForceWinner, toast } = useGame();

  const handleSetWinner = (w) => {
    setForceWinner(w);
    const labels = {
      tiger: '🐯 TIGER set as next winner!',
      dragon: '🐲 DRAGON set as next winner!',
      tie: '🤝 TIE set as next winner!',
      random: '🎲 RANDOM winner mode active!',
    };
    toast(labels[w] || 'Winner mode updated');
  };

  return (
    <>
      {/* Floating Bottom Testing & Guide Controls */}
      <div
        className="absolute z-[150] flex items-center gap-2 px-3.5 py-1.5 rounded-full select-none"
        style={{
          left: '50%',
          bottom: 10,
          transform: 'translateX(-50%)',
          background: 'rgba(12, 5, 22, 0.94)',
          border: '2px solid rgba(255, 215, 74, 0.7)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.85), 0 0 15px rgba(255,180,30,0.3)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span className="text-[12px] font-display font-black text-[#ffd84a] uppercase tracking-wider px-1 flex items-center gap-1">
          <span>⚡ WINNER:</span>
        </span>

        {/* Tiger button */}
        <button
          onClick={() => handleSetWinner('tiger')}
          className="px-3 py-1 rounded-full font-body font-black text-[12px] tracking-wide transition-all select-none cursor-pointer"
          style={{
            background: forceWinner === 'tiger' ? 'linear-gradient(180deg,#ef4444,#991b1b)' : 'rgba(255,255,255,0.08)',
            color: forceWinner === 'tiger' ? '#ffffff' : '#ff9d26',
            border: forceWinner === 'tiger' ? '1.5px solid #ff9d26' : '1px solid rgba(255,157,38,0.3)',
            boxShadow: forceWinner === 'tiger' ? '0 0 12px rgba(239,68,68,0.7)' : 'none',
          }}
        >
          🐯 TIGER {forceWinner === 'tiger' && '✓'}
        </button>

        {/* Dragon button */}
        <button
          onClick={() => handleSetWinner('dragon')}
          className="px-3 py-1 rounded-full font-body font-black text-[12px] tracking-wide transition-all select-none cursor-pointer"
          style={{
            background: forceWinner === 'dragon' ? 'linear-gradient(180deg,#3b82f6,#1d4ed8)' : 'rgba(255,255,255,0.08)',
            color: forceWinner === 'dragon' ? '#ffffff' : '#60a5fa',
            border: forceWinner === 'dragon' ? '1.5px solid #60a5fa' : '1px solid rgba(96,165,250,0.3)',
            boxShadow: forceWinner === 'dragon' ? '0 0 12px rgba(59,130,246,0.7)' : 'none',
          }}
        >
          🐲 DRAGON {forceWinner === 'dragon' && '✓'}
        </button>

        {/* Tie button */}
        <button
          onClick={() => handleSetWinner('tie')}
          className="px-3 py-1 rounded-full font-body font-black text-[12px] tracking-wide transition-all select-none cursor-pointer"
          style={{
            background: forceWinner === 'tie' ? 'linear-gradient(180deg,#22c55e,#15803d)' : 'rgba(255,255,255,0.08)',
            color: forceWinner === 'tie' ? '#ffffff' : '#4ade80',
            border: forceWinner === 'tie' ? '1.5px solid #4ade80' : '1px solid rgba(74,222,128,0.3)',
            boxShadow: forceWinner === 'tie' ? '0 0 12px rgba(34,197,94,0.7)' : 'none',
          }}
        >
          🤝 TIE {forceWinner === 'tie' && '✓'}
        </button>

        {/* Auto/Random button */}
        <button
          onClick={() => handleSetWinner('random')}
          className="px-3 py-1 rounded-full font-body font-black text-[12px] tracking-wide transition-all select-none cursor-pointer"
          style={{
            background: forceWinner === 'random' ? 'linear-gradient(180deg,#eab308,#a16207)' : 'rgba(255,255,255,0.08)',
            color: forceWinner === 'random' ? '#ffffff' : '#facc15',
            border: forceWinner === 'random' ? '1.5px solid #facc15' : '1px solid rgba(250,204,21,0.3)',
            boxShadow: forceWinner === 'random' ? '0 0 12px rgba(234,179,8,0.7)' : 'none',
          }}
        >
          🎲 AUTO {forceWinner === 'random' && '✓'}
        </button>

        {/* Divider */}
        <div className="w-[1.5px] h-5 bg-white/20 mx-1" />

        {/* Guide Toggle button */}
        <button
          onClick={() => setShow((v) => !v)}
          className="px-3 py-1 rounded-full font-body font-black text-[12px] tracking-wide transition-all select-none cursor-pointer"
          style={{
            background: show ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
            color: show ? '#ffd84a' : 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          🔢 {show ? 'GUIDE ON' : 'GUIDE OFF'}
        </button>
      </div>

      {/* Number Overlays */}
      {show && (
        <div className="absolute inset-0 pointer-events-none z-[120] select-none">
          {GUIDE_ZONES.map((zone) => {
            const isSmall = zone.small;
            return (
              <React.Fragment key={zone.id}>
                {/* Dotted target box border */}
                <div
                  className="absolute pointer-events-none rounded-md"
                  style={{
                    left: zone.x,
                    top: zone.y,
                    width: zone.w,
                    height: zone.h,
                    border: `1.5px dashed ${zone.color}`,
                    background: `${zone.color}22`,
                    boxShadow: `0 0 6px ${zone.color}66`,
                  }}
                />

                {/* Number Badge Pin */}
                <div
                  className="absolute flex flex-col items-center justify-center pointer-events-none"
                  style={{
                    left: zone.bx,
                    top: zone.by,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div
                    className="flex items-center justify-center font-body font-black rounded-full"
                    style={{
                      width: zone.sz,
                      height: zone.sz,
                      background: 'radial-gradient(circle at 35% 30%, #fff700, #ff8800)',
                      color: '#000000',
                      fontSize: isSmall ? 12 : zone.sz > 38 ? 20 : 15,
                      border: '2px solid #ffffff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.9), 0 0 10px rgba(255,200,0,0.9)',
                      lineHeight: 1,
                    }}
                  >
                    {zone.id}
                  </div>
                  {!isSmall && (
                    <div
                      className="mt-0.5 px-2 py-0.5 rounded font-body font-extrabold text-[10.5px] whitespace-nowrap text-white"
                      style={{
                        background: 'rgba(0, 0, 0, 0.85)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        textShadow: '0 1px 2px #000',
                      }}
                    >
                      #{zone.id} {zone.label}
                    </div>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </>
  );
}
