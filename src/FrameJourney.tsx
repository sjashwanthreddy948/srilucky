import { useEffect, useRef } from "react";
import { samplePose } from "./motion";
import FrameArtwork from "./FrameArtwork";

const clamp = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const PHOTO = {
  width: 1586,
  height: 992,
  x: 1082.5,
  y: 310,
  frameWidth: 405,
  frameHeight: 180,
};

/** The original photo pixels lift from a repaired photo, then gain crisp material detail. */
export default function FrameJourney() {
  const frame = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const portrait = document.querySelector<SVGSVGElement>(".hero-portrait")!;
    const content = document.querySelector<HTMLElement>(".hero-content")!;
    const shade = document.querySelector<HTMLElement>(".hero-shade")!;
    const hero = document.getElementById("home")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = media.matches,
      anchors: number[] = [],
      end = 1,
      max = 1;
    let px = 0,
      py = 0,
      imageScale = 1,
      width = 0,
      height = 0;
    let backingWidth = 1024;
    let raf = 0,
      previous = 0,
      current = scrollY,
      dirty = true;
    const measure = () => {
      width = innerWidth;
      height = innerHeight;
      // Render the SVG above its on-screen size to keep transformed rims sharp.
      // Dimensions change only on resize, never during the scroll animation.
      backingWidth = Math.min(2560, Math.max(1024, width * 1.4));
      if (frame.current) {
        frame.current.style.width = `${backingWidth}px`;
        frame.current.style.height = `${(backingWidth * PHOTO.frameHeight) / PHOTO.frameWidth}px`;
      }
      imageScale = Math.max(width / PHOTO.width, height / PHOTO.height);
      const offsetX =
        (width - PHOTO.width * imageScale) * (width < 700 ? 0.76 : 0.6);
      px = offsetX + PHOTO.x * imageScale;
      py = PHOTO.y * imageScale;
      portrait.style.width = `${PHOTO.width * imageScale}px`;
      portrait.style.height = `${PHOTO.height * imageScale}px`;
      portrait.style.left = `${offsetX}px`;
      portrait.style.transformOrigin = `${PHOTO.x * imageScale}px ${PHOTO.y * imageScale}px`;
      end = Math.max(1, hero.offsetHeight - height);
      max = Math.max(1, document.documentElement.scrollHeight - height);
      anchors = Array.from(
        document.querySelectorAll<HTMLElement>("[data-scene]"),
      ).map((el, i) =>
        i === 0
          ? end
          : Math.min(max, el.offsetTop + el.offsetHeight / 2 - height / 2),
      );
      host.current?.setAttribute("data-reduced", String(reduced));
      dirty = true;
    };
    const changed = () => {
      dirty = true;
    };
    const motionChanged = () => {
      reduced = media.matches;
      measure();
    };
    const observer = new ResizeObserver(measure);
    observer.observe(document.querySelector("main")!);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", changed, { passive: true });
    media.addEventListener("change", motionChanged);
    measure();
    const render = (time: number) => {
      raf = requestAnimationFrame(render);
      if (document.hidden) {
        previous = time;
        return;
      }
      const dt = Math.min(50, time - previous || 16);
      previous = time;
      current = reduced
        ? scrollY
        : current + (scrollY - current) * (1 - Math.exp(-dt / 70));
      if (
        !dirty &&
        Math.abs(scrollY - current) < 0.05 &&
        (reduced || current < end)
      )
        return;
      const opening = clamp(current / end),
        focus = ease(opening / 0.45);
      const pull = reduced ? 0 : ease((opening - 0.2) / 0.43);
      const zoom = reduced ? 1 : 1 + focus * (width < 700 ? 0.7 : 0.9);
      const panX = reduced ? 0 : (width / 2 - px) * focus;
      const panY = reduced ? 0 : (height * 0.48 - py) * focus;
      // The face recedes while the ORIGINAL rims move toward the viewer.
      const backgroundZoom = zoom * (1 - pull * 0.24);
      const backgroundFade = reduced ? 0 : ease((opening - 0.7) / 0.28);
      portrait.style.transform = `translate3d(${panX}px,${panY + pull * 45}px,0) scale(${backgroundZoom})`;
      portrait.style.opacity = String((1 - pull * 0.25) * (1 - backgroundFade));
      portrait.style.setProperty("--photo-repair", String(ease(pull / 0.1)));
      content.style.opacity = String(reduced ? 1 : 1 - ease(opening / 0.22));
      content.style.transform = reduced
        ? "none"
        : `translate3d(0,${-focus * 35}px,0)`;
      content.style.pointerEvents =
        opening > 0.25 && !reduced ? "none" : "auto";
      shade.style.opacity = String(1 - ease(opening / 0.25));
      let x = px + panX,
        y = py + panY - pull * height * 0.065;
      let fw = PHOTO.frameWidth * imageScale * zoom * (1 + pull * 0.42),
        fh = (fw * PHOTO.frameHeight) / PHOTO.frameWidth;
      let rx = pull * 3,
        ry = pull * -6,
        rz = 0,
        opacity = 1;
      const base = width * (width < 700 ? 0.94 : 0.58);
      if (current >= end) {
        const p = samplePose(anchors, current, width < 700);
        x = width * (0.5 + p.x);
        y = height * (0.5 + p.y);
        fw = base * p.scale;
        fh = (fw * PHOTO.frameHeight) / PHOTO.frameWidth;
        rx = p.rx * 24;
        ry = p.ry * 25;
        rz = p.rz * 57.3;
        y +=
          Math.sin(time * 0.00065) * 3 * ease((current - end) / (height * 0.4));
      } else {
        const settle = ease((opening - 0.72) / 0.28),
          p = samplePose(anchors, end, width < 700);
        x += (width * (0.5 + p.x) - x) * settle;
        y += (height * (0.5 + p.y) - y) * settle;
        fw += (base * p.scale - fw) * settle;
        fh = (fw * PHOTO.frameHeight) / PHOTO.frameWidth;
        rx += (p.rx * 24 - rx) * settle;
        ry += (p.ry * 25 - ry) * settle;
        rz = p.rz * 57.3 * settle;
      }
      // Material enhancement starts only once the original photographic rims have separated.
      const detail = reduced ? 1 : ease((opening - 0.44) / 0.3);
      const reflection = reduced ? 0.22 : 0.06 + pull * 0.26 + detail * 0.06;
      if (reduced) {
        x = width / 2;
        y = height * 0.55;
        fw = base * 0.78;
        fh = (fw * PHOTO.frameHeight) / PHOTO.frameWidth;
        rx = 0;
        ry = 0;
        rz = 0;
        opacity = current > height * 0.8 ? 1 : 0;
      }
      if (frame.current) {
        frame.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${fw / backingWidth},${fh / ((backingWidth * PHOTO.frameHeight) / PHOTO.frameWidth)})`;
        frame.current.style.opacity = String(opacity);
        frame.current.style.setProperty("--frame-detail", String(detail));
        frame.current.style.setProperty("--lens-strength", String(reflection));
        frame.current.style.setProperty(
          "--lens-shift",
          `${pull * 17 + Math.sin(ry * 0.035) * 10}px`,
        );
        frame.current.style.setProperty("--depth-shadow", `${pull * 14}px`);
      }
      // With reduced motion the hero keeps its complete unmasked photo.
      portrait
        .querySelector("image:last-child")
        ?.setAttribute("mask", reduced ? "none" : "url(#hero-rim-removal)");
      document.documentElement.style.setProperty(
        "--journey-progress",
        String(clamp(scrollY / max)),
      );
      let chapter = 0;
      anchors.forEach((a, i) => {
        if (scrollY >= a) chapter = i;
      });
      document.documentElement.dataset.chapter = String(chapter);
      host.current?.setAttribute("data-progress", String(clamp(scrollY / max)));
      host.current?.setAttribute("data-detach", String(pull));
      host.current?.setAttribute("data-material", String(detail));
      dirty = false;
    };
    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", changed);
      media.removeEventListener("change", motionChanged);
    };
  }, []);
  return (
    <div
      ref={host}
      className="frame-journey"
      aria-hidden="true"
      data-renderer="photo-depth"
    >
      <div ref={frame} className="frame-render">
        <FrameArtwork />
      </div>
    </div>
  );
}
