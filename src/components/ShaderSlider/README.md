# Shader Slider

`ShaderSlider` is a React carousel that renders image transitions through a small WebGL layer. React owns the state, pointer and keyboard input, accessible DOM, and fallback images; the canvas only composites pixels.

It targets React 19 and uses `clsx` plus `tailwind-merge`. Use
`tailwind-merge@2.6.0` with Tailwind CSS 3.4 or `tailwind-merge@^3.3.1` with
Tailwind CSS 4. The common component source has no `next/*` dependency.

For a Next.js App Router client graph, import from `./client`. That entry starts
with `'use client'` and re-exports the same React core. Keep callbacks and
consumer-owned `ReactNode` composition inside a Client Component; pass only
serializable slide data across a Server Component boundary.

## Composition

```tsx
<ShaderSliderRoot slides={slides} effect="wave" aria-label="Campaign images">
  <ShaderSliderViewport className="aspect-video">
    {slides.map((slide, index) => (
      <ShaderSliderSlide key={slide.src} index={index}>
        {/* Consumer-owned overlay content */}
      </ShaderSliderSlide>
    ))}
  </ShaderSliderViewport>
  <ShaderSliderPrevious>Previous</ShaderSliderPrevious>
  <ShaderSliderNext>Next</ShaderSliderNext>
  <ShaderSliderPagination />
  <ShaderSliderStatus />
</ShaderSliderRoot>
```

## Root props

- `slides`: image sources and accessible alternative text. `fit` can be `cover` (default) or `contain`; remote textures can set `crossOrigin`.
- `value`, `defaultValue`, `onValueChange`: controlled or uncontrolled index state.
- `effect`: `wave`, `ripple`, or `pixel`.
- `transitionDuration`, `intensity`, `frequency`, `dprCap`: bounded rendering controls.
- `loop`, `dragThreshold`, `disabled`: interaction controls.

The viewport supports horizontal pointer gestures, `ArrowLeft`, `ArrowRight`, `Home`, and `End`. WebGL initialization, texture loading, or context loss automatically falls back to DOM image transitions. `prefers-reduced-motion` skips the animated shader transition.
