export async function optimizeImage(file, maxDimension = 2400, quality = 0.86) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please select an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality)
  );

  bitmap.close();

  if (!blob) throw new Error("Image optimization failed.");

  return {
    blob,
    width,
    height,
    filename: `${crypto.randomUUID()}.webp`,
  };
}