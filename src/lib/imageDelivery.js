const RESPONSIVE_WIDTHS = [
  640,
  960,
  1280,
  1600,
  2000,
  2400,
];

/**
 * Return the original Supabase Storage URL.
 *
 * Images are already optimized during upload,
 * so we don't need Supabase Image Transformations.
 */
export function getImageUrl(
  imageUrl,
  _width = 1600,
  _quality = 82
) {
  if (!imageUrl) {
    return "";
  }

  return imageUrl;
}

/**
 * Don't generate a transformed srcSet.
 *
 * Supabase Image Transformations are not available
 * on the current Free plan.
 */
export function getImageSrcSet(
  _imageUrl,
  _quality = 82
) {
  return undefined;
}