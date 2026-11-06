export type Pitch = { hz: number; confidence: number; rms: number };

/** YIN: cumulative mean normalized difference with parabolic lag interpolation. */
export function detectPitch(input: Float32Array, sampleRate: number): Pitch | null {
  let mean = 0;
  for (const value of input) mean += value;
  mean /= input.length;
  let energy = 0;
  for (const value of input) energy += (value - mean) ** 2;
  const rms = Math.sqrt(energy / input.length);
  if (rms < .008) return null;
  const size = Math.floor(input.length / 2);
  const maxLag = Math.min(size - 1, Math.ceil(sampleRate / 65));
  const minLag = Math.max(2, Math.floor(sampleRate / 1100));
  const difference = new Float32Array(maxLag + 1);
  const normalized = new Float32Array(maxLag + 1);
  let sum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let value = 0;
    for (let i = 0; i < size; i++) value += (input[i] - input[i + lag]) ** 2;
    difference[lag] = value;
    sum += value;
    normalized[lag] = sum === 0 ? 1 : value * lag / sum;
  }
  for (let lag = minLag; lag < maxLag; lag++) {
    if (normalized[lag] >= .12) continue;
    while (lag + 1 < maxLag && normalized[lag + 1] < normalized[lag]) lag++;
    const confidence = 1 - normalized[lag];
    if (confidence < .9) return null;
    const left = normalized[lag - 1], middle = normalized[lag], right = normalized[lag + 1];
    const denominator = 2 * (2 * middle - right - left);
    const adjustment = denominator ? (right - left) / denominator : 0;
    const hz = sampleRate / (lag + adjustment);
    return hz >= 65 && hz <= 1100 ? { hz, confidence, rms } : null;
  }
  return null;
}
