// Shared horizontal layout for the driving dashboard.
//
// The speedometer and the battery/motor-temp gauges are absolutely positioned
// in two separate StyleSheet files. Deriving both from one constant keeps them
// moving as a unit: nudge SPEEDOMETER_LEFT and the gauges follow automatically,
// so the speedometer can no longer be moved and leave the gauges behind.
export const SPEEDOMETER_LEFT = 170;

// How far right of the speedometer's left edge the gauges sit so they nest at
// the speedometer's right edge (rather than overlapping the dial).
export const GAUGES_OFFSET = 270;

export const GAUGES_LEFT = SPEEDOMETER_LEFT + GAUGES_OFFSET;
