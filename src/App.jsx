import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  Link,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  ArrowDown,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";

import Gallery from "./components/Gallery";

import {
  getPublishedPhotos,
  getFeaturedPhotos,
} from "./lib/photos";

import {
  getImageUrl,
  getImageSrcSet,
} from "./lib/imageDelivery";

import { supabase } from "./lib/supabase";
import { submitBookingInquiry } from "./lib/inquiries";

/*
|--------------------------------------------------------------------------
| Lazy-loaded Admin
|--------------------------------------------------------------------------
*/

const Admin = lazy(() => import("./pages/Admin"));

/*
|--------------------------------------------------------------------------
| Social Icons
|--------------------------------------------------------------------------
*/

function InstagramIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="0.8"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function FacebookIcon({ size = 17 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13.5 21v-8h2.75l.4-3h-3.15V8.08c0-.87.24-1.46 1.5-1.46h1.8V3.94c-.31-.04-1.37-.14-2.6-.14-2.58 0-4.35 1.57-4.35 4.46V10H7v3h2.85v8h3.65Z" />
    </svg>
  );
}

function YoutubeIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.5 6.2a3.05 3.05 0 0 0-2.14-2.16C19.47 3.5 12 3.5 12 3.5s-7.47 0-9.36.54A3.05 3.05 0 0 0 .5 6.2 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.8 3.05 3.05 0 0 0 2.14 2.16c1.89.54 9.36.54 9.36.54s7.47 0 9.36-.54a3.05 3.05 0 0 0 2.14-2.16A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Site Navigation
|--------------------------------------------------------------------------
*/

function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/35 px-5 py-3 backdrop-blur-xl">

        <Link
  to="/"
  onClick={() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  className="font-display text-xl tracking-tight"
>
  KONTRI
  <span className="text-white/40">
    .
  </span>
</Link>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a
            href="#work"
            className="transition hover:text-white"
          >
            Work
          </a>

          <a
            href="#about"
            className="transition hover:text-white"
          >
            About
          </a>

          <a
            href="#contact"
            className="transition hover:text-white"
          >
            Contact
          </a>
        </nav>

        <button
          type="button"
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? (
            <X size={21} />
          ) : (
            <Menu size={21} />
          )}
        </button>

      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{
              opacity: 0,
              y: -8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: -8,
            }}
            className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 bg-black/90 p-6 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-5 text-lg">

              <a
                href="#work"
                onClick={() => setOpen(false)}
              >
                Work
              </a>

              <a
                href="#about"
                onClick={() => setOpen(false)}
              >
                About
              </a>

              <a
                href="#contact"
                onClick={() => setOpen(false)}
              >
                Contact
              </a>

            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/*
|--------------------------------------------------------------------------
| Booking Form
|--------------------------------------------------------------------------
*/

function BookingForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    service: "",
    preferred_date: "",
    location: "",
    message: "",
    budget: "",
    referral_source: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitted(false);
    setError("");

    try {
      await submitBookingInquiry(form);

      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        service: "",
        preferred_date: "",
        location: "",
        message: "",
        budget: "",
        referral_source: "",
      });
    } catch (err) {
      console.error(
        "Booking enquiry submission failed:",
        err
      );

      setError(
        "Something went wrong while sending your enquiry. Please try again or contact me directly on WhatsApp."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex h-full min-h-[500px] flex-col justify-between border border-white/10 bg-white/[0.025] p-6 md:p-8">

        <div>

          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Enquiry received
          </p>

          <h3 className="mt-8 font-display text-4xl leading-tight md:text-5xl">
            Thank you.
          </h3>

          <p className="mt-6 max-w-md text-sm leading-7 text-white/50">
            Your enquiry has been received. I'll get back
            to you as soon as possible to discuss the
            project.
          </p>

        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row">

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="border border-white/20 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white/60 transition hover:border-white hover:text-white"
          >
            Send another enquiry
          </button>

          <a
            href="https://wa.me/265996503157"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white px-5 py-3 text-center text-xs uppercase tracking-[0.2em] text-black transition hover:bg-white/80"
          >
            WhatsApp me
          </a>

        </div>

      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-white/10 bg-white/[0.025] p-6 md:p-8"
    >

      <div className="mb-8">

        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Start a booking enquiry
        </p>

        <p className="mt-3 text-sm leading-6 text-white/40">
          Tell me a little about what you have in mind.
        </p>

      </div>

      <div className="space-y-6">

        {/* NAME */}

        <div>
          <label
            htmlFor="booking-name"
            className="mb-2 block text-xs text-white/40"
          >
            Name *
          </label>

          <input
            id="booking-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
            autoComplete="name"
            placeholder="Your name"
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/60"
          />
        </div>

        {/* EMAIL */}

        <div>
          <label
            htmlFor="booking-email"
            className="mb-2 block text-xs text-white/40"
          >
            Email *
          </label>

          <input
            id="booking-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/60"
          />
        </div>

        {/* PHONE */}

        <div>
          <label
            htmlFor="booking-phone"
            className="mb-2 block text-xs text-white/40"
          >
            Phone / WhatsApp
          </label>

          <input
            id="booking-phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            autoComplete="tel"
            placeholder="+265..."
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/60"
          />
        </div>

        {/* SERVICE */}

        <div>
          <label
            htmlFor="booking-service"
            className="mb-2 block text-xs text-white/40"
          >
            What do you need? *
          </label>

          <select
            id="booking-service"
            name="service"
            value={form.service}
            onChange={handleChange}
            required
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-white/60"
          >
            <option
              value=""
              disabled
              className="bg-black"
            >
              Select a service
            </option>

            <option
              value="Portrait"
              className="bg-black"
            >
              Portrait
            </option>

            <option
              value="Event"
              className="bg-black"
            >
              Event
            </option>

            <option
              value="Commercial"
              className="bg-black"
            >
              Commercial
            </option>

            <option
              value="Editorial"
              className="bg-black"
            >
              Editorial
            </option>

            <option
              value="Visual Story"
              className="bg-black"
            >
              Visual story
            </option>

            <option
              value="Other"
              className="bg-black"
            >
              Other
            </option>
          </select>
        </div>

        {/* DATE */}

        <div>
          <label
            htmlFor="booking-date"
            className="mb-2 block text-xs text-white/40"
          >
            Preferred date
          </label>

          <input
            id="booking-date"
            name="preferred_date"
            type="date"
            value={form.preferred_date}
            onChange={handleChange}
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-white/60"
          />
        </div>

        {/* LOCATION */}

        <div>
          <label
            htmlFor="booking-location"
            className="mb-2 block text-xs text-white/40"
          >
            Location
          </label>

          <input
            id="booking-location"
            name="location"
            type="text"
            value={form.location}
            onChange={handleChange}
            placeholder="Lilongwe, Blantyre, Mulanje..."
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/60"
          />
        </div>

        {/* MESSAGE */}

        <div>
          <label
            htmlFor="booking-message"
            className="mb-2 block text-xs text-white/40"
          >
            Tell me about the project *
          </label>

          <textarea
            id="booking-message"
            name="message"
            value={form.message}
            onChange={handleChange}
            required
            rows={5}
            placeholder="What are you looking to create?"
            className="w-full resize-none border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-white/30"
          />
        </div>

        {/* BUDGET */}

        <div>
          <label
            htmlFor="booking-budget"
            className="mb-2 block text-xs text-white/40"
          >
            Budget range
          </label>

          <select
            id="booking-budget"
            name="budget"
            value={form.budget}
            onChange={handleChange}
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-white/60"
          >
            <option
              value=""
              className="bg-black"
            >
              Prefer not to say
            </option>

            <option
              value="Under MWK 50,000"
              className="bg-black"
            >
              Under MWK 50,000
            </option>

            <option
              value="MWK 50,000 - 100,000"
              className="bg-black"
            >
              MWK 50,000 – 100,000
            </option>

            <option
              value="MWK 100,000 - 250,000"
              className="bg-black"
            >
              MWK 100,000 – 250,000
            </option>

            <option
              value="MWK 250,000+"
              className="bg-black"
            >
              MWK 250,000+
            </option>

            <option
              value="Not sure yet"
              className="bg-black"
            >
              Not sure yet
            </option>
          </select>
        </div>

        {/* REFERRAL */}

        <div>
          <label
            htmlFor="booking-referral"
            className="mb-2 block text-xs text-white/40"
          >
            How did you find KONTRI?
          </label>

          <select
            id="booking-referral"
            name="referral_source"
            value={form.referral_source}
            onChange={handleChange}
            className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm text-white outline-none focus:border-white/60"
          >
            <option
              value=""
              className="bg-black"
            >
              Select an option
            </option>

            <option
              value="Instagram"
              className="bg-black"
            >
              Instagram
            </option>

            <option
              value="Facebook"
              className="bg-black"
            >
              Facebook
            </option>

            <option
              value="YouTube"
              className="bg-black"
            >
              YouTube
            </option>

            <option
              value="Google"
              className="bg-black"
            >
              Google
            </option>

            <option
              value="Friend / Referral"
              className="bg-black"
            >
              Friend / Referral
            </option>

            <option
              value="Other"
              className="bg-black"
            >
              Other
            </option>
          </select>
        </div>

        {/* ERROR */}

        {error && (
          <div className="border border-red-400/20 bg-red-400/5 p-4 text-sm leading-6 text-red-300">
            {error}
          </div>
        )}

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={submitting}
          className="group flex w-full items-center justify-between bg-white px-5 py-4 text-sm text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            {submitting
              ? "Sending enquiry..."
              : "Send booking enquiry"}
          </span>

          {!submitting && (
            <ArrowUpRight
              size={18}
              className="transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            />
          )}
        </button>

        <p className="text-xs leading-5 text-white/25">
          By submitting this form, you are sending your
          enquiry directly to KONTRI for photography
          booking purposes.
        </p>

      </div>

    </form>
  );
}

