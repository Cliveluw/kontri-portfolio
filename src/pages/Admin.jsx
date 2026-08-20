import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Edit3,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  LogOut,
  MapPin,
  Save,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";
import {
  getAllPhotos,
  getCategories,
  getPhotoCategoryIds,
  updatePhoto,
  updatePhotoCategories,
} from "../lib/photos";
import { optimizeImage } from "../lib/imageOptimizer";

const MAX_FILES = 10;

export default function Admin() {
  // --------------------------------------------------
  // AUTH
  // --------------------------------------------------

  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  // --------------------------------------------------
  // ARCHIVE
  // --------------------------------------------------

  const [photos, setPhotos] = useState([]);
  const [categories, setCategories] = useState([]);

  // --------------------------------------------------
  // UPLOAD
  // --------------------------------------------------

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [featured, setFeatured] = useState(false);

  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [message, setMessage] = useState("");

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategories, setEditCategories] = useState([]);
  const [editFeatured, setEditFeatured] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error(error);
      }

      if (mounted) {
        setSession(data.session);
        setAuthLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();

    if (!supabase) {
      setAuthMessage("Supabase is not configured.");
      return;
    }

    if (!email || !password) {
      setAuthMessage("Enter your email and password.");
      return;
    }

    setLoginLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthMessage(error.message);
    }

    setLoginLoading(false);
  }

  async function handleLogout() {
    if (!supabase) return;

    await supabase.auth.signOut();

    setSession(null);
  }

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  async function refreshPhotos() {
    if (!supabase || !session) return;

    try {
      const data = await getAllPhotos();
      setPhotos(data);
    } catch (error) {
      console.error(error);
      setMessage("Could not load your photo archive.");
    }
  }

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      console.error(error);
      setMessage("Could not load categories.");
    }
  }

  useEffect(() => {
    if (!session) return;

    refreshPhotos();
    loadCategories();
  }, [session]);

  // --------------------------------------------------
  // CATEGORY SELECTION
  // --------------------------------------------------

  function toggleCategory(categoryId) {
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  function toggleEditCategory(categoryId) {
    setEditCategories((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    );
  }

  // --------------------------------------------------
  // FILE SELECTION
  // --------------------------------------------------

  function handleFileSelection(event) {
    const incomingFiles = Array.from(event.target.files || []);

    if (!incomingFiles.length) return;

    const imageFiles = incomingFiles.filter((file) =>
      file.type.startsWith("image/")
    );

    const combinedFiles = [...selectedFiles, ...imageFiles];

    const uniqueFiles = combinedFiles.filter(
      (file, index, array) =>
        index ===
        array.findIndex(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified
        )
    );

    if (uniqueFiles.length > MAX_FILES) {
      setMessage(
        `You can upload a maximum of ${MAX_FILES} photos at once.`
      );
    } else {
      setMessage("");
    }

    setSelectedFiles(uniqueFiles.slice(0, MAX_FILES));

    event.target.value = "";
  }

  function removeSelectedFile(indexToRemove) {
    setSelectedFiles((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

  function clearSelection() {
    setSelectedFiles([]);
    setSelectedCategories([]);
    setLocation("");
    setDescription("");
    setFeatured(false);
    setUploadProgress({});
    setMessage("");
  }

  // --------------------------------------------------
  // UPLOAD
  // --------------------------------------------------

  async function uploadPhotos() {
    if (!supabase) {
      setMessage("Supabase is not connected.");
      return;
    }

    if (!session) {
      setMessage("You must be logged in to upload photos.");
      return;
    }

    if (!selectedFiles.length) {
      setMessage("Choose at least one photograph.");
      return;
    }

    setBusy(true);
    setMessage("");

    const initialProgress = {};

    selectedFiles.forEach((file) => {
      initialProgress[file.name] = "waiting";
    });

    setUploadProgress(initialProgress);

    let successfulUploads = 0;

    for (const file of selectedFiles) {
      let storagePath = null;

      try {
        setUploadProgress((current) => ({
          ...current,
          [file.name]: "optimizing",
        }));

        const optimized = await optimizeImage(file);

        setUploadProgress((current) => ({
          ...current,
          [file.name]: "uploading",
        }));

        storagePath = `portfolio/${optimized.filename}`;

        const { error: uploadError } = await supabase.storage
          .from("photos")
          .upload(storagePath, optimized.blob, {
            contentType: "image/webp",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from("photos")
          .getPublicUrl(storagePath);

        if (!publicData?.publicUrl) {
          throw new Error(
            "Could not create a public URL for the photograph."
          );
        }

        setUploadProgress((current) => ({
          ...current,
          [file.name]: "saving",
        }));

        const { data: photo, error: databaseError } = await supabase
          .from("photos")
          .insert({
            title: null,
            location: location.trim() || null,
            description: description.trim() || null,
            image_url: publicData.publicUrl,
            storage_path: storagePath,
            width: optimized.width,
            height: optimized.height,
            published: true,
            featured,
          })
          .select()
          .single();

        if (databaseError) {
          throw databaseError;
        }

        if (selectedCategories.length > 0) {
          const categoryRows = selectedCategories.map((categoryId) => ({
            photo_id: photo.id,
            category_id: categoryId,
          }));

          const { error: categoryError } = await supabase
            .from("photo_categories")
            .insert(categoryRows);

          if (categoryError) {
            await supabase
              .from("photos")
              .delete()
              .eq("id", photo.id);

            throw categoryError;
          }
        }

        successfulUploads++;

        setUploadProgress((current) => ({
          ...current,
          [file.name]: "complete",
        }));
      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error);

        if (storagePath) {
          await supabase.storage
            .from("photos")
            .remove([storagePath]);
        }

        setUploadProgress((current) => ({
          ...current,
          [file.name]: "failed",
        }));
      }
    }

    await refreshPhotos();

    setBusy(false);

    if (successfulUploads === selectedFiles.length) {
      setMessage(
        `${successfulUploads} ${
          successfulUploads === 1 ? "photo" : "photos"
        } uploaded successfully.`
      );

      setSelectedFiles([]);
      setSelectedCategories([]);
      setLocation("");
      setDescription("");
      setFeatured(false);
    } else {
      setMessage(
        `${successfulUploads} of ${selectedFiles.length} photos uploaded successfully.`
      );
    }
  }

  // --------------------------------------------------
  // EDIT PHOTO
  // --------------------------------------------------

  function openEditPhoto(photo) {
    setEditingPhoto(photo);

    setEditTitle(photo.title || "");
    setEditLocation(photo.location || "");
    setEditDescription(photo.description || "");
    setEditCategories(getPhotoCategoryIds(photo));
    setEditFeatured(Boolean(photo.featured));
    setEditPublished(Boolean(photo.published));
    setEditMessage("");
  }

  function closeEditPhoto() {
    if (editSaving) return;

    setEditingPhoto(null);
    setEditMessage("");
  }

  async function savePhotoEdits() {
    if (!editingPhoto) return;

    setEditSaving(true);
    setEditMessage("");

    try {
      await updatePhoto(editingPhoto.id, {
        title: editTitle.trim() || null,
        location: editLocation.trim() || null,
        description: editDescription.trim() || null,
        featured: editFeatured,
        published: editPublished,
      });

      await updatePhotoCategories(
        editingPhoto.id,
        editCategories
      );

      await refreshPhotos();

      setEditMessage("Changes saved.");

      setTimeout(() => {
        setEditingPhoto(null);
        setEditMessage("");
      }, 700);
    } catch (error) {
      console.error(error);
      setEditMessage(
        error.message || "Could not save the changes."
      );
    } finally {
      setEditSaving(false);
    }
  }

  // --------------------------------------------------
  // PUBLISH / HIDE
  // --------------------------------------------------

  async function togglePublished(photo) {
    try {
      await updatePhoto(photo.id, {
        published: !photo.published,
      });

      await refreshPhotos();
    } catch (error) {
      console.error(error);
      setMessage("Could not change the visibility.");
    }
  }

  // --------------------------------------------------
  // FEATURED
  // --------------------------------------------------

  async function toggleFeatured(photo) {
    try {
      await updatePhoto(photo.id, {
        featured: !photo.featured,
      });

      await refreshPhotos();
    } catch (error) {
      console.error(error);
      setMessage("Could not change the featured status.");
    }
  }

  // --------------------------------------------------
  // DELETE
  // --------------------------------------------------

  async function deletePhoto(photo) {
    if (!supabase) return;

    const confirmed = window.confirm(
      `Delete "${
        photo.title || "this photograph"
      }"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await supabase.storage
        .from("photos")
        .remove([photo.storage_path]);

      const { error } = await supabase
        .from("photos")
        .delete()
        .eq("id", photo.id);

      if (error) throw error;

      await refreshPhotos();

      setMessage("Photo deleted.");
    } catch (error) {
      console.error(error);
      setMessage("Could not delete the photo.");
    }
  }

  // --------------------------------------------------
  // STATUS
  // --------------------------------------------------

  function getStatusText(fileName) {
    switch (uploadProgress[fileName]) {
      case "waiting":
        return "Waiting";
      case "optimizing":
        return "Optimizing";
      case "uploading":
        return "Uploading";
      case "saving":
        return "Saving";
      case "complete":
        return "Complete";
      case "failed":
        return "Failed";
      default:
        return "";
    }
  }

  function getStatusIcon(fileName) {
    const status = uploadProgress[fileName];

    if (status === "complete") {
      return <Check size={14} />;
    }

    if (status === "failed") {
      return <X size={14} />;
    }

    if (
      status === "optimizing" ||
      status === "uploading" ||
      status === "saving"
    ) {
      return (
        <Loader2
          size={14}
          className="animate-spin"
        />
      );
    }

    return null;
  }

  // --------------------------------------------------
  // AUTH LOADING
  // --------------------------------------------------

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] text-white">
        <Loader2
          size={24}
          className="animate-spin text-white/50"
        />
      </div>
    );
  }

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b] px-5 text-white">
        <div className="w-full max-w-md">

          <div className="mb-10 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              KONTRI
            </p>

            <h1 className="mt-4 font-display text-5xl">
              Private studio
            </h1>

            <p className="mt-4 text-sm leading-6 text-white/40">
              Sign in to manage your photography archive.
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="border border-white/10 bg-white/[0.02] p-7"
          >
            <div className="space-y-5">

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">
                  Email
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">
                  Password
                </span>

                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/50"
                />
              </label>

              {authMessage && (
                <div className="border border-red-400/20 bg-red-400/5 p-3 text-xs leading-5 text-red-200/70">
                  {authMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="flex w-full items-center justify-center gap-2 bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
              >
                {loginLoading && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                {loginLoading
                  ? "Signing in..."
                  : "Enter studio"}
              </button>
            </div>
          </form>

          <Link
            to="/"
            className="mt-6 flex items-center justify-center gap-2 text-xs text-white/35 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Return to portfolio
          </Link>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // CMS
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0b0b0b] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-12 flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Private studio
            </p>

            <h1 className="mt-2 font-display text-4xl">
              Photo manager
            </h1>
          </div>

          <div className="flex items-center gap-4">

            <Link
              to="/"
              className="hidden items-center gap-2 text-sm text-white/45 transition hover:text-white sm:flex"
            >
              <ArrowLeft size={16} />
              View site
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 border border-white/10 px-4 py-2 text-xs text-white/55 transition hover:bg-white hover:text-black"
            >
              <LogOut size={14} />
              Sign out
            </button>

          </div>
        </div>

        {/* UPLOAD */}
        <section className="mb-16">

          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Add to archive
              </p>

              <h2 className="mt-2 font-display text-3xl">
                Upload photographs
              </h2>
            </div>

            <span className="font-mono text-xs text-white/35">
              {selectedFiles.length}/{MAX_FILES}
            </span>
          </div>

          <div className="grid gap-8 border border-white/10 p-6 md:grid-cols-[1.2fr_1fr] md:p-8">

            {/* SELECT FILES */}
            <div>

              <label className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center border border-dashed border-white/15 bg-white/[0.02] p-8 text-center transition hover:bg-white/[0.04]">

                <ImagePlus
                  size={28}
                  className="mb-5 text-white/40"
                />

                <span className="text-sm">
                  Select up to 10 photographs
                </span>

                <span className="mt-2 max-w-xs text-xs leading-5 text-white/35">
                  JPEG, PNG and WebP are supported.
                  Images are automatically optimized.
                </span>

                <span className="mt-6 border border-white/15 px-5 py-2.5 text-xs transition hover:bg-white hover:text-black">
                  Choose photographs
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelection}
                  disabled={busy}
                />

              </label>

            </div>

            {/* METADATA */}
            <div>

              <div className="space-y-6">

                {/* LOCATION */}
                <label className="block">

                  <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35">
                    <MapPin size={13} />
                    Location
                  </span>

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Mulanje, Malawi"
                    disabled={busy}
                    className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/25 focus:border-white/50 disabled:opacity-50"
                  />

                  <span className="mt-2 block text-[11px] text-white/25">
                    Optional.
                  </span>

                </label>

                {/* CATEGORIES */}
                <div>

                  <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-white/35">
                    Categories
                  </span>

                  <div className="flex flex-wrap gap-2">

                    {categories.map((category) => {
                      const selected =
                        selectedCategories.includes(
                          category.id
                        );

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() =>
                            toggleCategory(category.id)
                          }
                          disabled={busy}
                          className={`border px-3 py-2 text-xs transition ${
                            selected
                              ? "border-white bg-white text-black"
                              : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}

                  </div>

                </div>

                {/* FEATURED */}
                <button
                  type="button"
                  onClick={() =>
                    setFeatured((current) => !current)
                  }
                  disabled={busy}
                  className={`flex w-full items-center gap-3 border p-4 text-left transition ${
                    featured
                      ? "border-white/30 bg-white/[0.06]"
                      : "border-white/10"
                  }`}
                >

                  <Star
                    size={17}
                    className={
                      featured
                        ? "fill-white text-white"
                        : "text-white/30"
                    }
                  />

                  <div>
                    <p className="text-sm">
                      Featured photograph
                    </p>

                    <p className="mt-1 text-[11px] text-white/30">
                      Featured photographs can appear
                      automatically in the homepage hero.
                    </p>
                  </div>

                </button>

                {/* DESCRIPTION */}
                <label className="block">

                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">
                    Description
                  </span>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    placeholder="A short story about these photographs..."
                    rows={4}
                    disabled={busy}
                    className="w-full resize-none border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-6 outline-none placeholder:text-white/25 focus:border-white/50 disabled:opacity-50"
                  />

                </label>

                {/* UPLOAD */}
                <button
                  type="button"
                  onClick={uploadPhotos}
                  disabled={
                    busy || selectedFiles.length === 0
                  }
                  className="flex w-full items-center justify-center gap-2 bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-30"
                >

                  {busy ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Upload{" "}
                      {selectedFiles.length
                        ? `${selectedFiles.length} ${
                            selectedFiles.length === 1
                              ? "photo"
                              : "photos"
                          }`
                        : "photos"}
                    </>
                  )}

                </button>

                {selectedFiles.length > 0 &&
                  !busy && (
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="w-full text-xs text-white/30 hover:text-white"
                    >
                      Clear selection
                    </button>
                  )}

              </div>

            </div>

          </div>
        </section>

        {/* QUEUE */}
        {selectedFiles.length > 0 && (
          <section className="mb-16">

            <div className="mb-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Upload queue
              </p>

              <h2 className="mt-2 font-display text-3xl">
                Selected photographs
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

              {selectedFiles.map((file, index) => {
                const previewUrl =
                  URL.createObjectURL(file);

                return (
                  <div
                    key={`${file.name}-${file.lastModified}-${index}`}
                    className="group relative overflow-hidden border border-white/10"
                  >

                    <div className="aspect-[4/5]">
                      <img
                        src={previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-12">

                      <p className="truncate text-xs text-white/70">
                        Selected photograph
                      </p>

                      {uploadProgress[file.name] && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-white/60">
                          {getStatusIcon(file.name)}
                          {getStatusText(file.name)}
                        </div>
                      )}

                    </div>

                    {!busy && (
                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedFile(index)
                        }
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white/60 hover:bg-white hover:text-black"
                      >
                        <X size={14} />
                      </button>
                    )}

                  </div>
                );
              })}

            </div>
          </section>
        )}

        {/* MESSAGE */}
        {message && (
          <div className="mb-12 border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60">
            {message}
          </div>
        )}

        {/* ARCHIVE */}
        <section>

          <div className="mb-5 flex items-end justify-between">

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Your collection
              </p>

              <h2 className="mt-2 font-display text-3xl">
                Archive
              </h2>
            </div>

            <span className="font-mono text-xs text-white/35">
              {photos.length}{" "}
              {photos.length === 1
                ? "image"
                : "images"}
            </span>

          </div>

          {photos.length === 0 ? (
            <div className="border border-dashed border-white/10 py-20 text-center">

              <p className="font-display text-2xl text-white/40">
                Your archive is empty.
              </p>

              <p className="mt-2 text-sm text-white/25">
                Upload your first photographs above.
              </p>

            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

              {photos.map((photo) => (
                <article
                  key={photo.id}
                  className="border border-white/10 bg-white/[0.02]"
                >

                  <div className="relative">

                    <img
                      src={photo.image_url}
                      alt={photo.title || ""}
                      className="aspect-[4/3] w-full object-cover"
                    />

                    <div className="absolute left-3 top-3 flex gap-2">

                      <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
                        {photo.published
                          ? "Published"
                          : "Hidden"}
                      </span>

                      {photo.featured && (
                        <span className="flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[10px] text-white/70 backdrop-blur">
                          <Star
                            size={10}
                            className="fill-white"
                          />
                          Featured
                        </span>
                      )}

                    </div>

                  </div>

                  <div className="p-4">

                    {photo.title ? (
                      <h3 className="truncate text-sm">
                        {photo.title}
                      </h3>
                    ) : (
                      <p className="text-sm text-white/35">
                        Untitled
                      </p>
                    )}

                    {photo.location && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/35">
                        <MapPin size={11} />
                        {photo.location}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-4 gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          openEditPhoto(photo)
                        }
                        className="flex items-center justify-center gap-1 border border-white/10 py-2 text-[11px] transition hover:bg-white hover:text-black"
                      >
                        <Edit3 size={13} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          togglePublished(photo)
                        }
                        className="flex items-center justify-center border border-white/10 py-2 text-[11px] hover:bg-white/5"
                        title={
                          photo.published
                            ? "Hide"
                            : "Publish"
                        }
                      >
                        {photo.published ? (
                          <Eye size={13} />
                        ) : (
                          <EyeOff size={13} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          toggleFeatured(photo)
                        }
                        className={`flex items-center justify-center border py-2 text-[11px] ${
                          photo.featured
                            ? "border-white/30 bg-white/10"
                            : "border-white/10"
                        }`}
                        title="Toggle featured"
                      >
                        <Star
                          size={13}
                          className={
                            photo.featured
                              ? "fill-white"
                              : ""
                          }
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deletePhoto(photo)
                        }
                        className="flex items-center justify-center border border-white/10 py-2 text-[11px] hover:bg-white hover:text-black"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>
          )}

        </section>
      </div>

      {/* --------------------------------------------------
          EDIT MODAL
      -------------------------------------------------- */}

      {editingPhoto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-5 backdrop-blur-md">

          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#111111]">

            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 p-6">

              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                  Edit photograph
                </p>

                <h2 className="mt-2 font-display text-3xl">
                  Curate this frame
                </h2>
              </div>

              <button
                type="button"
                onClick={closeEditPhoto}
                disabled={editSaving}
                className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/50 transition hover:bg-white hover:text-black"
              >
                <X size={17} />
              </button>

            </div>

            {/* PHOTO */}
            <div className="grid md:grid-cols-[220px_1fr]">

              <div className="border-b border-white/10 md:border-b-0 md:border-r">
                <img
                  src={editingPhoto.image_url}
                  alt=""
                  className="aspect-[4/5] h-full w-full object-cover"
                />
              </div>

              {/* FORM */}
              <div className="p-6">

                <div className="space-y-6">

                  {/* TITLE */}
                  <label className="block">

                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">
                      Title
                    </span>

                    <input
                      value={editTitle}
                      onChange={(event) =>
                        setEditTitle(event.target.value)
                      }
                      placeholder="Leave blank for no title"
                      disabled={editSaving}
                      className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/50"
                    />

                  </label>

                  {/* LOCATION */}
                  <label className="block">

                    <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35">
                      <MapPin size={13} />
                      Location
                    </span>

                    <input
                      value={editLocation}
                      onChange={(event) =>
                        setEditLocation(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Mulanje, Malawi"
                      disabled={editSaving}
                      className="w-full border-b border-white/15 bg-transparent px-0 py-3 text-sm outline-none placeholder:text-white/20 focus:border-white/50"
                    />

                  </label>

                  {/* CATEGORIES */}
                  <div>

                    <span className="mb-3 block text-xs uppercase tracking-[0.2em] text-white/35">
                      Categories
                    </span>

                    <div className="flex flex-wrap gap-2">

                      {categories.map((category) => {
                        const selected =
                          editCategories.includes(
                            category.id
                          );

                        return (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() =>
                              toggleEditCategory(
                                category.id
                              )
                            }
                            disabled={editSaving}
                            className={`border px-3 py-2 text-xs transition ${
                              selected
                                ? "border-white bg-white text-black"
                                : "border-white/10 text-white/45 hover:border-white/30 hover:text-white"
                            }`}
                          >
                            {category.name}
                          </button>
                        );
                      })}

                    </div>

                  </div>

                  {/* DESCRIPTION */}
                  <label className="block">

                    <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/35">
                      Description
                    </span>

                    <textarea
                      value={editDescription}
                      onChange={(event) =>
                        setEditDescription(
                          event.target.value
                        )
                      }
                      placeholder="Tell the story behind this photograph..."
                      rows={5}
                      disabled={editSaving}
                      className="w-full resize-none border-b border-white/15 bg-transparent px-0 py-3 text-sm leading-6 outline-none placeholder:text-white/20 focus:border-white/50"
                    />

                  </label>

                  {/* FEATURED */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditFeatured(
                        (current) => !current
                      )
                    }
                    disabled={editSaving}
                    className={`flex w-full items-center gap-3 border p-4 text-left transition ${
                      editFeatured
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/10"
                    }`}
                  >

                    <Star
                      size={17}
                      className={
                        editFeatured
                          ? "fill-white"
                          : "text-white/30"
                      }
                    />

                    <div>
                      <p className="text-sm">
                        Featured
                      </p>

                      <p className="mt-1 text-[11px] text-white/30">
                        Allows this photograph to be
                        selected for the automatic hero.
                      </p>
                    </div>

                  </button>

                  {/* PUBLISHED */}
                  <button
                    type="button"
                    onClick={() =>
                      setEditPublished(
                        (current) => !current
                      )
                    }
                    disabled={editSaving}
                    className={`flex w-full items-center gap-3 border p-4 text-left transition ${
                      editPublished
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/10"
                    }`}
                  >

                    {editPublished ? (
                      <Eye size={17} />
                    ) : (
                      <EyeOff size={17} />
                    )}

                    <div>
                      <p className="text-sm">
                        Published
                      </p>

                      <p className="mt-1 text-[11px] text-white/30">
                        Controls whether visitors can see
                        this photograph.
                      </p>
                    </div>

                  </button>

                  {/* ERROR / SUCCESS */}
                  {editMessage && (
                    <div className="border border-white/10 bg-white/[0.03] p-3 text-xs text-white/60">
                      {editMessage}
                    </div>
                  )}

                  {/* SAVE */}
                  <button
                    type="button"
                    onClick={savePhotoEdits}
                    disabled={editSaving}
                    className="flex w-full items-center justify-center gap-2 bg-white px-5 py-3.5 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-40"
                  >

                    {editSaving ? (
                      <>
                        <Loader2
                          size={16}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save changes
                      </>
                    )}

                  </button>

                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}