/* eslint-disable no-unused-vars -- Base ESLint treats TypeScript interface parameter names as runtime bindings. */
import type {
  ShaderSliderDirection,
  ShaderSliderEffect,
  ShaderSliderFit,
  ShaderSliderImage,
} from "./shader-slider-types";

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

interface TextureRecord {
  texture: WebGLTexture;
  width: number;
  height: number;
  fit: ShaderSliderFit;
}

interface ProgramLocations {
  position: number;
  fromTexture: WebGLUniformLocation;
  toTexture: WebGLUniformLocation;
  progress: WebGLUniformLocation;
  direction: WebGLUniformLocation;
  effect: WebGLUniformLocation;
  intensity: WebGLUniformLocation;
  frequency: WebGLUniformLocation;
  resolution: WebGLUniformLocation;
  fromScale: WebGLUniformLocation;
  toScale: WebGLUniformLocation;
  fromContain: WebGLUniformLocation;
  toContain: WebGLUniformLocation;
  background: WebGLUniformLocation;
}

export interface ShaderSliderFrameOptions {
  direction: ShaderSliderDirection;
  effect: ShaderSliderEffect;
  intensity: number;
  frequency: number;
}

export interface ShaderSliderRenderer {
  prepare(images: readonly ShaderSliderImage[]): Promise<void>;
  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    dprCap: number,
  ): boolean;
  draw(index: number): boolean;
  drawTransition(
    fromIndex: number,
    toIndex: number,
    progress: number,
    options: ShaderSliderFrameOptions,
  ): boolean;
  destroy(): void;
}

export interface ShaderSliderCanvasMetrics {
  width: number;
  height: number;
  pixelRatio: number;
}

const VERTEX_SHADER_WEBGL_1 = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const VERTEX_SHADER_WEBGL_2 = `#version 300 es
in vec2 aPosition;
out vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

function getFragmentShaderSource(isWebGL2: boolean) {
  const version = isWebGL2 ? "#version 300 es\n" : "";
  const varying = isWebGL2 ? "in vec2 vUv;" : "varying vec2 vUv;";
  const outputDeclaration = isWebGL2 ? "out vec4 fragmentColor;" : "";
  const textureSample = isWebGL2 ? "texture" : "texture2D";
  const output = isWebGL2
    ? "fragmentColor = mix(fromColor, toColor, blend);"
    : "gl_FragColor = mix(fromColor, toColor, blend);";

  return `${version}precision mediump float;

${varying}
${outputDeclaration}

uniform sampler2D uFromTexture;
uniform sampler2D uToTexture;
uniform float uProgress;
uniform float uDirection;
uniform float uEffect;
uniform float uIntensity;
uniform float uFrequency;
uniform vec2 uResolution;
uniform vec2 uFromScale;
uniform vec2 uToScale;
uniform float uFromContain;
uniform float uToContain;
uniform vec4 uBackground;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

