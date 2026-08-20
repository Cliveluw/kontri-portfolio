import {
  lazy,
  Suspense,
  useEffect,
  useState,
} from "react";

import { AnimatePresence, motion } from "framer-motion";

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

import { getImageUrl } from "./lib/imageDelivery";

const Admin = lazy(() => import("./pages/Admin"));

const demoPhotos = [
  {
    id: "demo-1",
    title: "The Mountain",
    location: "Mulanje, Malawi",
    image_url:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "demo-2",
    title: "After Rain",
    location: "Malawi",
    image_url:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "demo-3",
    title: "Quiet Roads",
    location: "Southern Malawi",
    image_url:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1800&q=85",
  },
  {
    id: "demo-4",
    title: "Human Light",
    location: "Lilongwe, Malawi",
    image_url:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1800&q=85",
  },
];

function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between rounded-full border border-white/10 bg-black/35 px-5 py-3 backdrop-blur-xl">
        <Link
          to="/"
          className="font-display text-xl tracking-tight"
        >
          KONTRI<span className="text-white/40">.</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#work" className="transition hover:text-white">
            Work
          </a>

          <a href="#about" className="transition hover:text-white">
            About
          </a>

          <a href="#contact" className="transition hover:text-white">
            Contact
          </a>
        </nav>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-2 max-w-7xl rounded-3xl border border-white/10 bg-black/90 p-6 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-5 text-lg">
              <a href="#work" onClick={() => setOpen(false)}>
                Work
              </a>

              <a href="#about" onClick={() => setOpen(false)}>
                About
              </a>

              <a href="#contact" onClick={() => setOpen(false)}>
                Contact
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function Home() {
  const [photos, setPhotos] = useState([]);
  const [featuredPhotos, setFeaturedPhotos] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // -----------------------------------------------
  // LOAD PORTFOLIO
  // -----------------------------------------------

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);

      try {
        const [published, featured] = await Promise.all([
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

  // -----------------------------------------------
  // CURRENT HERO PHOTO
  // -----------------------------------------------

  const heroPhoto =
    featuredPhotos.length > 0
      ? featuredPhotos[
          heroIndex % featuredPhotos.length
        ]
      : photos[0];

  // -----------------------------------------------
  // HERO NAVIGATION
  // -----------------------------------------------

  function previousHero() {
    if (featuredPhotos.length <= 1) return;

    setHeroIndex((current) =>
      current === 0
        ? featuredPhotos.length - 1
        : current - 1
    );
  }

  function nextHero() {
    if (featuredPhotos.length <= 1) return;

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

        {/* -----------------------------------------------
            PHOTOGRAPH
        ------------------------------------------------ */}

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

          {/* CINEMATIC OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />

          <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

        </div>

        {/* -----------------------------------------------
            HERO CONTENT
        ------------------------------------------------ */}

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-end px-5 pb-8 pt-32 md:px-10 md:pb-10">

          {/* TOP LABEL */}

          <div className="mb-auto pt-24">

            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
              Photography · Malawi · Stories
            </p>

          </div>

          {/* BOTTOM CONTENT */}

          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">

            {/* TITLE */}

            <div className="max-w-4xl">

              <h1 className="font-display text-6xl leading-[.9] tracking-[-0.045em] md:text-9xl">
                Seeing home
                <br />
                differently.
              </h1>

              <p className="mt-7 max-w-md text-base leading-7 text-white/60 md:text-lg">
                A visual journal of people, places and moments —
                photographed through the eyes of Kontri.
              </p>

            </div>

            {/* HERO CONTROLS */}

            <div className="flex items-end justify-between gap-8 md:min-w-[260px] md:flex-col md:items-end">

              {/* COUNTER */}

              {featuredPhotos.length > 0 && (
                <div className="flex items-baseline gap-2 font-mono text-xs">

                  <span className="text-white">
                    {String(heroIndex + 1).padStart(2, "0")}
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

              {/* ARROWS */}

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

              {/* EXPLORE */}

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
            Single frames from places, people and moments worth keeping.
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

    {/* SECTION LABEL */}
    <div className="mb-16 flex items-center justify-between">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">
        About the work
      </p>

      <span className="hidden font-mono text-xs text-white/25 md:block">
        01 — 03
      </span>
    </div>

    {/* MAIN STATEMENT */}
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
            Malawi is home — its landscapes, people, movement,
            culture and the small moments that are easy to overlook.
          </p>

          <p className="text-base leading-8 text-white/55">
            KONTRI is an evolving visual archive of those things.
            Sometimes deliberate, sometimes accidental, always
            personal.
          </p>

        </div>

      </div>

    </div>

    {/* DIVIDER */}
    <div className="my-20 h-px bg-white/10 md:my-28" />

    {/* CATEGORIES / APPROACH */}
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

    {/* CLOSING STATEMENT */}
    <div className="mt-24 max-w-3xl md:mt-32">

      <p className="font-display text-3xl leading-tight text-white/80 md:text-5xl">
        There is always something worth noticing.
      </p>

    </div>

  </div>
</section>

      {/* =================================================
    CONTACT / WORK WITH ME
================================================= */}

<section
  id="contact"
  className="mx-auto max-w-7xl px-5 py-28 md:px-10 md:py-40"
>
  <div className="grid gap-16 md:grid-cols-[1.2fr_0.8fr]">

    {/* LEFT */}
    <div>

      <p className="mb-6 text-xs uppercase tracking-[0.3em] text-white/40">
        Work with me
      </p>

      <h2 className="max-w-4xl font-display text-6xl leading-[0.9] tracking-[-0.04em] md:text-9xl">
        Let's make
        <br />
        something.
      </h2>

      <p className="mt-10 max-w-xl text-base leading-8 text-white/50 md:text-lg">
        Whether it is a portrait, an event, a story, a campaign
        or simply a moment worth remembering — I'd love to hear
        what you're working on.
      </p>

    </div>

    {/* RIGHT */}
    <div className="flex flex-col justify-end">

      {/* SERVICES */}
      <div className="border-t border-white/10">

        <p className="py-5 text-xs uppercase tracking-[0.25em] text-white/35">
          Photography
        </p>

        <div className="border-t border-white/10">

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-white/65">
              Portraits
            </span>

            <span className="text-xs text-white/25">
              01
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-white/65">
              Events
            </span>

            <span className="text-xs text-white/25">
              02
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-white/65">
              Commercial
            </span>

            <span className="text-xs text-white/25">
              03
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-white/65">
              Editorial
            </span>

            <span className="text-xs text-white/25">
              04
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-white/10 py-4">
            <span className="text-sm text-white/65">
              Visual stories
            </span>

            <span className="text-xs text-white/25">
              05
            </span>
          </div>

        </div>

      </div>

      {/* CONTACT LINKS */}
      <div className="mt-12">

        <p className="mb-5 text-xs uppercase tracking-[0.25em] text-white/35">
          Start a conversation
        </p>

        <a
          href="mailto:hello@kontri.example"
          className="group inline-flex items-center gap-3 border-b border-white/30 pb-3 text-base transition hover:border-white"
        >
          hello@kontri.example

          <ArrowUpRight
            size={17}
            className="transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          />
        </a>

      </div>

    </div>

  </div>

  {/* SOCIAL / LOCATION */}
  <div className="mt-24 flex flex-col justify-between gap-6 border-t border-white/10 pt-6 text-xs text-white/35 md:flex-row">

    <span>
      Based in Malawi · Available for travel
    </span>

    <div className="flex gap-6">

      <a
        href="#"
        className="transition hover:text-white"
      >
        Instagram
      </a>

      <a
        href="#"
        className="transition hover:text-white"
      >
        Facebook
      </a>

      <a
        href="#"
        className="transition hover:text-white"
      >
        YouTube
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
export default function App() {
  const location = useLocation();

  return (
    <>
      {location.pathname !== "/admin" && <SiteNav />}

      <Routes>
        <Route path="/" element={<Home />} />
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