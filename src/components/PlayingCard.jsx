import React from 'react';
import { motion } from 'framer-motion';
import { RANK_LABELS } from '../game/cards.js';

function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-[9px] overflow-hidden"
      style={{
        backfaceVisibility: 'hidden',
        background: 'linear-gradient(145deg,#7f1d1d,#3b0a12)',
        border: '2.5px solid #f5c542',
        boxShadow: 'inset 0 0 0 1.5px #7a4c06, inset 0 0 14px rgba(0,0,0,.6)',
      }}
    >
      <div
        className="absolute inset-[5px] rounded-md"
        style={{
          border: '1.5px solid rgba(245,197,66,.7)',
          background:
            'repeating-linear-gradient(45deg, rgba(245,197,66,.16) 0 5px, transparent 5px 10px), repeating-linear-gradient(-45deg, rgba(245,197,66,.16) 0 5px, transparent 5px 10px)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-9 h-9 rotate-45 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#fff1a8,#d9a21b)', border: '2px solid #7a4c06', boxShadow: '0 0 10px #f5c542aa' }}
        >
          <span className="-rotate-45 font-display font-black text-[13px] text-[#5c1010]">DT</span>
        </div>
      </div>
    </div>
  );
}

function CardFront({ card }) {
  if (!card) return null;
  const suitName =
    (typeof card.suit === 'object' ? card.suit.name || card.suit.key : card.suit) || 'spades';
  const rank = card.rank || 1;
  const suitOffsets = { spades: 1, diamonds: 2, clubs: 3, hearts: 4 };
  const sOff = suitOffsets[String(suitName).toLowerCase()] || 1;
  const k = rank === 1 ? 12 : rank - 2;
  const cardNum = card.card_number || k * 4 + sOff;
  const cardImgSrc = card.image || `/cards/${cardNum}.png`;

  return (
    <div
      className="absolute inset-0 rounded-[9px] overflow-hidden bg-white shadow-xl flex items-center justify-center select-none"
      style={{
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        border: '1.5px solid #d4af37',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      <img
        src={cardImgSrc}
        alt={card.name || `Card ${cardNum}`}
        className="w-full h-full object-fill pointer-events-none select-none rounded-[7px]"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `/cards/${cardNum}.png`;
        }}
      />
    </div>
  );
}

export default function PlayingCard({ card, faceUp, highlight, charging, loser, tag }) {
  // NOTE: opacity/filter must live on an outer wrapper – on a preserve-3d element they flatten
  // the 3D context and break backface-visibility (the card would stay face-down).
  return (
    <motion.div
      className="relative"
      style={{ width: 80, height: 114 }}
      animate={{ opacity: loser ? 0.7 : 1, scale: highlight ? 1.1 : loser ? 0.94 : 1 }}
      transition={{ scale: { type: 'spring', stiffness: 260, damping: 16 }, opacity: { duration: 0.4 } }}
    >
      {tag && (
        <div
          className="absolute -top-4.5 left-1/2 -translate-x-1/2 text-[10.5px] font-display font-extrabold tracking-[0.2em] whitespace-nowrap"
          style={{ color: tag.color, textShadow: '0 0 8px ' + tag.color }}
        >
          {tag.text}
        </div>
      )}
      <div className="relative w-full h-full" style={{ perspective: 900 }}>
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: faceUp ? 180 : 0, y: charging && !faceUp ? [0, -8, 0] : 0 }}
          transition={{
            rotateY: { duration: 0.7, ease: [0.3, 0.9, 0.3, 1] },
            y: charging ? { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 },
          }}
        >
          <CardBack />
          <CardFront card={card} />
        </motion.div>
        <div
          className="absolute inset-0 rounded-[10px] pointer-events-none"
          style={{
            boxShadow: highlight
              ? '0 0 36px 8px rgba(255,214,90,.9), 0 12px 24px rgba(0,0,0,.6)'
              : charging
                ? '0 0 22px 4px rgba(255,214,90,.5), 0 10px 20px rgba(0,0,0,.6)'
                : '0 10px 20px rgba(0,0,0,.6)',
            transition: 'box-shadow .4s',
            zIndex: -1,
          }}
        />
      </div>
    </motion.div>
  );
}
