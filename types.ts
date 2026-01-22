
export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  SUCCESS = 'SUCCESS'
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: 'obstacle' | 'powerup';
  color: string;
  speed: number;
}

export interface GameState {
  score: number;
  health: number;
  progress: number;
  speed: number;
  status: GameStatus;
  lastQuote: string;
}

export interface Position {
  x: number;
  y: number;
}
