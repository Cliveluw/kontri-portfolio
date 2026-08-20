import { supabase } from "./supabase";

/**
 * Get all published photographs for the public website.
 */
export async function getPublishedPhotos() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("photos")
    .select(`
      *,
      photo_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load published photos:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get all featured photographs.
 *
 * Featured photographs are used by the
 * automatic homepage hero.
 */
export async function getFeaturedPhotos() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("photos")
    .select(`
      *,
      photo_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("published", true)
    .eq("featured", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load featured photos:", error);
    return [];
  }

  return data ?? [];
}

/**
 * Get all photographs for the private CMS.
 */
export async function getAllPhotos() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("photos")
    .select(`
      *,
      photo_categories (
        category_id,
        categories (
          id,
          name,
          slug
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Get all available photography categories.
 */
export async function getCategories() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Update photograph metadata.
 */
export async function updatePhoto(photoId, updates) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase
    .from("photos")
    .update(updates)
    .eq("id", photoId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Replace all categories assigned to a photograph.
 */
export async function updatePhotoCategories(
  photoId,
  categoryIds
) {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error: deleteError } = await supabase
    .from("photo_categories")
    .delete()
    .eq("photo_id", photoId);

  if (deleteError) {
    throw deleteError;
  }

  if (!categoryIds || categoryIds.length === 0) {
    return;
  }

  const rows = categoryIds.map((categoryId) => ({
    photo_id: photoId,
    category_id: categoryId,
  }));

  const { error: insertError } = await supabase
    .from("photo_categories")
    .insert(rows);

  if (insertError) {
    throw insertError;
  }
}

/**
 * Get category IDs assigned to a photograph.
 */
export function getPhotoCategoryIds(photo) {
  if (!photo?.photo_categories) {
    return [];
  }

  return photo.photo_categories.map(
    (relationship) => relationship.category_id
  );
}