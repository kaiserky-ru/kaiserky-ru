import {
  supabase, getBoardName, getThreadId, getPosterId, uploadImage,
  escapeHtml, formatDate, showStatus
} from "./supabase.js";

const board = getBoardName();
const threadId = getThreadId();

const postsEl = document.querySelector("#posts");
const heading = document.querySelector("#thread-heading");
const form = document.querySelector("#reply-form");
const status = document.querySelector("#form-status");
const refresh = document.querySelector("#refresh");
const backBoard = document.querySelector("#back-board");

if (!threadId) {
  heading.textContent = "Invalid thread";
  form.hidden = true;
}

backBoard.href = `board.html?board=${encodeURIComponent(board)}`;

function postHtml(post) {
  const image = post.image_url
    ? `<a href="${escapeHtml(post.image_url)}" target="_blank" rel="noopener">
         <img class="thumb" src="${escapeHtml(post.image_url)}" alt="Post image" loading="lazy">
       </a>`
    : "";

  return `
    <article class="post">
      <div class="post-header">
        <span>Anonymous</span>
        <time>${escapeHtml(formatDate(post.created_at))}</time>
        <span>No.${post.id}</span>
      </div>
      ${image}
      <div class="post-body">${escapeHtml(post.comment).replace(/\n/g, "<br>")}</div>
    </article>
  `;
}

async function loadThread() {
  postsEl.innerHTML = "<p>Loading thread…</p>";

  const { data, error } = await supabase
    .from("posts")
    .select("id,thread_id,comment,created_at,image_url,poster_id")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    postsEl.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    postsEl.innerHTML = "<p>Thread not found or has no posts.</p>";
    return;
  }

  const thread = data[0];
  heading.textContent = `/${board}/ — Thread No.${threadId}`;
  document.title = `Thread No.${threadId}`;

  postsEl.innerHTML = data.map(postHtml).join("");
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  showStatus(status, "Posting…");

  try {
    const comment = document.querySelector("#comment").value.trim();
    const file = document.querySelector("#image").files[0];

    if (!comment) throw new Error("Comment is required.");

    let image = null;
    if (file) image = await uploadImage(file);

    const { error } = await supabase
      .from("posts")
      .insert({
        thread_id: threadId,
        comment,
        poster_id: getPosterId(),
        image_path: image?.path || null,
        image_url: image?.url || null
      });

    if (error) throw error;

    form.reset();
    showStatus(status, "Posted.");
    await loadThread();
  } catch (error) {
    showStatus(status, error.message || "Could not post.", true);
  }
});

refresh.addEventListener("click", loadThread);

if (threadId) await loadThread();
