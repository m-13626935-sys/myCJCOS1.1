import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useLightField } from '../hooks/useLightField';

const TicTacToeApp: React.FC = () => {
  const { t } = useLanguage();
  const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [status, setStatus] = useState('');
  const lightFieldRef = useLightField<HTMLDivElement>();

  const playerXEmoji = '❌';
  const playerOEmoji = '⭕';

  const calculateWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  useEffect(() => {
    const winner = calculateWinner(board);
    if (winner) {
      const winnerEmoji = winner === 'X' ? playerXEmoji : playerOEmoji;
      setStatus(t('ttt_winner', { player: winnerEmoji }));
    } else if (board.every(Boolean)) {
      setStatus(t('ttt_draw'));
    } else {
      const nextPlayer = xIsNext ? playerXEmoji : playerOEmoji;
      setStatus(t('ttt_player_turn', { player: nextPlayer }));
    }
  }, [board, xIsNext, t, playerOEmoji, playerXEmoji]);

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i]) {
      return;
    }
    const newBoard = board.slice();
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  const renderSquare = (i: number) => {
    const value = board[i];
    const displayValue = value === 'X' ? playerXEmoji : value === 'O' ? playerOEmoji : '';
    return (
      <button
        className="light-field-button w-full h-full text-5xl font-bold flex items-center justify-center text-outline"
        onClick={() => handleClick(i)}
        aria-label={`Square ${i + 1}`}
      >
        {displayValue}
      </button>
    );
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-2 text-outline select-none">
      <div className="mb-4 text-xl font-semibold">{status}</div>
      <div
        ref={lightFieldRef}
        className="w-full max-w-[300px] aspect-square grid grid-cols-3 grid-rows-3 gap-2 light-field-container rounded-2xl"
      >
        {Array(9).fill(null).map((_, i) => (
            <div key={i}>{renderSquare(i)}</div>
        ))}
      </div>
      <button
        onClick={resetGame}
        className="mt-6 px-6 py-3 bg-black/20 dark:bg-white/20 text-outline rounded-xl ring-1 ring-inset ring-white/30 dark:ring-black/30 shadow-lg hover:bg-black/30 dark:hover:bg-white/30 active:shadow-inner active:scale-95 transition-all duration-150"
      >
        {t('ttt_reset_game')}
      </button>
    </div>
  );
};

export default TicTacToeApp;