float random2d(vec2 value) {
  return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

float insideUnitSquare(vec2 uv) {
  return step(0.0, uv.x) * step(uv.x, 1.0) *
    step(0.0, uv.y) * step(uv.y, 1.0);
}

vec4 readImage(
  sampler2D imageTexture,
  vec2 screenUv,
  vec2 scale,
  float contain
) {
  vec2 imageUv = (screenUv - 0.5) * scale + 0.5;
  float mask = mix(1.0, insideUnitSquare(imageUv), contain);
  vec4 color = ${textureSample}(imageTexture, clamp(imageUv, 0.001, 0.999));
  return mix(uBackground, color, mask);
}

void main() {
  float progress = clamp(uProgress, 0.0, 1.0);
  float easedProgress = progress * progress * (3.0 - 2.0 * progress);
  float envelope = 4.0 * progress * (1.0 - progress);
  float safeIntensity = clamp(uIntensity, 0.0, 2.0);
  vec2 fromUv = vUv;
  vec2 toUv = vUv;
  float blend = easedProgress;

  if (uEffect < 0.5) {
    float wave = sin(
      (vUv.y * max(uFrequency, 0.5) + progress * uDirection * 1.5) *
        TWO_PI
    );
    vec2 offset = vec2(
      wave * 0.035 * safeIntensity * envelope * uDirection,
      0.0
    );
    fromUv += offset * progress;
    toUv -= offset * (1.0 - progress);
    blend = clamp(easedProgress + wave * 0.035 * envelope, 0.0, 1.0);
  } else if (uEffect < 1.5) {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centered = (vUv - 0.5) * vec2(aspect, 1.0);
    float radius = length(centered);
    vec2 radial = normalize(centered + vec2(0.0001)) / vec2(aspect, 1.0);
    float ripple = sin(radius * 38.0 - progress * 11.0 * uDirection) *
      0.02 * safeIntensity * envelope;
    fromUv += radial * ripple * progress;
    toUv -= radial * ripple * (1.0 - progress);
  } else {
    float pixelAmount = clamp(envelope * safeIntensity, 0.0, 1.0);
    float columns = mix(220.0, 30.0, pixelAmount);
    vec2 grid = vec2(
      columns,
      max(2.0, columns * uResolution.y / max(uResolution.x, 1.0))
    );
    vec2 pixelUv = (floor(vUv * grid) + 0.5) / grid;
    fromUv = mix(vUv, pixelUv, pixelAmount * 0.92);
    toUv = fromUv;
    float threshold = random2d(floor(vUv * grid * 0.45));
    blend = smoothstep(threshold - 0.12, threshold + 0.12, progress);
  }

  vec4 fromColor = readImage(
    uFromTexture,
    fromUv,
    uFromScale,
    uFromContain
  );
  vec4 toColor = readImage(
    uToTexture,
    toUv,
    uToScale,
    uToContain
  );
  ${output}
}
`;
}

const QUAD_VERTICES = new Float32Array([
  -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
]);

const EFFECT_VALUES: Record<ShaderSliderEffect, number> = {
  wave: 0,
  ripple: 1,
  pixel: 2,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function getShaderSliderUvScale(
  viewportWidth: number,
  viewportHeight: number,
  imageWidth: number,
  imageHeight: number,
  fit: ShaderSliderFit,
): readonly [number, number] {
  if (
    viewportWidth <= 0 ||
    viewportHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return [1, 1];
  }

  const relativeAspect =
    imageWidth / imageHeight / (viewportWidth / viewportHeight);
  if (fit === "contain") {
    return relativeAspect > 1 ? [1, relativeAspect] : [1 / relativeAspect, 1];
  }

  return relativeAspect > 1 ? [1 / relativeAspect, 1] : [1, relativeAspect];
}

export function getShaderSliderCanvasMetrics(
  cssWidth: number,
  cssHeight: number,
  devicePixelRatio: number,
  dprCap: number,
  maxWidth = Number.POSITIVE_INFINITY,
  maxHeight = Number.POSITIVE_INFINITY,
): ShaderSliderCanvasMetrics {
  const safeWidth = Math.max(0, cssWidth);
  const safeHeight = Math.max(0, cssHeight);
  const requestedPixelRatio = clamp(
    Number.isFinite(devicePixelRatio) ? devicePixelRatio : 1,
    1,
    Math.max(1, dprCap),
  );
  const widthLimit = safeWidth > 0 ? maxWidth / safeWidth : 1;
  const heightLimit = safeHeight > 0 ? maxHeight / safeHeight : 1;
  const pixelRatio = Math.max(
    0.1,
    Math.min(requestedPixelRatio, widthLimit, heightLimit),
  );

  return {
    width: Math.round(safeWidth * pixelRatio),
    height: Math.round(safeHeight * pixelRatio),
    pixelRatio,
  };
}

function compileShader(gl: GLContext, shaderType: number, source: string) {
  const shader = gl.createShader(shaderType);
  if (!shader) throw new Error("Unable to create a WebGL shader.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: GLContext, isWebGL2: boolean) {
  const vertexShader = compileShader(
    gl,
    gl.VERTEX_SHADER,
    isWebGL2 ? VERTEX_SHADER_WEBGL_2 : VERTEX_SHADER_WEBGL_1,
  );
  let fragmentShader: WebGLShader;
  try {
    fragmentShader = compileShader(
      gl,
      gl.FRAGMENT_SHADER,
      getFragmentShaderSource(isWebGL2),
    );
  } catch (error) {
    gl.deleteShader(vertexShader);
    throw error;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Unable to create a WebGL program.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) ?? "Shader linking failed.";
    gl.deleteProgram(program);
    throw new Error(message);
  }
  return program;
}

function requireUniform(gl: GLContext, program: WebGLProgram, name: string) {
  const location = gl.getUniformLocation(program, name);
  if (!location) throw new Error(`Missing WebGL uniform: ${name}`);
  return location;
}

function getLocations(gl: GLContext, program: WebGLProgram): ProgramLocations {
  const position = gl.getAttribLocation(program, "aPosition");
  if (position < 0) throw new Error("Missing WebGL position attribute.");

  return {
    position,
    fromTexture: requireUniform(gl, program, "uFromTexture"),
    toTexture: requireUniform(gl, program, "uToTexture"),
    progress: requireUniform(gl, program, "uProgress"),
    direction: requireUniform(gl, program, "uDirection"),
    effect: requireUniform(gl, program, "uEffect"),
    intensity: requireUniform(gl, program, "uIntensity"),
    frequency: requireUniform(gl, program, "uFrequency"),
    resolution: requireUniform(gl, program, "uResolution"),
    fromScale: requireUniform(gl, program, "uFromScale"),
    toScale: requireUniform(gl, program, "uToScale"),
    fromContain: requireUniform(gl, program, "uFromContain"),
    toContain: requireUniform(gl, program, "uToContain"),
    background: requireUniform(gl, program, "uBackground"),
  };
}

class WebGLShaderSliderRenderer implements ShaderSliderRenderer {
  private readonly gl: GLContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly locations: ProgramLocations;
  private readonly maxTextureSize: number;
  private readonly maxViewportWidth: number;
  private readonly maxViewportHeight: number;
  private readonly textureInternalFormat: number;
  private textures: TextureRecord[] = [];
  private pendingLoadCancellations = new Set<() => void>();
  private preparationEpoch = 0;
  private cssWidth = 0;
  private cssHeight = 0;
  private destroyed = false;

  constructor(canvas: HTMLCanvasElement, gl: GLContext, isWebGL2: boolean) {
    this.canvas = canvas;
    this.gl = gl;
    this.program = createProgram(gl, isWebGL2);
    try {
      this.locations = getLocations(gl, this.program);
    } catch (error) {
      gl.deleteProgram(this.program);
      throw error;
    }
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error("Unable to create a WebGL vertex buffer.");
    }
    this.buffer = buffer;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxViewport = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    this.maxViewportWidth = maxViewport[0] ?? this.maxTextureSize;
    this.maxViewportHeight = maxViewport[1] ?? this.maxTextureSize;
    this.textureInternalFormat = isWebGL2
      ? (gl as WebGL2RenderingContext).RGBA8
      : gl.RGBA;

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.clearColor(0.02, 0.025, 0.035, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, QUAD_VERTICES, gl.STATIC_DRAW);
  }

  private cancelPendingLoads() {
    for (const cancel of this.pendingLoadCancellations) cancel();
    this.pendingLoadCancellations.clear();
  }

  private loadImage(source: ShaderSliderImage) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      let settled = false;

      const finish = (
        callback: (value: HTMLImageElement) => void,
        value: HTMLImageElement,
      ) => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        this.pendingLoadCancellations.delete(cancel);
        callback(value);
      };
      const cancel = () => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        reject(new Error("Image loading was cancelled."));
      };

      image.decoding = "async";
      if (source.crossOrigin !== null) {
        image.crossOrigin = source.crossOrigin ?? "anonymous";
      }
      image.onload = () => finish(resolve, image);
      image.onerror = () => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        this.pendingLoadCancellations.delete(cancel);
        reject(new Error(`Unable to load slider image: ${source.src}`));
      };
      this.pendingLoadCancellations.add(cancel);
      image.src = source.src;

      if (image.complete && image.naturalWidth > 0) {
        queueMicrotask(() => finish(resolve, image));
      }
    });
  }

  private uploadTexture(
    image: HTMLImageElement,
    source: ShaderSliderImage,
  ): TextureRecord {
    if (
      image.naturalWidth > this.maxTextureSize ||
      image.naturalHeight > this.maxTextureSize
    ) {
      throw new Error("Slider image exceeds the GPU texture size limit.");
    }

    const { gl } = this;
    const texture = gl.createTexture();
    if (!texture) throw new Error("Unable to create a WebGL texture.");

    try {
      for (let attempt = 0; attempt < 8; attempt += 1) {
        if (gl.getError() === gl.NO_ERROR) break;
      }
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const bindingError = gl.getError();
      if (bindingError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture binding failed with code ${bindingError}.`,
        );
      }
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const parameterError = gl.getError();
      if (parameterError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture parameters failed with code ${parameterError}.`,
        );
      }
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        this.textureInternalFormat,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      const uploadError = gl.getError();
      if (uploadError !== gl.NO_ERROR) {
        throw new Error(
          `WebGL texture upload failed with code ${uploadError}.`,
        );
      }
    } catch (error) {
      gl.deleteTexture(texture);
      throw error;
    }

    return {
      texture,
      width: image.naturalWidth,
      height: image.naturalHeight,
      fit: source.fit ?? "cover",
    };
  }

  async prepare(images: readonly ShaderSliderImage[]) {
    const epoch = ++this.preparationEpoch;
    this.cancelPendingLoads();

    let loadedImages: HTMLImageElement[];
    try {
      loadedImages = await Promise.all(
        images.map((image) => this.loadImage(image)),
      );
    } catch (error) {
      this.cancelPendingLoads();
      throw error;
    }

    if (this.destroyed || epoch !== this.preparationEpoch) {
      throw new Error("Slider image preparation was superseded.");
    }

    const nextTextures: TextureRecord[] = [];
    try {
      for (let index = 0; index < loadedImages.length; index += 1) {
        const image = loadedImages[index];
        const source = images[index];
        if (!image || !source) continue;
        nextTextures.push(this.uploadTexture(image, source));
      }
    } catch (error) {
      for (const record of nextTextures) this.gl.deleteTexture(record.texture);
      throw error;
    }

    if (nextTextures.length !== images.length) {
      for (const record of nextTextures) this.gl.deleteTexture(record.texture);
      throw new Error("Not all slider textures could be prepared.");
    }

    for (const record of this.textures) this.gl.deleteTexture(record.texture);
    this.textures = nextTextures;
  }

  resize(
    cssWidth: number,
    cssHeight: number,
    devicePixelRatio: number,
    dprCap: number,
  ) {
    this.cssWidth = Math.max(0, cssWidth);
    this.cssHeight = Math.max(0, cssHeight);
    if (this.cssWidth === 0 || this.cssHeight === 0) return false;

    const metrics = getShaderSliderCanvasMetrics(
      this.cssWidth,
      this.cssHeight,
      devicePixelRatio,
      dprCap,
      this.maxViewportWidth,
      this.maxViewportHeight,
    );
    if (
      this.canvas.width !== metrics.width ||
      this.canvas.height !== metrics.height
    ) {
      this.canvas.width = metrics.width;
      this.canvas.height = metrics.height;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    return true;
  }

  draw(index: number) {
    return this.drawTransition(index, index, 0, {
      direction: 1,
      effect: "wave",
      intensity: 0,
      frequency: 3,
    });
  }

  drawTransition(
    fromIndex: number,
    toIndex: number,
    progress: number,
    options: ShaderSliderFrameOptions,
  ) {
    if (
      this.destroyed ||
      this.cssWidth === 0 ||
      this.cssHeight === 0 ||
      this.gl.isContextLost?.()
    ) {
      return false;
    }

    const from = this.textures[fromIndex];
    const to = this.textures[toIndex];
    if (!from || !to) return false;

    const { gl, locations } = this;
    const fromScale = getShaderSliderUvScale(
      this.cssWidth,
      this.cssHeight,
      from.width,
      from.height,
      from.fit,
    );
    const toScale = getShaderSliderUvScale(
      this.cssWidth,
      this.cssHeight,
      to.width,
      to.height,
      to.fit,
    );

    gl.useProgram(this.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, from.texture);
    gl.uniform1i(locations.fromTexture, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, to.texture);
    gl.uniform1i(locations.toTexture, 1);

    gl.uniform1f(locations.progress, clamp(progress, 0, 1));
    gl.uniform1f(locations.direction, options.direction);
    gl.uniform1f(locations.effect, EFFECT_VALUES[options.effect]);
    gl.uniform1f(locations.intensity, clamp(options.intensity, 0, 2));
    gl.uniform1f(locations.frequency, clamp(options.frequency, 0.5, 12));
    gl.uniform2f(locations.resolution, this.canvas.width, this.canvas.height);
    gl.uniform2f(locations.fromScale, fromScale[0], fromScale[1]);
    gl.uniform2f(locations.toScale, toScale[0], toScale[1]);
    gl.uniform1f(locations.fromContain, from.fit === "contain" ? 1 : 0);
    gl.uniform1f(locations.toContain, to.fit === "contain" ? 1 : 0);
    gl.uniform4f(locations.background, 0.02, 0.025, 0.035, 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.preparationEpoch += 1;
    this.cancelPendingLoads();

    if (!this.gl.isContextLost?.()) {
      for (const record of this.textures) {
        this.gl.deleteTexture(record.texture);
      }
      this.gl.deleteBuffer(this.buffer);
      this.gl.deleteProgram(this.program);
    }
    this.textures = [];
  }
}

export function createShaderSliderRenderer(
  canvas: HTMLCanvasElement,
): ShaderSliderRenderer | null {
  const attributes: WebGLContextAttributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  };

  let gl: GLContext | null = null;
  let isWebGL2 = false;
  try {
    gl = canvas.getContext("webgl2", attributes);
    isWebGL2 = gl !== null;
    if (!gl) gl = canvas.getContext("webgl", attributes);
  } catch {
    return null;
  }
  if (!gl) return null;

  try {
    return new WebGLShaderSliderRenderer(canvas, gl, isWebGL2);
  } catch {
    return null;
  }
}
