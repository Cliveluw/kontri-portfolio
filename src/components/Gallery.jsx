import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import {
  getImageUrl,
  getImageSrcSet,
} from "../lib/imageDelivery";

export default function Gallery({ photos, loading }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  /*
   * Build categories dynamically from Supabase data.
   */
  const categories = useMemo(() => {
    const categoryMap = new Map();

    photos.forEach((photo) => {
      photo.photo_categories?.forEach((relationship) => {
        const category = relationship.categories;

        if (category) {
          categoryMap.set(category.id, category);
        }
      });
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [photos]);

  /*
   * Filter the public gallery.
   */
  const filteredPhotos = useMemo(() => {
    if (activeCategory === "all") {
      return photos;
    }

    return photos.filter((photo) =>
      photo.photo_categories?.some(
        (relationship) =>
          relationship.category_id === activeCategory
      )
    );
  }, [photos, activeCategory]);

  /*
   * Current photograph in the lightbox.
   */
  const selectedPhoto =
    selectedIndex !== null
      ? filteredPhotos[selectedIndex]
      : null;

  /*
   * Open lightbox.
   */
  function openPhoto(index) {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  }

  /*
   * Close lightbox.
   */
  function closePhoto() {
    setSelectedIndex(null);
    document.body.style.overflow = "";
  }

  /*
   * Previous photograph.
   */
  function previousPhoto() {
    if (!filteredPhotos.length) return;

    setSelectedIndex((current) => {
      if (current === null) return 0;

      return current === 0
        ? filteredPhotos.length - 1
        : current - 1;
    });
  }

  /*
   * Next photograph.
   */
  function nextPhoto() {
    if (!filteredPhotos.length) return;

    setSelectedIndex((current) => {
      if (current === null) return 0;

      return current === filteredPhotos.length - 1
        ? 0
        : current + 1;
    });
  }

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    function handleKeyDown(event) {
      if (selectedIndex === null) return;

      if (event.key === "Escape") {
        closePhoto();
      }

      if (event.key === "ArrowLeft") {
        previousPhoto();
      }

      if (event.key === "ArrowRight") {
        nextPhoto();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, filteredPhotos.length]);

  /*
   * Restore page scrolling if component disappears.
   */
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse bg-white/5" />
        <div className="aspect-[4/5] animate-pulse bg-white/5" />
      </div>
    );
  }

  return (
    <>
      {/* -----------------------------------------
          CATEGORY FILTER
      ------------------------------------------ */}

      {categories.length > 0 && (
        <div className="mb-10 overflow-x-auto pb-2">
          <div className="flex min-w-max items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`border px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                activeCategory === "all"
                  ? "border-white bg-white text-black"
                  : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`border px-4 py-2 text-xs uppercase tracking-[0.15em] transition ${
                  activeCategory === category.id
                    ? "border-white bg-white text-black"
                    : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -----------------------------------------
          GALLERY
      ------------------------------------------ */}

      {filteredPhotos.length > 0 ? (
        <motion.div
          layout
          className="columns-1 gap-5 md:columns-2"
        >
          {filteredPhotos.map((photo, index) => (
            <motion.button
              key={photo.id}
              layout
              initial={{
                opacity: 0,
                y: 24,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.55,
                delay: Math.min(index * 0.04, 0.2),
              }}
              onClick={() => openPhoto(index)}
              className="group mb-5 block w-full break-inside-avoid text-left"
            >
              <div className="overflow-hidden bg-white/5">
                <img
                  src={getImageUrl(
                    photo.image_url,
                    1600,
                    82
                  )}
                  srcSet={getImageSrcSet(
                    photo.image_url,
                    82
                  )}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  alt={photo.title || ""}
                  loading={index < 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="w-full transition duration-700 ease-out group-hover:scale-[1.025]"
                />
              </div>

              {/* METADATA */}
              {(photo.title || photo.location) && (
                <div className="flex justify-between gap-4 py-3 text-xs text-white/45">
                  {photo.title ? (
                    <span>{photo.title}</span>
                  ) : (
                    <span />
                  )}

                  {photo.location && (
                    <span className="text-right">
                      {photo.location}
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="border border-dashed border-white/10 py-20 text-center">
          <p className="font-display text-2xl text-white/40">
            Nothing here yet.
          </p>

          <p className="mt-2 text-sm text-white/25">
            More photographs will appear here soon.
          </p>
        </div>
      )}

      {/* -----------------------------------------
          CINEMATIC VIEWER
      ------------------------------------------ */}

      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            key="viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md"
          >
            {/* TOP BAR */}
            <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5 md:px-8">
              <span className="text-xs tracking-[0.2em] text-white/40">
                {selectedIndex + 1}
                <span className="mx-2">/</span>
                {filteredPhotos.length}
              </span>

              <button
                type="button"
                onClick={closePhoto}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 backdrop-blur transition hover:bg-white hover:text-black"
                aria-label="Close image viewer"
              >
                <X size={18} />
              </button>
            </div>

            {/* PREVIOUS */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={previousPhoto}
                className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 backdrop-blur transition hover:bg-white hover:text-black md:left-8"
                aria-label="Previous photograph"
              >
                <ChevronLeft size={21} />
              </button>
            )}

            {/* NEXT */}
            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/30 text-white/60 backdrop-blur transition hover:bg-white hover:text-black md:right-8"
                aria-label="Next photograph"
              >
                <ChevronRight size={21} />
              </button>
            )}

            {/* IMAGE */}
            <div className="flex h-full w-full items-center justify-center px-16 py-24 md:px-28">
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedPhoto.id}
                  src={getImageUrl(
                    selectedPhoto.image_url,
                    2200,
                    88
                  )}
                  srcSet={getImageSrcSet(
                    selectedPhoto.image_url,
                    88
                  )}
                  sizes="100vw"
                  alt={selectedPhoto.title || ""}
                  initial={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.35,
                  }}
                  className="max-h-[78vh] max-w-full object-contain"
                />
              </AnimatePresence>
            </div>

            {/* INFORMATION */}
            {(selectedPhoto.title ||
              selectedPhoto.location ||
              selectedPhoto.description ||
              selectedPhoto.photo_categories?.length > 0) && (
              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/80 to-transparent px-5 pb-7 pt-20 md:px-10">
                <div className="mx-auto max-w-7xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

                    {/* LEFT */}
                    <div className="max-w-2xl">
                      {selectedPhoto.title && (
                        <h3 className="font-display text-2xl md:text-3xl">
                          {selectedPhoto.title}
                        </h3>
                      )}

                      {selectedPhoto.description && (
                        <p className="mt-2 text-sm leading-6 text-white/50">
                          {selectedPhoto.description}
                        </p>
                      )}
                    </div>

                    {/* RIGHT */}
                    <div className="flex flex-col items-start gap-3 text-xs text-white/40 md:items-end">
                      {selectedPhoto.location && (
                        <span>
                          {selectedPhoto.location}
                        </span>
                      )}

                      {selectedPhoto.photo_categories?.length > 0 && (
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {selectedPhoto.photo_categories.map(
                            (relationship) =>
                              relationship.categories && (
                                <span
                                  key={relationship.category_id}
                                  className="border border-white/10 px-2.5 py-1"
                                >
                                  {relationship.categories.name}
                                </span>
                              )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}