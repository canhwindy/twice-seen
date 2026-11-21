// The campaign: four scenes visited twice, each visit with more changes, subtler changes and
// less time. After the eighth level the hunt goes on as an endless run at full subtlety.
import reef from './scenes/reef.js';
import rooftops from './scenes/rooftops.js';
import glasshouse from './scenes/glasshouse.js';
import harbor from './scenes/harbor.js';

export const SCENES = [reef, rooftops, glasshouse, harbor];

const CAMPAIGN = [
  { scene: reef, count: 5, subtle: 0.12, time: 100 },
  { scene: rooftops, count: 6, subtle: 0.25, time: 100 },
  { scene: glasshouse, count: 6, subtle: 0.38, time: 95 },
  { scene: harbor, count: 7, subtle: 0.5, time: 95 },
  { scene: reef, count: 7, subtle: 0.6, time: 90 },
  { scene: rooftops, count: 8, subtle: 0.7, time: 90 },
  { scene: glasshouse, count: 8, subtle: 0.8, time: 85 },
  { scene: harbor, count: 9, subtle: 0.88, time: 85 },
];

export const CAMPAIGN_LENGTH = CAMPAIGN.length;

export function levelPlan(index) {
  if (index < CAMPAIGN.length) return { index, ...CAMPAIGN[index], endless: false };
  const scene = SCENES[index % SCENES.length];
  return { index, scene, count: 9, subtle: 0.92, time: Math.max(60, 80 - (index - CAMPAIGN.length) * 3), endless: true };
}

export function tierName(subtle) {
  if (subtle < 0.3) return 'Gentle';
  if (subtle < 0.55) return 'Keen';
  if (subtle < 0.8) return 'Sharp';
  return 'Hawkeye';
}
