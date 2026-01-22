
export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 800;
export const CAR_WIDTH = 50;
export const CAR_HEIGHT = 80;
export const ROAD_SPEED_BASE = 5;
export const MAX_HEALTH = 100;
export const GOAL_PROGRESS = 10000; // Distance to reach "Success"

export const OBSTACLES = [
  { label: 'سستی', color: '#ef4444', impact: -15 }, // Laziness
  { label: 'جھوٹ', color: '#f87171', impact: -20 }, // Lying
  { label: 'غصہ', color: '#dc2626', impact: -10 }, // Anger
  { label: 'لالچ', color: '#b91c1c', impact: -25 }, // Greed
  { label: 'غرور', color: '#991b1b', impact: -30 }, // Pride
];

export const POWERUPS = [
  { label: 'محنت', color: '#22c55e', impact: 10 }, // Hard Work
  { label: 'سچائی', color: '#4ade80', impact: 15 }, // Honesty
  { label: 'علم', color: '#10b981', impact: 20 }, // Knowledge
  { label: 'صبر', color: '#34d399', impact: 12 }, // Patience
  { label: 'ہمت', color: '#059669', impact: 18 }, // Courage
];

export const MOTIVATIONAL_QUOTES = [
  "کوشش جاری رکھیں! منزل قریب ہے۔",
  "علم بہترین دولت ہے۔",
  "سچائی میں ہی نجات ہے۔",
  "محنت کبھی رائیگاں نہیں جاتی۔",
  "ہمت نہ ہاریں، اللہ آپ کے ساتھ ہے۔",
  "کامیابی کے لیے مستقل مزاجی ضروری ہے۔",
  "زندگی ایک دوڑ ہے، اسے اخلاق کے ساتھ جیتیں۔"
];

export const SUCCESS_MESSAGES = [
  "مبارک ہو! آپ نے کامیابی حاصل کر لی۔",
  "آپ کی محنت رنگ لے آئی!",
  "زندگی کی اس دوڑ میں آپ فاتح ٹھہرے۔"
];
