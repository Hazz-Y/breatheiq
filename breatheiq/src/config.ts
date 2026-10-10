export const APP = {
  name: 'BreatheIQ',
  tagline: 'Breathe easier between stations.',
  lead: 'Live cabin-air monitoring for Indian Railways coaches. A Random-Forest model reads the sensors, the train switches on its fan and purifiers, and the people most at risk get told first.',
  track: 'TRACK 01 · AIR · IOT-10',
  trainId: 'DEMO-12',
  instrumentedCoach: 7,
  coachCount: 12,
  repoNote: 'Prototype: Arduino Mega 2560 + DHT11 + MQ-2 + MQ-135 + PMS7003 + Random Forest (scikit-learn).',
} as const
