
export const LANE_WIDTH = 3;
export const LANE_X = [-LANE_WIDTH, 0, LANE_WIDTH];
export const ROAD_SPEED_BASE = 0.5;
export const MAX_HEALTH = 100;
export const GOAL_PROGRESS = 20000;

// Added missing constants for 2D Canvas fallback
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 1000;
export const CAR_WIDTH = 100;
export const CAR_HEIGHT = 180;

export const BAD_ITEMS = [
  { label: 'جھوٹ', color: '#ff3333' },
  { label: 'سستی', color: '#ff3333' },
  { label: 'غصہ', color: '#ff3333' },
  { label: 'چوری', color: '#ff3333' },
];

export const GOOD_ITEMS = [
  { label: 'سچائی', color: '#33ff88' },
  { label: 'محنت', color: '#33ff88' },
  { label: 'ادب', color: '#33ff88' },
  { label: 'نماز', color: '#33ff88' },
];

export const MOTIVATIONAL_QUOTE = "گرنا برا نہیں، گرے رہنا برا ہے۔ دوبارہ کوشش کریں!";

export const ASSETS = {
  CAR_IMAGE: 'https://i.imgur.com/7XpL2kR.png' // Fallback or reference
};