const RESPONSIVE_WIDTHS = [
  640,
  960,
  1280,
  1600,
  2000,
  2400,
];

/**
 * Convert a normal Supabase public Storage URL
 * into a Supabase image-transformation URL.
 */
function getTransformBaseUrl(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  if (!imageUrl.includes("/storage/v1/object/public/")) {
    return imageUrl;
  }

  return imageUrl
    .replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    )
    .split("?")[0];
}

/**
 * Get one optimized image URL.
 */
export function getImageUrl(
  imageUrl,
  width = 1600,
  quality = 82
) {
  if (!imageUrl) {
    return "";
  }

  const baseUrl = getTransformBaseUrl(imageUrl);

  // If this isn't a Supabase Storage image,
  // return the original URL.
  if (baseUrl === imageUrl && !imageUrl.includes("/render/image/")) {
    return imageUrl;
  }

  return `${baseUrl}?width=${width}&quality=${quality}`;
}

/**
 * Generate responsive srcSet values.
 */
export function getImageSrcSet(
  imageUrl,
  quality = 82
) {
  if (!imageUrl) {
    return undefined;
  }

  const baseUrl = getTransformBaseUrl(imageUrl);

  if (
    baseUrl === imageUrl &&
    !imageUrl.includes("/render/image/")
  ) {
    return undefined;
  }

  return RESPONSIVE_WIDTHS.map(
    (width) =>
      `${baseUrl}?width=${width}&quality=${quality} ${width}w`
  ).join(", ");
}