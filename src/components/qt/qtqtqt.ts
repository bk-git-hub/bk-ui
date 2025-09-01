export const calculateTransforms = (score: number, size: number) => {
  const absScore = Math.abs(score);

  // Define animation weights
  const xWeightRegion1 = size * 0.55;
  const xWeightRegion2 = size * 0.2;
  const scaleWeightRegion1 = -0.2;
  const scaleWeightRegion2 = -0.05;

  // Calculate translateX
  let translateX: number;
  if (score < -1) translateX = -xWeightRegion1 + xWeightRegion2 * (score + 1);
  else if (score < 1) translateX = score * xWeightRegion1;
  else translateX = xWeightRegion1 + xWeightRegion2 * (score - 1);

  // Calculate rotateY
  let rotateY: number;
  if (score < -1) rotateY = 40;
  else if (score < 1) rotateY = score * -40;
  else rotateY = -40;

  // Calculate translateZ for depth
  const translateZ = -absScore * 150;

  // Calculate scale
  let scale: number;
  if (absScore < 1) scale = 1 - absScore * 0.1;
  else scale = 1 + scaleWeightRegion1 + scaleWeightRegion2 * (absScore - 1);

  return { translateX, rotateY, translateZ, scale };
};
