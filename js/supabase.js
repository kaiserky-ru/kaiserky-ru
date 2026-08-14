const config = window.IMAGEBOARD_CONFIG;

if (!config?.SUPABASE_URL || !config?.SUPABASE_ANON_KEY ||
    config.SUPABASE_URL.includes("YOUR_PROJECT") ||
    config.SUPABASE_ANON_KEY.includes("YOUR_PUBLIC")) {
  throw new Error("Configure js/config.js with your Supabase URL and public anon/publishable key.");
}

export const supabase = window.supabase.createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY
);

export const IMAGE_BUCKET = "images";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
]);

export function getPosterId() {
  const key = "imageboard-poster-id";
  let id = localStorage.getItem(key);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }

  return id;
}

export function getBoardName() {
  return new URLSearchParams(location.search).get("board") || "b";
}

export function getThreadId() {
  const value = new URLSearchParams(location.search).get("id");
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

export function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export async function uploadImage(file) {
  if (!file) return null;

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type.");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image is larger than 5 MB.");
  }

  const extension = ({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp"
  })[file.type];

  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(IMAGE_BUCKET)
    .getPublicUrl(path);

  return {
    path,
    url: data.publicUrl,
    width: null,
    height: null
  };
}

export function showStatus(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}
