const TAU = Math.PI * 2;
const BOUNDARY_PADDING = 0.018;
const DEFAULT_DEPTH_LAYER_COUNT = 5;
const MAX_DEPTH_LAYER_COUNT = 6;
const DEPTH_TRAVEL = 0.11;
const NOZZLE_POSITIONS = [-0.52, 0, 0.52] as const;

export interface LottoPhysicsBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  phase: number;
  depthLayer: number;
  depth: number;
  depthAnchor: number;
  depthVelocity: number;
}

export interface CreateLottoPhysicsBodiesOptions {
  count: number;
  ballRadius: number;
  seed?: number;
  depthLayerCount?: number;
}

export interface StepLottoPhysicsOptions {
  deltaTime: number;
  elapsedTime: number;
  mixing: boolean;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothStep(minimum: number, maximum: number, value: number) {
  const normalized = clamp((value - minimum) / (maximum - minimum), 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

export function normalizeLottoDepthLayerCount(value?: number) {
  if (!Number.isFinite(value)) return DEFAULT_DEPTH_LAYER_COUNT;
  return clamp(
    Math.floor(value ?? DEFAULT_DEPTH_LAYER_COUNT),
    1,
    MAX_DEPTH_LAYER_COUNT,
  );
}

function getDepthAnchor(layer: number, layerCount: number) {
  if (layerCount <= 1) return 0;
  return -0.72 + (layer / (layerCount - 1)) * 1.44;
}

export function getLottoPhysicsPresentation(body: LottoPhysicsBody) {
  const normalizedDepth = clamp((body.depth + 1) / 2, 0, 1);

  return {
    scale: 0.78 + normalizedDepth * 0.3,
    opacity: 0.72 + normalizedDepth * 0.28,
    zIndex: 20 + Math.round(normalizedDepth * 60),
  };
}

function getEffectiveRadius(body: LottoPhysicsBody) {
  const normalizedDepth = clamp((body.depth + 1) / 2, 0, 1);
  return body.radius * (0.78 + normalizedDepth * 0.3);
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function clampBodyToBoundary(body: LottoPhysicsBody, restitution: number) {
  const maximumDistance = 1 - getEffectiveRadius(body) - BOUNDARY_PADDING;
  const distance = Math.hypot(body.x, body.y);
  if (distance <= maximumDistance || distance === 0) return;

  const normalX = body.x / distance;
  const normalY = body.y / distance;
  body.x = normalX * maximumDistance;
  body.y = normalY * maximumDistance;

  const outwardVelocity = body.vx * normalX + body.vy * normalY;
  if (outwardVelocity > 0) {
    body.vx -= (1 + restitution) * outwardVelocity * normalX;
    body.vy -= (1 + restitution) * outwardVelocity * normalY;
    body.angularVelocity += (body.vx * normalY - body.vy * normalX) * 18;
  }
}

function resolveBodyCollisions(
  bodies: LottoPhysicsBody[],
  restitution: number,
) {
  for (let firstIndex = 0; firstIndex < bodies.length; firstIndex += 1) {
    const first = bodies[firstIndex];

    for (
      let secondIndex = firstIndex + 1;
      secondIndex < bodies.length;
      secondIndex += 1
    ) {
      const second = bodies[secondIndex];
      if (first.depthLayer !== second.depthLayer) continue;

      let differenceX = second.x - first.x;
      let differenceY = second.y - first.y;
      let distance = Math.hypot(differenceX, differenceY);
      const minimumDistance =
        getEffectiveRadius(first) + getEffectiveRadius(second);

      if (distance >= minimumDistance) continue;

      if (distance < 0.0001) {
        const fallbackAngle =
          ((firstIndex * 17 + secondIndex * 29) % 360) * (Math.PI / 180);
        differenceX = Math.cos(fallbackAngle) * 0.0001;
        differenceY = Math.sin(fallbackAngle) * 0.0001;
        distance = 0.0001;
      }

      const normalX = differenceX / distance;
      const normalY = differenceY / distance;
      const overlap = minimumDistance - distance;
      const correction = overlap * 0.5 + 0.0002;

      first.x -= normalX * correction;
      first.y -= normalY * correction;
      second.x += normalX * correction;
      second.y += normalY * correction;

      const relativeVelocityX = second.vx - first.vx;
      const relativeVelocityY = second.vy - first.vy;
      const normalVelocity =
        relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (normalVelocity < 0) {
        const impulse = (-(1 + restitution) * normalVelocity) / 2;
        first.vx -= impulse * normalX;
        first.vy -= impulse * normalY;
        second.vx += impulse * normalX;
        second.vy += impulse * normalY;

        const tangentX = -normalY;
        const tangentY = normalX;
        const tangentVelocity =
          relativeVelocityX * tangentX + relativeVelocityY * tangentY;
        first.angularVelocity -= tangentVelocity * 8;
        second.angularVelocity += tangentVelocity * 8;
      }
    }
  }
}

export function createLottoPhysicsBodies({
  count,
  ballRadius,
  seed = 2_026,
  depthLayerCount,
}: CreateLottoPhysicsBodiesOptions): LottoPhysicsBody[] {
  const normalizedCount = Math.max(0, Math.floor(count));
  const normalizedRadius = clamp(ballRadius, 0.035, 0.13);
  const normalizedLayerCount = normalizeLottoDepthLayerCount(depthLayerCount);
  const random = createSeededRandom(seed);
  const layerOffset = Math.floor(random() * normalizedLayerCount);
  const columns = Math.max(5, Math.ceil(Math.sqrt(normalizedCount * 1.4)));
  const rows = Math.max(1, Math.ceil(normalizedCount / columns));
  const horizontalStep = 1.44 / Math.max(1, columns - 0.5);
  const verticalStep = Math.min(
    normalizedRadius * 2.04,
    1 / Math.max(1, rows - 1),
  );

  return Array.from({ length: normalizedCount }, (_, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const stagger = (row % 2) * 0.5;
    const x = -0.72 + (column + stagger) * horizontalStep;
    const y = 0.66 - row * verticalStep;
    const depthLayer = (index + layerOffset) % normalizedLayerCount;
    const depthAnchor = getDepthAnchor(depthLayer, normalizedLayerCount);
    const body: LottoPhysicsBody = {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: normalizedRadius,
      rotation: random() * 360,
      angularVelocity: (random() - 0.5) * 40,
      phase: random() * TAU,
      depthLayer,
      depth: depthAnchor + (random() - 0.5) * 0.04,
      depthAnchor,
      depthVelocity: (random() - 0.5) * 0.08,
    };

    clampBodyToBoundary(body, 0);
    return body;
  });
}

export function kickLottoPhysicsBodies(
  bodies: LottoPhysicsBody[],
  seed = 2_026,
) {
  const random = createSeededRandom(seed);

  bodies.forEach((body, index) => {
    body.vx += (random() - 0.5) * 1.1;
    body.vy -= 0.25 + random() * 0.75 + (index % 4) * 0.04;
    body.depthVelocity += (random() - 0.5) * 0.3;
    body.angularVelocity += (random() - 0.5) * 180;
    body.phase = (body.phase + random() * TAU) % TAU;
  });
}

export function stepLottoPhysicsBodies(
  bodies: LottoPhysicsBody[],
  { deltaTime, elapsedTime, mixing }: StepLottoPhysicsOptions,
) {
  const timeStep = clamp(deltaTime, 0, 1 / 30);
  if (timeStep === 0) return;

  const gravity = mixing ? 2.2 : 3.15;
  const damping = Math.exp(-(mixing ? 0.26 : 1.35) * timeStep);
  const angularDamping = Math.exp(-(mixing ? 0.28 : 1.7) * timeStep);
  const depthDamping = Math.exp(-(mixing ? 1.15 : 2.4) * timeStep);
  const maximumSpeed = mixing ? 4.2 : 2.6;
  const wallRestitution = mixing ? 0.68 : 0.34;
  const ballRestitution = mixing ? 0.58 : 0.24;

  bodies.forEach((body, index) => {
    let accelerationX = 0;
    let accelerationY = gravity;

    if (mixing) {
      const lowerChamberInfluence = smoothStep(-0.18, 0.86, body.y);
      const liftWave =
        0.7 +
        ((Math.sin(elapsedTime * (2.45 + (index % 5) * 0.08) + body.phase) +
          1) /
          2) *
          0.3;
      const nozzleX =
        NOZZLE_POSITIONS[(index + body.depthLayer) % NOZZLE_POSITIONS.length];
      const nozzleDistance = body.x - nozzleX;
      const nozzleInfluence =
        0.46 + 0.54 * Math.exp(-(nozzleDistance * nozzleDistance) / 0.1);
      const sustainedLift = (6.2 + liftWave * 3.2) * nozzleInfluence;
      const circulationDirection = body.depthLayer % 2 === 0 ? 1 : -1;
      const circulation =
        (0.62 +
          Math.sin(elapsedTime * 1.35 + body.phase + body.depthLayer) * 0.22) *
        circulationDirection;

      accelerationY -= lowerChamberInfluence * sustainedLift;
      accelerationX +=
        (nozzleX - body.x) * lowerChamberInfluence * 1.9 -
        body.y * circulation +
        Math.sin(elapsedTime * 4.7 + body.phase * 1.6) * 0.9;
      accelerationY +=
        body.x * circulation * 0.35 +
        Math.cos(elapsedTime * 3.9 + body.phase * 1.3) * 0.22;

      const planarSpeed = Math.hypot(body.vx, body.vy);
      if (lowerChamberInfluence > 0.45 && planarSpeed < 0.55) {
        accelerationY -= (0.55 - planarSpeed) * lowerChamberInfluence * 3.8;
      }
    }

    body.vx = (body.vx + accelerationX * timeStep) * damping;
    body.vy = (body.vy + accelerationY * timeStep) * damping;

    const speed = Math.hypot(body.vx, body.vy);
    if (speed > maximumSpeed) {
      const scale = maximumSpeed / speed;
      body.vx *= scale;
      body.vy *= scale;
    }

    body.x += body.vx * timeStep;
    body.y += body.vy * timeStep;
    const depthAcceleration =
      (body.depthAnchor - body.depth) * 4.2 +
      (mixing
        ? Math.sin(
            elapsedTime * 1.7 + body.phase * 1.25 + body.depthLayer * 0.8,
          ) * 0.34
        : 0);
    body.depthVelocity =
      (body.depthVelocity + depthAcceleration * timeStep) * depthDamping;
    body.depth += body.depthVelocity * timeStep;

    const minimumDepth = body.depthAnchor - DEPTH_TRAVEL;
    const maximumDepth = body.depthAnchor + DEPTH_TRAVEL;
    if (body.depth < minimumDepth || body.depth > maximumDepth) {
      body.depth = clamp(body.depth, minimumDepth, maximumDepth);
      body.depthVelocity *= -0.45;
    }

    body.angularVelocity =
      (body.angularVelocity + body.vx * 22 * timeStep) * angularDamping;
    body.rotation += body.angularVelocity * timeStep;
    clampBodyToBoundary(body, wallRestitution);
  });

  resolveBodyCollisions(bodies, ballRestitution);
  resolveBodyCollisions(bodies, ballRestitution);
  bodies.forEach((body) => clampBodyToBoundary(body, wallRestitution));
}

export function isLottoPhysicsBodyFinite(body: LottoPhysicsBody) {
  return [
    body.x,
    body.y,
    body.vx,
    body.vy,
    body.radius,
    body.rotation,
    body.angularVelocity,
    body.phase,
    body.depthLayer,
    body.depth,
    body.depthAnchor,
    body.depthVelocity,
  ].every(Number.isFinite);
}
