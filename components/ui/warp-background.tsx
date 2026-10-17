"use client"

import React, { useCallback, useMemo, type HTMLAttributes } from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Optional. Upstream required it and always rendered a `.relative` content
   * wrapper; this lets the component be used as a pure background layer with
   * no children, which is how PageHero consumes it.
   */
  children?: React.ReactNode
  perspective?: number
  beamsPerSide?: number
  beamSize?: number
  beamDelayMax?: number
  beamDelayMin?: number
  beamDuration?: number
  gridColor?: string
  /** Force-disable the animation regardless of the user's OS setting. */
  reduced?: boolean
}

/**
 * Beam hues are fixed to the Imarisha Dada analogous purple/pink band.
 *
 * Upstream picks `Math.floor(Math.random() * 360)`, which is wrong twice over:
 * it renders as an arbitrary rainbow that ignores the brand, and calling it
 * during SSR means the server and client disagree — a hydration mismatch.
 * These are the measured brand hues: #5B2A86 (272), #7B45B5 (300), #C71F6E (332),
 * plus the gold accent #F5B82E (42) used sparingly for one beam.
 */
const HUES = [272, 300, 332, 286, 316, 42]

/** Aspect ratios vary the beam silhouette so the grid does not read as stripes. */
const ASPECTS = [3, 5, 7, 4, 6, 8]

/**
 * Deterministic delay in [beamDelayMin, beamDelayMax] for a given side/index.
 *
 * Replaces upstream `Math.random()` in `generateBeams`, which has the same
 * SSR/client divergence problem: React would warn and patch the DOM on every
 * mount. A tiny hash keeps the animation varied but reproducible.
 */
function seededDelay(seed: number, min: number, max: number): number {
  const h = Math.sin(seed * 12.9898) * 43758.5453
  return min + (h - Math.floor(h)) * (max - min)
}

const Beam = ({
  width,
  x,
  delay,
  duration,
  index,
  reduced,
}: {
  width: string | number
  x: string | number
  delay: number
  duration: number
  /** Position within the side, used to deterministically pick hue and aspect. */
  index: number
  /**
   * Honour prefers-reduced-motion by rendering the beam parked out of view
   * instead of animating. The warp is decorative, so removing it loses no
   * information — and per doc/roadmap frontend rules, motion must never be the
   * only thing happening anyway.
   */
  reduced: boolean
}) => {
  const hue = HUES[index % HUES.length]
  const ar = ASPECTS[index % ASPECTS.length]

  return (
    <motion.div
      style={
        {
          "--x": `${x}`,
          "--width": `${width}`,
          "--aspect-ratio": `${ar}`,
          "--background": `linear-gradient(hsl(${hue} 80% 60%), transparent)`,
        } as React.CSSProperties
      }
      className={`absolute top-0 left-(--x) aspect-[1/var(--aspect-ratio)] w-(--width) [background:var(--background)]`}
      initial={{ y: "100cqmax", x: "-50%" }}
      animate={reduced ? undefined : { y: "-100%", x: "-50%" }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  )
}

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className,
  beamsPerSide = 3,
  beamSize = 5,
  beamDelayMax = 3,
  beamDelayMin = 0,
  beamDuration = 3,
  gridColor = "var(--border)",
  /** Force-disable the animation regardless of the user's OS setting. */
  reduced: forceReduced = false,
  ...props
}) => {
  const generateBeams = useCallback(
    (seed: number) => {
      const beams = []
      const cellsPerSide = Math.floor(100 / beamSize)
      const step = cellsPerSide / beamsPerSide

      for (let i = 0; i < beamsPerSide; i++) {
        const x = Math.floor(i * step)
        const delay = seededDelay(seed * 100 + i, beamDelayMin, beamDelayMax)
        beams.push({ x, delay })
      }
      return beams
    },
    [beamsPerSide, beamSize, beamDelayMax, beamDelayMin],
  )

  // Respect the OS-level motion preference unless explicitly overridden.
  const prefersReduced = useReducedMotion()
  const reduced = forceReduced || prefersReduced === true

  // A distinct seed per side, otherwise all four walls emit identical beams
  // and the effect reads as one repeating pattern rather than a warp.
  const topBeams = useMemo(() => generateBeams(1), [generateBeams])
  const rightBeams = useMemo(() => generateBeams(2), [generateBeams])
  const bottomBeams = useMemo(() => generateBeams(3), [generateBeams])
  const leftBeams = useMemo(() => generateBeams(4), [generateBeams])

  return (
    <div className={cn("relative rounded border p-20", className)} {...props}>
      <div
        style={
          {
            "--perspective": `${perspective}px`,
            "--grid-color": gridColor,
            "--beam-size": `${beamSize}%`,
          } as React.CSSProperties
        }
        className={
          "@container-[size] pointer-events-none absolute top-0 left-0 size-full overflow-hidden [clipPath:inset(0)] perspective-(--perspective) transform-3d"
        }
      >
        {/* top side */}
        <div className="@container absolute z-20 h-[100cqmax] w-[100cqi] origin-[50%_0%] transform-[rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
          {topBeams.map((beam, index) => (
            <Beam
              key={`top-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              index={index}
              reduced={reduced}
            />
          ))}
        </div>
        {/* bottom side */}
        <div className="@container absolute top-full h-[100cqmax] w-[100cqi] origin-[50%_0%] transform-[rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
          {bottomBeams.map((beam, index) => (
            <Beam
              key={`bottom-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              index={index}
              reduced={reduced}
            />
          ))}
        </div>
        {/* left side */}
        <div className="@container absolute top-0 left-0 h-[100cqmax] w-[100cqh] origin-[0%_0%] transform-[rotate(90deg)_rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
          {leftBeams.map((beam, index) => (
            <Beam
              key={`left-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              index={index}
              reduced={reduced}
            />
          ))}
        </div>
        {/* right side */}
        <div className="@container absolute top-0 right-0 h-[100cqmax] w-[100cqh] origin-[100%_0%] transform-[rotate(-90deg)_rotateX(-90deg)] bg-size-[var(--beam-size)_var(--beam-size)] [background:linear-gradient(var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_-0.5px_/var(--beam-size)_var(--beam-size),linear-gradient(90deg,var(--grid-color)_0_1px,transparent_1px_var(--beam-size))_50%_50%_/var(--beam-size)_var(--beam-size)] transform-3d">
          {rightBeams.map((beam, index) => (
            <Beam
              key={`right-${index}`}
              width={`${beamSize}%`}
              x={`${beam.x * beamSize}%`}
              delay={beam.delay}
              duration={beamDuration}
              index={index}
              reduced={reduced}
            />
          ))}
        </div>
      </div>
      {children ? <div className="relative">{children}</div> : null}
    </div>
  )
}