/*
|--------------------------------------------------------------------------
| Home
|--------------------------------------------------------------------------
*/

function Home() {
  const [photos, setPhotos] = useState([]);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);

      try {
        const [
          published,
          featured,
        ] = await Promise.all([
          getPublishedPhotos(),
          getFeaturedPhotos(),
        ]);

        setPhotos(published);
        setFeaturedPhotos(featured);
      } catch (error) {
        console.error(
          "Could not load portfolio:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  useEffect(() => {
    async function testSupabase() {
      if (!supabase) {
        console.log(
          "❌ Supabase client is not initialized"
        );
        return;
      }

      const { data, error } = await supabase
        .from("photos")
        .select("id")
        .limit(1);

      if (error) {
        console.error(
          "❌ Supabase connection failed:",
          error
        );
        return;
      }

      console.log(
        "✅ Supabase connection successful:",
        data
      );
    }

    testSupabase();
  }, []);

  const heroPhoto =
    featuredPhotos.length > 0
      ? featuredPhotos[
          heroIndex % featuredPhotos.length
        ]
      : photos[0];

  function previousHero() {
    if (featuredPhotos.length <= 1) {
      return;
    }

    setHeroIndex((current) =>
      current === 0
        ? featuredPhotos.length - 1
        : current - 1
    );
  }

  function nextHero() {
    if (featuredPhotos.length <= 1) {
      return;
    }

    setHeroIndex((current) =>
      current === featuredPhotos.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <main>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative flex min-h-screen overflow-hidden bg-black">

        <div className="absolute inset-0">

          <AnimatePresence mode="wait">

            {heroPhoto && (
              <motion.img
                key={heroPhoto.id}
                src={getImageUrl(
                  heroPhoto.image_url,
                  2400,
                  88
                )}
                srcSet={getImageSrcSet(
                  heroPhoto.image_url,
                  88
                )}
                sizes="100vw"
                alt={heroPhoto.title || ""}
                initial={{
                  opacity: 0,
                  scale: 1.03,
                }}
                animate={{
                  opacity: 0.78,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 1.01,
                }}
                transition={{
                  opacity: {
                    duration: 0.8,
                    ease: "easeInOut",
                  },
                  scale: {
                    duration: 8,
                    ease: "easeOut",
                  },
                }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />

          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-end px-5 pb-8 pt-32 md:px-10 md:pb-10">

          <div className="mb-auto pt-24">

            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
              Photography · Malawi · Stories
            </p>

          </div>

          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">

            <div className="max-w-4xl">

              <h1 className="font-display text-6xl leading-[.9] tracking-[-0.045em] md:text-9xl">
  From where
  <br />
  I stand.
</h1>

              <p className="mt-7 max-w-md text-base leading-7 text-white/60 md:text-lg">
                A visual journal of people, places and
                moments — photographed through the eyes
                of Kontri.
              </p>

            </div>

            <div className="flex items-end justify-between gap-8 md:min-w-[260px] md:flex-col md:items-end">

              {featuredPhotos.length > 0 && (
                <div className="flex items-baseline gap-2 font-mono text-xs">

                  <span className="text-white">
                    {String(
                      heroIndex + 1
                    ).padStart(2, "0")}
                  </span>

                  <span className="text-white/25">
                    /
                  </span>

                  <span className="text-white/35">
                    {String(
                      featuredPhotos.length
                    ).padStart(2, "0")}
                  </span>

                </div>
              )}

              {featuredPhotos.length > 1 && (
                <div className="flex items-center gap-2">

                  <button
                    type="button"
                    onClick={previousHero}
                    aria-label="Previous featured photograph"
                    className="flex h-11 w-11 items-center justify-center border border-white/20 bg-black/20 text-white/60 backdrop-blur-sm transition hover:border-white/50 hover:bg-white hover:text-black"
                  >
                    <ArrowUpRight
                      size={17}
                      className="-rotate-[135deg]"
                    />
                  </button>

                  <button
                    type="button"
                    onClick={nextHero}
                    aria-label="Next featured photograph"
                    className="flex h-11 w-11 items-center justify-center border border-white/20 bg-black/20 text-white/60 backdrop-blur-sm transition hover:border-white/50 hover:bg-white hover:text-black"
                  >
                    <ArrowUpRight
                      size={17}
                      className="rotate-[-45deg]"
                    />
                  </button>

                </div>
              )}

              <a
                href="#work"
                className="group flex items-center gap-3 text-sm text-white/70 transition hover:text-white"
              >
                Explore the work

                <ArrowDown
                  size={17}
                  className="transition group-hover:translate-y-1"
                />
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          ARCHIVE
      ================================================= */}

      <section
        id="work"
        className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40"
      >

        <div className="mb-14 flex items-end justify-between gap-6">

          <div>

            <p className="mb-4 text-xs uppercase tracking-[0.3em] text-white/40">
              Selected work
            </p>

            <h2 className="font-display text-5xl tracking-tight md:text-7xl">
              The archive.
            </h2>

          </div>

          <p className="hidden max-w-xs text-right text-sm leading-6 text-white/45 md:block">
            Single frames from places, people and moments
            worth keeping.
          </p>

        </div>

        <Gallery
          photos={photos}
          loading={loading}
        />

      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="border-y border-white/10 bg-white/[0.025] px-5 py-28 md:px-10 md:py-40"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-16 flex items-center justify-between">

            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              About the work
            </p>

            <span className="hidden font-mono text-xs text-white/25 md:block">
              01 — 03
            </span>

          </div>

          <div className="grid gap-16 md:grid-cols-[0.7fr_1.8fr]">

            <div>

              <p className="text-sm leading-6 text-white/35">
                KONTRI
                <br />
                Photography
                <br />
                Malawi
              </p>

            </div>

            <div>

              <h2 className="max-w-5xl font-display text-4xl leading-[1.05] tracking-[-0.03em] md:text-7xl">
                I photograph what
                <br className="hidden md:block" />
                feels familiar.
              </h2>

              <div className="mt-10 grid gap-10 md:grid-cols-[1fr_1fr]">

                <p className="text-base leading-8 text-white/55">
                  Malawi is home — its landscapes, people,
                  movement, culture and the small moments
                  that are easy to overlook.
                </p>

                <p className="text-base leading-8 text-white/55">
                  KONTRI is an evolving visual archive of those
                  things. Sometimes deliberate, sometimes
                  accidental, always personal.
                </p>

              </div>

            </div>

          </div>

          <div className="my-20 h-px bg-white/10 md:my-28" />

          <div className="grid gap-12 md:grid-cols-[0.7fr_1.8fr]">

            <div>

              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                What I photograph
              </p>

            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-lg text-white/70 md:grid-cols-3 md:text-xl">

              <span>People</span>
              <span>Landscapes</span>
              <span>Culture</span>
              <span>Adventure</span>
              <span>Portraits</span>
              <span>Everyday life</span>

            </div>

          </div>

          <div className="mt-24 max-w-3xl md:mt-32">

            <p className="font-display text-3xl leading-tight text-white/80 md:text-5xl">
              There is always something worth noticing.
            </p>

          </div>

        </div>

      </section>

      {/* =================================================
          CONTACT / BOOKING
      ================================================= */}

      <section
        id="contact"
        className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40"
      >

        <div className="grid gap-16 md:grid-cols-[1fr_1fr]">

          {/* INTRODUCTION */}

          <div>

            <p className="mb-6 text-xs uppercase tracking-[0.3em] text-white/40">
              Work with me
            </p>

            <h2 className="max-w-4xl font-display text-6xl leading-[0.9] tracking-[-0.04em] md:text-8xl">
              Let's make
              <br />
              something.
            </h2>

            <p className="mt-10 max-w-xl text-base leading-8 text-white/50 md:text-lg">
              Whether it is a portrait, an event, a story,
              a campaign or simply a moment worth
              remembering — tell me what you're working on.
            </p>

            {/* DIRECT CONTACT */}

            <div className="mt-12 border-t border-white/10 pt-6">

              <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/35">
                Prefer a direct conversation?
              </p>

              <div className="flex flex-col gap-4">

                <a
                  href="mailto:chefkontri@gmail.com"
                  className="group inline-flex w-fit items-center gap-3 border-b border-white/30 pb-2 text-sm transition hover:border-white"
                >
                  chefkontri@gmail.com

                  <ArrowUpRight
                    size={17}
                    className="transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </a>

                <a
                  href="https://wa.me/265996503157"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex w-fit items-center gap-3 border-b border-white/30 pb-2 text-sm transition hover:border-white"
                >
                  WhatsApp me

                  <ArrowUpRight
                    size={17}
                    className="transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  />
                </a>

              </div>

            </div>

          </div>

          {/* BOOKING FORM */}

          <BookingForm />

        </div>

        {/* SOCIAL / LOCATION */}

        <div className="mt-24 flex flex-col justify-between gap-6 border-t border-white/10 pt-6 text-xs text-white/35 md:flex-row">

          <span>
            Based in Malawi · Available for travel
          </span>

          <div className="flex items-center gap-5">

            <a
              href="https://www.instagram.com/chef_kontri/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="text-white/40 transition duration-300 hover:-translate-y-0.5 hover:text-white"
            >
              <InstagramIcon />
            </a>

            <a
              href="https://facebook.com/CliveLuw/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="text-white/40 transition duration-300 hover:-translate-y-0.5 hover:text-white"
            >
              <FacebookIcon />
            </a>

            <a
              href="https://www.youtube.com/@chefkontri"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className="text-white/40 transition duration-300 hover:-translate-y-0.5 hover:text-white"
            >
              <YoutubeIcon />
            </a>

          </div>

        </div>

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="flex flex-col justify-between gap-4 border-t border-white/10 px-5 py-8 text-xs text-white/35 md:flex-row md:px-10">

        <span>
          © {new Date().getFullYear()} KONTRI
        </span>

        <span>
          Made in Malawi.
        </span>

      </footer>

    </main>
  );
}

/*
|--------------------------------------------------------------------------
| App
|--------------------------------------------------------------------------
*/

export default function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/admin" && (
        <SiteNav />
      )}

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <div className="flex min-h-screen items-center justify-center bg-black text-sm text-white/40">
                  Loading admin...
                </div>
              }
            >
              <Admin />
            </Suspense>
          }
        />

      </Routes>
    </>
  );
}