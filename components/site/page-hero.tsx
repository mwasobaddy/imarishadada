import type { ReactNode } from "react";

import Noise from "@/components/ui/noise";
import { Container } from "@/components/site/container";

/**
 * Shared masthead for interior pages.
 *
 * ## Why the background changed
 *
 * This used to be the Magic UI `WarpBackground` — a CSS 3D grid of beams
 * racing towards a vanishing point. It was removed for two reasons.
 *
 * **It read as a technology dashboard.** A perspective grid with beams is the
 * visual grammar of a SaaS product and of a conference keynote. It is not the
 * grammar of a girl-led organisation in Kibera, and the project rules are
 * explicit about not emitting the "AI template" look.
 *
 * **It cost JavaScript on every interior page.** It was a client component
 * driving `motion/react` transforms purely for decoration. On metered mobile
 * data that is real bytes spent on nothing.
 *
 * The replacement is React Bits `Noise` — a grain texture, the kind printed
 * paper has.
 *
 * React Bits **Pro** was considered first and is the better catalogue, but it
 * is a paid product whose source is only available behind an authenticated
 * account, so it cannot be installed or vendored here. In the free registry,
 * the impressive backgrounds — `LightRays`, `Threads`, `Silk`, `Waves`,
 * `Particles`, `SoftAurora` — are all WebGL now, and the project rules forbid
 * WebGL on mobile. `Noise` is the one background that is neither, and it is
 * the one that suits a human-rights charity. It reads as handmade rather than generated, and it costs a single
 * canvas paint:
 *
 *   * `fps={0}` disables the animation loop entirely. The grain is painted
 *     once and left still. The default is 24fps, which is a `requestAnimationFrame`
 *     loop redrawing the texture forever — fine for a demo, wrong for a page
 *     masthead on a metered connection.
 *   * No WebGL, no `three.js`, no canvas animation. A 2D canvas is used once,
 *     to render a tile that is then repeated as a CSS background.
 *
 * The colour underneath is a warm brand wash rather than the old grid. The
 * brand rules ask for "warm natural palette, texture not gradients-everywhere"
 * — the grain is the texture, and the wash is there to carry the colour.
 *
 * The effect is decorative and sits behind `aria-hidden` content separation
 * via `pointer-events-none`; all copy remains server-rendered text.
 */
export function PageHero({
  eyebrow,
  heading,
  body,
  children,
}: {
  eyebrow?: string | null;
  heading: string;
  body?: string | null;
  children?: ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-surface-lilac">
      {/* Warm brand wash. Three soft pools rather than a linear gradient, so
          the field has depth without banding on large displays. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_15%_0%,var(--color-surface-pink)_0%,transparent_60%),radial-gradient(50%_70%_at_85%_20%,var(--color-brand-50)_0%,transparent_65%)]"
      />

      {/* Grain. `fps={0}` paints it once and stops — see the note above.

          The values matter more than they look. `soft-light` on a pale lilac
          ground is almost mathematically incapable of producing a visible
          change, and at 0.09 opacity nothing registers at all — the layer was
          rendering and being invisible.

          `multiply` is the right blend for a light surface: it darkens
          slightly where the grain is dense, which is how paper actually
          behaves. `overlay` would also work but pushes much harder, and at
          the strength this needs it reads as television static rather than
          as texture. */}
      <Noise
        aria-hidden="true"
        opacity={0.12}
        size={1.3}
        fps={0}
        blendMode="multiply"
        contrast={0.2}
        colored={false}
        dust={0.06}
        scratches={0}
        scanlines={0}
        flicker={0}
        className="pointer-events-none absolute inset-0"
      />

      <Container className="relative flex min-h-[380px] flex-col justify-center py-16 sm:min-h-[440px] sm:py-24">
        <div className="max-w-3xl">
          {eyebrow ? (
            <p className="mb-3 text-sm font-medium tracking-wide text-brand-600 uppercase">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-4xl font-semibold tracking-tight text-brand-600 sm:text-5xl">
            {heading}
          </h1>

          {body ? <p className="measure mt-5 text-lg text-ink-muted">{body}</p> : null}

          {children ? <div className="mt-8">{children}</div> : null}
        </div>
      </Container>
    </section>
  );
}
