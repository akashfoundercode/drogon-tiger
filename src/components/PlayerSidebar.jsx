import React from 'react';
import Avatar from './Avatar.jsx';
import { useGame } from '../game/GameContext.jsx';
import { formatINR } from '../game/format.js';

const SIDE_COLOR = { dragon: '#3b9cff', tie: '#2ee66a', tiger: '#ff6a1a' };

export default function PlayerSidebar({ side }) {
  const { state } = useGame();
  const bots = state.bots.filter((b) => b.sidebar === side).slice(0, 3);

  return (
    <div
      data-sidebar={side}
      className="absolute flex flex-col items-center justify-center gap-3 pointer-events-none select-none"
      style={{
        [side]: 68,
        top: 276,
        width: 156,
        background: 'transparent',
        zIndex: 15,
      }}
    >
      {bots.map((b, i) => {
        const active = state.activeBots[b.id];
        return (
          <div key={b.id} className="flex flex-col items-center justify-center w-full">
            <div data-player={b.id}>
              <Avatar a={b.avatar} size={58} crown={i === 0} ring={active ? SIDE_COLOR[active] : undefined}>
                <span
                  className="absolute right-0 bottom-0.5 rounded-full"
                  style={{
                    width: 11,
                    height: 11,
                    background: active ? SIDE_COLOR[active] : '#22c55e',
                    border: '1.5px solid #1a0a1f',
                    boxShadow: active ? `0 0 8px ${SIDE_COLOR[active]}` : '0 0 5px #22c55e',
                  }}
                />
              </Avatar>
            </div>
            <div className="mt-1 text-[12px] font-body font-semibold text-white/95 leading-none tracking-tight truncate max-w-[125px] text-center">
              {b.name}
            </div>
            <div
              className="mt-1 rounded-full px-2.5 py-[2px] text-[12.5px] font-body font-extrabold text-[#ffe9a0] leading-none text-center"
              style={{ background: 'rgba(0,0,0,.65)', border: '1px solid rgba(245,197,66,.4)' }}
            >
              {formatINR(b.balance)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
