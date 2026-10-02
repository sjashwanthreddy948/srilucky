import React, { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  X,
  Menu,
  Plus,
  Check,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  LoaderCircle,
} from "lucide-react";
import { api, emptySettings, services, times, type PublicData } from "./api";
import FrameJourney from "./FrameJourney";
import { HeroPortrait } from "./FrameArtwork";
import "./style.css";
import "./portrait.css";
const Admin = lazy(() => import("./Admin"));
function App() {
  const [data, setData] = useState<PublicData>({
    settings: emptySettings,
    services,
    times,
  });
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<"booking" | "info" | null>(null);
  const [info, setInfo] = useState("");
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const load = () => {
    setLoading(true);
    api("/public")
      .then(setData)
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    load();
    const scroll = () => {
      setScrolled(window.scrollY > 60);
      const final = document.getElementById("focus");
      document.documentElement.classList.toggle(
        "on-dark",
        Boolean(final && final.getBoundingClientRect().top < 90),
      );
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => window.removeEventListener("scroll", scroll);
  }, []);
  useEffect(() => {
    if (!data.settings.address) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Optician",
      name: data.settings.business_name,
      address: data.settings.address,
      telephone: data.settings.phone,
      url: location.origin,
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, [data]);
  const message = (text: string) => {
    const n = data.settings.whatsapp.replace(/\D/g, "");
    if (!n) {
      setInfo(
        "Our WhatsApp details are being updated. Please request a visit and the team will call you to confirm.",
      );
      setDialog("info");
      return;
    }
    window.open(
      `https://wa.me/${n}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };
  const whatsapp = () =>
    message(
      `Hi ${data.settings.business_name}, I would like to book an eye test.`,
    );
  const book = () => {
    setMenu(false);
    setDialog("booking");
  };
  const call = () => {
    if (data.settings.phone) location.href = "tel:" + data.settings.phone;
    else {
      setInfo(
        "Our phone details are being updated. You can request a visit here and we’ll contact you.",
      );
      setDialog("info");
    }
  };
  const directions = () => {
    if (data.settings.maps_url)
      window.open(data.settings.maps_url, "_blank", "noopener,noreferrer");
    else {
      setInfo(
        "Store directions are being updated. Request a visit and the team will confirm the address before you arrive.",
      );
      setDialog("info");
    }
  };
  const travel = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };
  const hover = (active: boolean) =>
    window.dispatchEvent(new CustomEvent("frame-hover", { detail: active }));
  if (location.pathname === "/admin")
    return (
      <Suspense
        fallback={<div className="loading-page">Opening your workspace…</div>}
      >
        <Admin />
      </Suspense>
    );
  const bookButton = (label = "BOOK EYE TEST", light = false) => (
    <button
      className={"button " + (light ? "button-white" : "")}
      onClick={book}
      onPointerEnter={() => hover(true)}
      onPointerLeave={() => hover(false)}
      onFocus={() => hover(true)}
      onBlur={() => hover(false)}
    >
      {label}
      <ArrowUpRight size={17} />
    </button>
  );
  return (
    <>
      <a href="#story" className="skip-link">
        Skip to content
      </a>
      <header className={scrolled ? "site-header scrolled" : "site-header"}>
        <a className="brand" href="#home" aria-label="Sri Lucky home">
          <span>
            SRI LUCKY<span className="brand-mark">®</span>
          </span>
          <small>EYE WEAR & CLINIC</small>
        </a>
        <nav aria-label="Main navigation">
          <a href="#home">HOME</a>
          <a href="#vision">VISION</a>
          <a href="#care">CLINIC</a>
          <a href="#about">ABOUT</a>
          <a href="#visit">CONTACT</a>
        </nav>
        <div className="header-actions">
          <button onClick={book} className="header-book">
            BOOK EYE TEST <ArrowUpRight size={15} />
          </button>
          <button
            className="header-whatsapp"
            onClick={whatsapp}
            aria-label="WhatsApp"
          >
            <MessageCircle size={17} />
          </button>
          <button
            className="menu-toggle"
            aria-label="Open navigation"
            onClick={() => setMenu(true)}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>
      <div className="scroll-progress" aria-hidden="true" />
      <FrameJourney />
      <main>
        <section className="scene opening" id="home" data-scene>
          <div className="hero-stage">
            <HeroPortrait />
            <div className="hero-shade" />
            <div className="hero-content">
              <span className="eyebrow">SRI LUCKY / EYE WEAR & CLINIC</span>
              <h1>
                SEE THE WORLD
                <br />
                <span>DIFFERENTLY.</span>
              </h1>
              <p>
                Premium eyewear and personalised eye care
                <br className="desktop-break" /> for clearer vision and
                confident style.
              </p>
              <div className="hero-actions">
                {bookButton()}
                <a className="line-link" href="#story">
                  EXPLORE <ArrowDown size={16} />
                </a>
              </div>
            </div>
            <a className="hero-scroll scroll-explore" href="#story">
              SCROLL TO EXPERIENCE{" "}
              <span>
                <ArrowDown size={16} />
              </span>
            </a>
            <span className="hero-edition micro-label">
              A NEW PERSPECTIVE / 01
            </span>
          </div>
        </section>
        <section className="scene world" id="story" data-scene>
          <div className="scene-top">
            <span>02 / A DIFFERENT POINT OF VIEW</span>
            <span className="chapter-note">VISION BEYOND THE ORDINARY</span>
          </div>
          <div className="scene-copy left">
            <span className="eyebrow">A CLEARER WAY TO SEE</span>
            <h2>
              SEE
              <br />
              <span className="muted-word">CLEARER.</span>
            </h2>
          </div>
          <div className="scene-bottom">
            <p>
              Sri Lucky
              <br />
              Eye Wear & Clinic
            </p>
            <span className="micro-label">A SMALL CHANGE. A NEW OUTLOOK.</span>
          </div>
          <span className="outline-word" aria-hidden="true">
            PERSPECTIVE
          </span>
        </section>
        <section className="scene vision" id="vision" data-scene>
          <div className="scene-top">
            <span>03 / START WITH WHAT MATTERS</span>
            <span className="chapter-note">LOOK AFTER YOUR POINT OF VIEW</span>
          </div>
          <div className="vision-heading">
            <span className="eyebrow">NOTHING IS MORE PERSONAL</span>
            <h2>
              YOUR
              <br />
              VISION
              <br />
              <span className="muted-word">MATTERS.</span>
            </h2>
          </div>
          <div className="vision-ruler" aria-hidden="true">
            <span>01</span>
            <i />
            <span>02</span>
            <i />
            <span>03</span>
          </div>
          <div className="scene-bottom">
            <span className="micro-label">CARE THAT BEGINS WITH YOU.</span>
            <p>
              For the little details.
              <br />
              And the bigger picture.
            </p>
          </div>
        </section>
        <section className="scene care" id="care" data-scene>
          <div className="scene-top">
            <span>04 / ATTENTION TO EVERY DETAIL</span>
            <span className="chapter-note">THE EYE CLINIC</span>
          </div>
          <div className="care-title">
            <span className="eyebrow">PERSONAL. PRECISE. CONSIDERED.</span>
            <h2>
              PRECISION
              <br />
              MEETS CARE.
            </h2>
            <p>Modern eye care designed around your vision.</p>
          </div>
          <div className="care-services">
            {[
              [
                "EYE EXAMINATION",
                "A closer look at your vision, with personal attention to your needs.",
              ],
              [
                "VISION TESTING",
                "Understand your everyday visual needs and discuss the next step.",
              ],
              [
                "CONSULTATION",
                "Time to talk about your vision and the guidance you need.",
              ],
              [
                "CONTACT LENS GUIDANCE",
                "Discuss suitability, comfort and contact lens care with our team.",
              ],
              [
                "SPECTACLE FITTING",
                "Thoughtful adjustments for comfort and a fit that feels right.",
              ],
            ].map(([label, desc], i) => (
              <details key={label} name="clinic-services">
                <summary>
                  <span className="service-index">0{i + 1}</span>
                  {label}
                  <Plus size={15} />
                </summary>
                <p>{desc} Service availability is confirmed when you book.</p>
              </details>
            ))}
          </div>
          <div className="scene-bottom">
            <span className="micro-label">GOOD CARE. A CLEARER TOMORROW.</span>
            <button className="line-link" onClick={book}>
              MAKE TIME FOR YOUR EYES <ArrowUpRight size={16} />
            </button>
          </div>
        </section>
        <section className="scene through" id="clarity" data-scene>
          <div className="scene-top">
            <span>05 / LOOK AT THE POSSIBILITIES</span>
            <span className="chapter-note">SEE BEYOND</span>
          </div>
          <h2 className="through-title">
            <span>SEE</span>
            <span>
              WHAT
              <br />
              MATTERS.
            </span>
          </h2>
          <div className="scene-bottom">
            <p>
              A clearer view.
              <br />
              An everyday difference.
            </p>
            <span className="micro-label">THE WORLD IS WAITING.</span>
          </div>
        </section>
        <section className="scene brand-story" id="about" data-scene>
          <div className="scene-top">
            <span>06 / THE SRI LUCKY PERSPECTIVE</span>
            <span className="chapter-note">BUILT AROUND YOU</span>
          </div>
          <div className="scene-copy left">
            <span className="eyebrow">BECAUSE IT’S PERSONAL</span>
            <h2>
              MORE THAN
              <br />
              <span className="muted-word">EYEWEAR.</span>
            </h2>
          </div>
          <div className="scene-bottom">
            <p>
              A modern approach to vision care,
              <br />
              style and everyday comfort.
            </p>
            <span className="micro-label">SRI LUCKY EYE WEAR & CLINIC</span>
          </div>
        </section>
        <section
          className={
            "scene store " +
            (data.settings.store_image ? "has-store-photo" : "")
          }
          id="store"
          data-scene
        >
          <div className="scene-top">
            <span>07 / IN PERSON. IN FOCUS.</span>
            <span className="chapter-note">THE STORE EXPERIENCE</span>
          </div>
          <div className="store-title">
            <span className="eyebrow">FIND YOUR NEW POINT OF VIEW</span>
            <h2>
              TRY IT.
              <br />
              FEEL IT.
              <br />
              <span className="muted-word">SEE IT.</span>
            </h2>
          </div>
          {data.settings.store_image && (
            <img
              className="actual-store-image"
              src={data.settings.store_image}
              alt={data.settings.business_name + " store"}
              loading="lazy"
            />
          )}
          <div className="store-information">
            <span className="eyebrow">VISIT SRI LUCKY</span>
            <p>
              <MapPin size={15} />
              {data.settings.address ||
                "Address available when your visit is confirmed."}
            </p>
            <p>
              <Clock size={15} />
              {data.settings.hours ||
                "Please contact us to confirm opening hours."}
            </p>
            <button className="line-link" onClick={directions}>
              GET DIRECTIONS <ArrowUpRight size={16} />
            </button>
            <button className="line-link" onClick={book}>
              VISIT OUR STORE <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="scene-bottom">
            <span className="micro-label">
              PERSONAL ATTENTION. A PERFECTLY CONSIDERED FIT.
            </span>
            <span className="micro-label">COME SEE FOR YOURSELF.</span>
          </div>
        </section>
        <section className="scene visit booking-scene" id="visit" data-scene>
          <div className="scene-top">
            <span>08 / YOUR NEXT CLEARER CHAPTER</span>
            <span className="chapter-note">LET’S MAKE TIME</span>
          </div>
          <div className="visit-heading">
            <span className="eyebrow">A MOMENT FOR YOUR VISION</span>
            <h2>
              YOUR VISION.
              <br />
              OUR FOCUS.
            </h2>
          </div>
          <div className="inline-booking">
            <Booking
              inline
              data={data}
              loading={loading}
              loadError={loadError}
              onRetry={() => {
                setLoadError("");
                load();
              }}
              onWhatsApp={message}
            />
          </div>
          <div className="scene-bottom">
            <span className="micro-label">NO RUSH. JUST THE RIGHT CARE.</span>
            <span className="micro-label">WE LOOK FORWARD TO SEEING YOU.</span>
          </div>
        </section>
        <section className="scene final" id="focus" data-scene>
          <div className="scene-top">
            <span>09 / ALWAYS IN FOCUS</span>
            <span className="chapter-note">A CLEARER TOMORROW STARTS HERE</span>
          </div>
          <div className="final-title">
            <span className="eyebrow">SRI LUCKY EYE WEAR & CLINIC</span>
            <h2>
              SEE CLEARER.
              <br />
              <span>LIVE BETTER.</span>
            </h2>
          </div>
          <div className="final-conversion">
            <div className="conversion-actions">
              {bookButton("BOOK AN EYE TEST", true)}
              <button className="line-link" onClick={directions}>
                GET DIRECTIONS <ArrowUpRight size={16} />
              </button>
              <button className="line-link" onClick={whatsapp}>
                WHATSAPP US <MessageCircle size={16} />
              </button>
              <button className="line-link" onClick={call}>
                CALL NOW <Phone size={15} />
              </button>
            </div>
            <p>{data.settings.business_name}</p>
          </div>
          <footer>
            <span>© {new Date().getFullYear()} SRI LUCKY</span>
            <div>
              {data.settings.instagram && (
                <a
                  href={data.settings.instagram}
                  target="_blank"
                  rel="noreferrer"
                >
                  INSTAGRAM <ArrowUpRight size={11} />
                </a>
              )}
              {data.settings.facebook && (
                <a
                  href={data.settings.facebook}
                  target="_blank"
                  rel="noreferrer"
                >
                  FACEBOOK <ArrowUpRight size={11} />
                </a>
              )}
              <button
                onClick={() => {
                  setInfo(
                    "We use your name, phone number and appointment details only to manage and confirm your visit. Contact the store to request correction or deletion. We do not collect payment details.",
                  );
                  setDialog("info");
                }}
              >
                PRIVACY
              </button>
              <a href="/admin">OWNER LOGIN</a>
            </div>
            <button className="back-top" onClick={() => travel("home")}>
              BACK TO TOP <ArrowUp size={13} />
            </button>
          </footer>
        </section>
      </main>
      <div className="journey-index" aria-hidden="true">
        <span>IN FOCUS</span>
        <div>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} className={"chapter-dot chapter-" + i} />
          ))}
        </div>
        <span>01 — 09</span>
      </div>
      <div className="mobile-contact">
        <button onClick={book}>
          BOOK EYE TEST <ArrowUpRight size={13} />
        </button>
        <button onClick={whatsapp} aria-label="WhatsApp Sri Lucky">
          <MessageCircle size={17} />
        </button>
        <button onClick={call} aria-label="Call Sri Lucky">
          <Phone size={15} />
        </button>
      </div>
      {menu && (
        <Dialog
          name="Navigation"
          onClose={() => setMenu(false)}
          className="navigation-dialog"
        >
          <span className="eyebrow">A CLEARER PERSPECTIVE</span>
          {[
            ["Home", "home"],
            ["Vision", "vision"],
            ["Clinic", "care"],
            ["About", "about"],
            ["Contact", "visit"],
          ].map(([name, id]) => (
            <button key={id} onClick={() => travel(id)}>
              {name}
              <ArrowUpRight />
            </button>
          ))}
          {bookButton()}
        </Dialog>
      )}
      {dialog && (
        <Dialog
          name={dialog === "booking" ? "Book your visit" : "Store information"}
          onClose={() => setDialog(null)}
        >
          {dialog === "booking" ? (
            <Booking
              data={data}
              loading={loading}
              loadError={loadError}
              onRetry={() => {
                setLoadError("");
                load();
              }}
              onWhatsApp={message}
            />
          ) : (
            <div className="information-dialog">
              <span className="eyebrow">SRI LUCKY / A LITTLE INFORMATION</span>
              <h2>
                Let’s keep
                <br />
                things clear.
              </h2>
              <p>{info}</p>
              {bookButton()}
            </div>
          )}
        </Dialog>
      )}
    </>
  );
}
export function Dialog({
  children,
  onClose,
  name,
  className = "",
}: {
  children: React.ReactNode;
  onClose: () => void;
  name: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const list = () =>
      Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          "button,a,input,select,textarea",
        ) || [],
      ).filter((e) => !e.hasAttribute("disabled"));
    list()[0]?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const els = list();
      if (e.shiftKey && document.activeElement === els[0]) {
        e.preventDefault();
        els.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === els.at(-1)) {
        e.preventDefault();
        els[0]?.focus();
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={"dialog " + className}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={name}
      >
        <button
          className="dialog-close"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </div>
    </div>
  );
}
function Booking({
  data,
  loading,
  loadError,
  onRetry,
  onWhatsApp,
  inline = false,
}: {
  data: PublicData;
  loading: boolean;
  loadError: string;
  onRetry: () => void;
  onWhatsApp: (m: string) => void;
  inline?: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [values, setValues] = useState({
    service: "Eye Examination",
    date: "",
    time: "",
  });
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const saved = await api("/appointments", "POST", body);
      setResult({ ...body, ...saved });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="booking">
      <span className="eyebrow">A MOMENT FOR YOUR VISION</span>
      {result ? (
        <>
          <div className="confirmation-check">
            <Check size={24} />
          </div>
          <h2>
            You’re on
            <br />
            our list.
          </h2>
          <p>
            Request #{result.id} received for {result.service} on {result.date}{" "}
            at {result.time}. The team will call you to confirm availability.
          </p>
          <span className="pending-note">PENDING STORE CONFIRMATION</span>
          <button
            className="button"
            onClick={() =>
              onWhatsApp(
                `Hi ${data.settings.business_name}, I would like to confirm appointment request #${result.id} for ${result.service} on ${result.date} at ${result.time}.`,
              )
            }
          >
            FOLLOW UP ON WHATSAPP <ArrowUpRight size={16} />
          </button>
        </>
      ) : (
        <>
          {!inline && (
            <h2>
              Let’s see
              <br />
              you.
            </h2>
          )}
          <p>A simple request. A little time for your eyes.</p>
          {loadError ? (
            <div className="form-error" role="alert">
              {loadError}
              <button onClick={onRetry}>Try again</button>
            </div>
          ) : loading ? (
            <p role="status">Loading appointment details…</p>
          ) : null}
          <form onSubmit={submit}>
            <div className="form-grid">
              <label>
                Your name
                <input
                  name="customer_name"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  placeholder="Full name"
                />
              </label>
              <label>
                Phone number
                <input
                  name="phone"
                  type="tel"
                  required
                  pattern="[+0-9 ()\-]{7,20}"
                  autoComplete="tel"
                  placeholder="Your mobile number"
                />
              </label>
              <label>
                Preferred date
                <input
                  type="date"
                  name="date"
                  min={today}
                  required
                  value={values.date}
                  onChange={(e) =>
                    setValues({ ...values, date: e.target.value })
                  }
                />
              </label>
              <label>
                Preferred time
                <select
                  name="time"
                  required
                  value={values.time}
                  onChange={(e) =>
                    setValues({ ...values, time: e.target.value })
                  }
                >
                  <option value="">Select a time</option>
                  {data.times.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="full">
                Service
                <select
                  name="service"
                  value={values.service}
                  onChange={(e) =>
                    setValues({ ...values, service: e.target.value })
                  }
                >
                  {data.services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="full">
                Message <span>OPTIONAL</span>
                <textarea
                  name="message"
                  rows={2}
                  maxLength={1000}
                  placeholder="Anything you’d like us to know?"
                />
              </label>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="button"
              disabled={busy || loading || Boolean(loadError)}
            >
              {busy ? (
                <LoaderCircle size={16} className="spin" />
              ) : (
                <>
                  BOOK EYE TEST <ArrowUpRight size={16} />
                </>
              )}
            </button>
            <button
              className="booking-whatsapp"
              type="button"
              onClick={() =>
                onWhatsApp(
                  `Hi ${data.settings.business_name}, I would like to book ${values.service}${values.date ? " on " + values.date : ""}${values.time ? " at " + values.time : ""}.`,
                )
              }
            >
              WHATSAPP US <MessageCircle size={15} />
            </button>
            <small>
              Preferred times are requests, subject to confirmation. By
              submitting, you agree that we may contact you about your visit.
            </small>
          </form>
        </>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
