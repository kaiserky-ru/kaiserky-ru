import { supabase, escapeHtml } from "./supabase.js";

const boardsEl = document.querySelector("#boards");

async function loadBoards() {
  const { data, error } = await supabase
    .from("boards")
    .select("slug,name,description")
    .eq("is_public", true)
    .order("slug");

  if (error) {
    boardsEl.innerHTML = `<p class="error">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    boardsEl.innerHTML = "<p>No boards configured.</p>";
    return;
  }

  boardsEl.innerHTML = data.map(board => `
    <a class="board-card" href="board.html?board=${encodeURIComponent(board.slug)}">
      <strong>/${escapeHtml(board.slug)}/ — ${escapeHtml(board.name)}</strong>
      <span>${escapeHtml(board.description || "")}</span>
    </a>
  `).join("");
}

loadBoards();
