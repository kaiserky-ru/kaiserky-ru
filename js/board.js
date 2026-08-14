import {
  supabase, getBoardName, getPosterId, uploadImage,
  escapeHtml, formatDate, showStatus
} from "./supabase.js";

const board = getBoardName();
const PAGE_SIZE = 15;
const page = Math.max(0, Number(new URLSearchParams(location.search).get("page") || 0));

const heading = document.querySelector("#board-heading");
const threadsEl = document.querySelector("#threads");
const form = document.querySelector("#thread-form");
const status = document.querySelector("#form-status");
const refresh = document.querySelector("#refresh");
const pagination = document.querySelector("#pagination");

let boardRecord = null;

async function loadBoard() {
  const { data, error } = await supabase
    .from("boards")
    .select("id,slug,name,description")
    .eq("slug", board)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !data) {
    heading.textContent = "Board not found";
    threadsEl.innerHTML = `<p class="error">${escapeHtml(error?.message || "Unknown board.")}</p>`;
    form.hidden = true;
    return false;
  }

  boardRecord = data;
  heading.textContent = `/${data.slug}/ — ${data.name}`;
  document.title = `/${data.slug}/ — ${data.name}`;
  return true;
}

function threadHtml(thread) {
  const image = thread.image_url
    ? `<a href="${escapeHtml(thread.image_url)}" target="_blank" rel="noopener">
         <img class="thumb" src="${escapeHtml(thread.image_url)}" alt="Thread image" loading="lazy">
       </a>`
    : "";

  return `
    <article class="thread">
      <div class="post-header">
        <span class="subject">${escapeHtml(thread.subject || "No subject")}</span>
        <span>Anonymous</span>
        <time>${escapeHtml(formatDate(thread.created_at))}</time>
        <a href="thread.html?board=${encodeURIComponent(board)}&id=${thread.id}">No.${thread.id}</a>
      </div>
      ${image}
      <div class="post-body">${escapeHtml(thread.comment).replace(/\n/g, "<br>")}</div>
      <div class="thread-meta">${thread.reply_count} ${thread.reply_count === 1 ? "reply" : "replies"}</div>
    </article>
  `;
}

async function loadThreads() {
  threadsEl.innerHTML = "<p>Loading threads…</p>";

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("threads")
    .select("*", { count: "exact" })
    .eq("board_id", boardRecord.id)
    .order("bumped_at", { ascending: false })
    .range(from, to);

  if (error) {
    threadsEl.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    return;
  }

  threadsEl.innerHTML = data?.length
    ? data.map(threadHtml).join("")
    : "<p>No threads yet. Start one above.</p>";

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  const links = [];

  if (page > 0) {
    links.push(`<a href="board.html?board=${encodeURIComponent(board)}&page=${page - 1}">← Newer</a>`);
  }

  if (page + 1 < totalPages) {
    links.push(`<a href="board.html?board=${encodeURIComponent(board)}&page=${page + 1}">Older →</a>`);
  }

  pagination.innerHTML = links.join(" · ");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  showStatus(status, "Posting…");

  try {
    const subject = document.querySelector("#subject").value.trim();
    const comment = document.querySelector("#comment").value.trim();
    const file = document.querySelector("#image").files[0];

    if (!comment) throw new Error("Comment is required.");

    let image = null;
    if (file) image = await uploadImage(file);

    const { data, error } = await supabase
      .from("threads")
      .insert({
        board_id: boardRecord.id,
        subject: subject || null,
        comment,
        poster_id: getPosterId(),
        image_path: image?.path || null,
        image_url: image?.url || null
      })
      .select("id")
      .single();

    if (error) throw error;

    location.href = `thread.html?board=${encodeURIComponent(board)}&id=${data.id}`;
  } catch (error) {
    showStatus(status, error.message || "Could not post.", true);
  }
});

refresh.addEventListener("click", loadThreads);

if (await loadBoard()) {
  await loadThreads();
}
