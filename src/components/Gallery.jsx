import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { getImageUrl, getImageSrcSet } from "../lib/imageDelivery";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_COUNT = 12;

export default function Gallery({ photos = [], loading }) {
  const [selected, setSelected] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] =
    useState(INITIAL_VISIBLE);

  /*
  |--------------------------------------------------------------------------
  | Build category list
  |--------------------------------------------------------------------------
  */

  const categories = useMemo(() => {
    const categoryMap = new Map();

    photos.forEach((photo) => {
      /*
       * Supports the category structures we've been using:
       *
       * photo.categories
       * photo.category
       * category.name
       */

      if (Array.isArray(photo.categories)) {
        photo.categories.forEach((category) => {
          const name =
            typeof category === "string"
              ? category
              : category?.name;

          if (name) {
            categoryMap.set(name.toLowerCase(), name);
          }
        });
      }

      if (photo.category) {
        const name =
          typeof photo.category === "string"
            ? photo.category
            : photo.category?.name;

        if (name) {
          categoryMap.set(name.toLowerCase(), name);
        }
      }
    });

    return [
      "All",
      ...Array.from(categoryMap.values()).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [photos]);

  /*
  |--------------------------------------------------------------------------
  | Filter photos
  |--------------------------------------------------------------------------
  */

  const filteredPhotos = useMemo(() => {
    if (activeCategory === "All") {
      return photos;
    }

    return photos.filter((photo) => {
      const names = [];

      if (Array.isArray(photo.categories)) {
        photo.categories.forEach((category) => {
          const name =
            typeof category === "string"
              ? category
              : category?.name;

          if (name) {
            names.push(name);
          }
        });
      }

      if (photo.category) {
        const name =
          typeof photo.category === "string"
            ? photo.category
            : photo.category?.name;

        if (name) {
          names.push(name);
        }
      }

      return names.some(
        (name) =>
          name.toLowerCase() ===
          activeCategory.toLowerCase()
      );
    });
  }, [photos, activeCategory]);

  /*
  |--------------------------------------------------------------------------
  | Visible photos
  |--------------------------------------------------------------------------
  */

  const visiblePhotos = filteredPhotos.slice(
    0,
    visibleCount
  );

  /*
  |--------------------------------------------------------------------------
  | Reset pagination when category changes
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [activeCategory]);

  /*
  |--------------------------------------------------------------------------
  | Lightbox navigation
  |--------------------------------------------------------------------------
  */

  const selectedIndex = selected
    ? filteredPhotos.findIndex(
        (photo) => photo.id === selected.id
      )
    : -1;

  function closeLightbox() {
    setSelected(null);
  }

  function showPrevious() {
    if (selectedIndex < 0) return;

    const previousIndex =
      selectedIndex === 0
        ? filteredPhotos.length - 1
        : selectedIndex - 1;

    setSelected(filteredPhotos[previousIndex]);
  }

  function showNext() {
    if (selectedIndex < 0) return;

    const nextIndex =
      selectedIndex === filteredPhotos.length - 1
        ? 0
        : selectedIndex + 1;

    setSelected(filteredPhotos[nextIndex]);
  }

  /*
  |--------------------------------------------------------------------------
  | Keyboard controls
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!selected) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow = "";
    };
  }, [selected, selectedIndex, filteredPhotos]);

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
        {Array.from({ length: 9 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse bg-white/5"
          />
        ))}
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty state
  |--------------------------------------------------------------------------
  */

  if (!photos.length) {
    return (
      <div className="border border-white/10 py-20 text-center">
        <p className="text-sm text-white/35">
          No photographs have been published yet.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* =================================================
          CATEGORY FILTER
      ================================================= */}

      <div className="mb-10 overflow-x-auto">
        <div className="flex min-w-max items-center gap-6 border-b border-white/10 pb-4">

          {categories.map((category) => {
            const active =
              activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(category)
                }
                className={`relative whitespace-nowrap text-xs uppercase tracking-[0.2em] transition ${
                  active
                    ? "text-white"
                    : "text-white/30 hover:text-white/70"
                }`}
              >
                {category}

                {active && (
                  <motion.span
                    layoutId="active-gallery-category"
                    className="absolute -bottom-[17px] left-0 right-0 h-px bg-white"
                  />
                )}
              </button>
            );
          })}

        </div>
      </div>

      {/* =================================================
          GALLERY
      ================================================= */}

      {visiblePhotos.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5"
        >
          {visiblePhotos.map((photo, index) => (
            <motion.button
              key={photo.id}
              type="button"
              layout
              initial={{
                opacity: 0,
                y: 16,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.45,
                delay: Math.min(
                  index * 0.035,
                  0.25
                ),
              }}
              onClick={() => setSelected(photo)}
              className="group relative aspect-[4/5] overflow-hidden bg-white/5 text-left"
            >
              <img
                src={getImageUrl(
                  photo.image_url,
                  1000,
                  84
                )}
                srcSet={getImageSrcSet(
                  photo.image_url,
                  84
                )}
                sizes="(max-width: 768px) 50vw, 33vw"
                alt={photo.title || "KONTRI photograph"}
                loading={
                  index < 6
                    ? "eager"
                    : "lazy"
                }
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035]"
              />

              {/* Hover overlay */}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />

              {/* Image index */}

              <span className="absolute bottom-4 left-4 font-mono text-[10px] text-white/0 transition duration-500 group-hover:text-white/70">
                {String(index + 1).padStart(
                  2,
                  "0"
                )}
              </span>

            </motion.button>
          ))}
        </motion.div>
      ) : (
        <div className="border border-white/10 py-20 text-center">
          <p className="text-sm text-white/35">
            No photographs in this category yet.
          </p>
        </div>
      )}

      {/* =================================================
          LOAD MORE
      ================================================= */}

      {visibleCount <
        filteredPhotos.length && (
        <div className="mt-12 flex justify-center">

          <button
            type="button"
            onClick={() =>
              setVisibleCount(
                (current) =>
                  current + LOAD_MORE_COUNT
              )
            }
            className="border border-white/15 px-8 py-4 text-xs uppercase tracking-[0.25em] text-white/50 transition hover:border-white/50 hover:text-white"
          >
            Load more
          </button>

        </div>
      )}

      {/* =================================================
          LIGHTBOX
      ================================================= */}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-8"
            onClick={closeLightbox}
          >

            {/* CLOSE */}

            <button
              type="button"
              onClick={closeLightbox}
              aria-label="Close photograph"
              className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center border border-white/15 text-white/60 transition hover:border-white/50 hover:text-white md:right-8 md:top-8"
            >
              <X size={20} />
            </button>

            {/* PREVIOUS */}

            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrevious();
                }}
                aria-label="Previous photograph"
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/30 text-white/60 backdrop-blur-sm transition hover:border-white/50 hover:bg-white hover:text-black md:left-8"
              >
                <ArrowLeft size={19} />
              </button>
            )}

            {/* NEXT */}

            {filteredPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                aria-label="Next photograph"
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/15 bg-black/30 text-white/60 backdrop-blur-sm transition hover:border-white/50 hover:bg-white hover:text-black md:right-8"
              >
                <ArrowRight size={19} />
              </button>
            )}

            {/* IMAGE */}

            <motion.div
              initial={{
                scale: 0.96,
              }}
              animate={{
                scale: 1,
              }}
              exit={{
                scale: 0.96,
              }}
              className="relative flex max-h-[88vh] max-w-[90vw] items-center justify-center"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={getImageUrl(
                  selected.image_url,
                  2400,
                  90
                )}
                srcSet={getImageSrcSet(
                  selected.image_url,
                  90
                )}
                sizes="90vw"
                alt={
                  selected.title ||
                  "KONTRI photograph"
                }
                className="max-h-[88vh] max-w-full object-contain"
              />
            </motion.div>

            {/* COUNTER */}

            {filteredPhotos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-xs text-white/40">
                {String(
                  selectedIndex + 1
                ).padStart(2, "0")}
                {" / "}
                {String(
                  filteredPhotos.length
                ).padStart(2, "0")}
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}