const TAU = Math.PI * 2;
const BOUNDARY_PADDING = 0.018;

export interface LottoPhysicsBody {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  phase: number;
}

export interface CreateLottoPhysicsBodiesOptions {
  count: number;
  ballRadius: number;
  seed?: number;
}

export interface StepLottoPhysicsOptions {
  deltaTime: number;
  elapsedTime: number;
  mixing: boolean;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function clampBodyToBoundary(body: LottoPhysicsBody, restitution: number) {
  const maximumDistance = 1 - body.radius - BOUNDARY_PADDING;
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
      let differenceX = second.x - first.x;
      let differenceY = second.y - first.y;
      let distance = Math.hypot(differenceX, differenceY);
      const minimumDistance = first.radius + second.radius;

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
}: CreateLottoPhysicsBodiesOptions): LottoPhysicsBody[] {
  const normalizedCount = Math.max(0, Math.floor(count));
  const normalizedRadius = clamp(ballRadius, 0.035, 0.13);
  const random = createSeededRandom(seed);
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
    const body: LottoPhysicsBody = {
      x,
      y,
      vx: 0,
      vy: 0,
      radius: normalizedRadius,
      rotation: random() * 360,
      angularVelocity: (random() - 0.5) * 40,
      phase: random() * TAU,
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
    body.vx += (random() - 0.5) * 1.8;
    body.vy -= 0.45 + random() * 1.35 + (index % 4) * 0.08;
    body.angularVelocity += (random() - 0.5) * 260;
    body.phase = (body.phase + random() * TAU) % TAU;
  });
}

export function stepLottoPhysicsBodies(
  bodies: LottoPhysicsBody[],
  { deltaTime, elapsedTime, mixing }: StepLottoPhysicsOptions,
) {
  const timeStep = clamp(deltaTime, 0, 1 / 30);
  if (timeStep === 0) return;

  const gravity = mixing ? 2.35 : 3.15;
  const damping = Math.exp(-(mixing ? 0.2 : 1.35) * timeStep);
  const angularDamping = Math.exp(-(mixing ? 0.28 : 1.7) * timeStep);
  const maximumSpeed = mixing ? 4.8 : 2.6;
  const wallRestitution = mixing ? 0.72 : 0.34;
  const ballRestitution = mixing ? 0.64 : 0.24;

  bodies.forEach((body, index) => {
    let accelerationX = 0;
    let accelerationY = gravity;

    if (mixing) {
      const jetCycle =
        (elapsedTime * 0.82 + body.phase / TAU + (index % 5) * 0.07) % 1;
      const jetPulse = jetCycle < 0.32 ? Math.pow(1 - jetCycle / 0.32, 1.7) : 0;
      const lowerChamberInfluence = clamp((body.y + 0.2) / 1.05, 0.12, 1);
      const nozzleDirection = Math.sin(elapsedTime * 2.7 + body.phase * 1.9);

      accelerationY -= jetPulse * lowerChamberInfluence * 8.4;
      accelerationX +=
        nozzleDirection * jetPulse * 3.2 +
        Math.sin(elapsedTime * 5.1 + body.phase + index * 0.37) * 0.75;
      accelerationY += Math.cos(elapsedTime * 4.3 + body.phase * 1.4) * 0.32;
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
  ].every(Number.isFinite);
}
