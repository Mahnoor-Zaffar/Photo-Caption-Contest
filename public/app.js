const API = window.location.origin + "/api";
let token = localStorage.getItem("token") || "";
let currentImageId = null;
let captionSort = "votes";
let currentUsername = "";
let myVoteCaptionId = null;
let pendingAuthAction = null;

const headers = () => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: "Bearer " + token } : {}),
});

const setStatus = (msg) => {
  document.getElementById("userLabel").textContent = msg;
};

function showToast(message, type = "error") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove("show"), 4000);
}

function setLoading(id, isLoading) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("loading", isLoading);
  el.setAttribute("aria-busy", isLoading ? "true" : "false");
}

function renderSkeletonGallery(count = 6) {
  const grid = document.getElementById("imageGrid");
  grid.innerHTML = Array.from({ length: count }, () => `
    <article class="template-card skeleton-card" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-body">
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </article>
  `).join("");
}

async function refreshToken() {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw new Error(data.message || "Refresh failed");
  token = data.data.token;
  localStorage.setItem("token", token);
  return token;
}

async function parseJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("Server unavailable — try again in a moment");
  }
}

function getApiErrorMessage(data, fallback = "Request failed") {
  if (data?.message) return data.message;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((e) => e.message).filter(Boolean).join(" · ");
  }
  return fallback;
}

async function api(path, opts = {}, retried = false) {
  const res = await fetch(API + path, {
    credentials: "include",
    ...opts,
    headers: { ...headers(), ...opts.headers },
  });
  const data = await parseJsonResponse(res);

  if (res.status === 401 && token && !retried && !path.includes("/auth/")) {
    try {
      await refreshToken();
      return api(path, opts, true);
    } catch {
      token = "";
      localStorage.removeItem("token");
      updateNavAuth();
      setStatus("Browse contests — no sign-in needed");
      showToast("Session expired — please sign in again", "error");
      throw new Error("Session expired");
    }
  }

  if (!res.ok) throw new Error(getApiErrorMessage(data));
  return data;
}

function showAuth(state) {
  document.getElementById("loginForm").classList.toggle("hidden", state !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", state !== "register");
  document.getElementById("authTitle").textContent = state === "register" ? "Create account" : "Sign in";
}

function openAuthModal(state = "login", afterAuth = null) {
  pendingAuthAction = afterAuth;
  showAuth(state);
  document.getElementById("authModal").classList.remove("hidden");
  document.getElementById("loginEmail")?.focus();
}

function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
  pendingAuthAction = null;
}

function updateNavAuth() {
  const signedIn = Boolean(token && currentUsername);
  document.getElementById("navSignIn").classList.toggle("hidden", signedIn);
  document.getElementById("navSignOut").classList.toggle("hidden", !signedIn);
}

async function loadMe() {
  if (!token) {
    currentUsername = "";
    updateNavAuth();
    setStatus("Browse contests — no sign-in needed");
    return;
  }
  try {
    const { data } = await api("/auth/me");
    currentUsername = data.username;
    updateNavAuth();
    setStatus("Signed in as " + data.username);
  } catch {
    token = "";
    currentUsername = "";
    localStorage.removeItem("token");
    updateNavAuth();
    setStatus("Browse contests — no sign-in needed");
  }
}

async function completeAuth(data) {
  token = data.token;
  localStorage.setItem("token", token);
  await loadMe();
  closeAuthModal();
  const action = pendingAuthAction;
  pendingAuthAction = null;
  if (action) {
    await action();
  } else if (currentImageId) {
    await openImage(currentImageId);
  }
}

function requireAuth(action, modalState = "login") {
  if (token) return action();
  openAuthModal(modalState, action);
}

async function loadImages() {
  const grid = document.getElementById("imageGrid");
  grid.setAttribute("aria-busy", "true");
  renderSkeletonGallery();

  try {
    const { data } = await api("/images");
    if (!data.length) {
      grid.innerHTML = '<p class="detail-desc">No contest images yet.</p>';
      return;
    }
    grid.innerHTML = data
      .map(
        (img) => `
      <article class="template-card" data-id="${img.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(img.title)}">
        <img src="${img.url}" alt="${escapeHtml(img.title)}" loading="lazy" />
        <div class="template-card-body">
          ${escapeHtml(img.title)}
          ${img.status === "closed" ? '<span class="status-badge closed">Closed</span>' : '<span class="status-badge open">Open</span>'}
        </div>
      </article>
    `,
      )
      .join("");

    grid.querySelectorAll(".template-card").forEach((card) => {
      const open = () => openImage(card.dataset.id);
      card.onclick = open;
      card.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      };
    });
  } catch (e) {
    showToast(e.message);
    grid.innerHTML = `
      <div class="gallery-error">
        <p class="detail-desc">Couldn't load contests.</p>
        <button type="button" class="btn btn-secondary" id="retryGallery">Retry</button>
      </div>`;
    document.getElementById("retryGallery")?.addEventListener("click", loadImages);
  } finally {
    grid.setAttribute("aria-busy", "false");
  }
}

function updateCaptionForm(isClosed) {
  const showForm = !isClosed && token;
  const showPrompt = !isClosed && !token;
  document.getElementById("captionForm").classList.toggle("hidden", !showForm);
  document.getElementById("captionSignInPrompt").classList.toggle("hidden", !showPrompt);
}

async function openImage(id) {
  currentImageId = id;
  setLoading("captionList", true);
  history.replaceState({ imageId: id }, "", `?image=${id}`);

  try {
    const { data } = await api(
      `/images/${id}?page=1&limit=20&sort=${captionSort}`,
    );

    document.getElementById("heroSection").style.display = "none";
    document.getElementById("gallery").style.display = "none";
    document.getElementById("detail").classList.add("active");

    document.getElementById("detailImg").src = data.url;
    document.getElementById("detailTitle").textContent = data.title;
    document.getElementById("detailDesc").textContent = data.description || "";
    myVoteCaptionId = data.myVoteCaptionId || null;

    const isClosed = data.status === "closed";
    const statusEl = document.getElementById("contestStatus");
    statusEl.textContent = isClosed ? "This contest is closed." : "Contest open — submit and vote!";
    statusEl.className = `contest-status ${isClosed ? "closed" : "open"}`;

    updateCaptionForm(isClosed);

    if (isClosed) {
      await loadWinner(id);
    } else {
      document.getElementById("winnerPanel").classList.add("hidden");
    }

    renderCaptions(data.captions, isClosed);
  } catch (e) {
    showToast(e.message);
  } finally {
    setLoading("captionList", false);
  }
}

function renderCaptions(captions, isClosed = false) {
  const list = document.getElementById("captionList");
  if (!captions.length) {
    list.innerHTML = '<p class="detail-desc">No captions yet. Be the first!</p>';
    return;
  }

  list.innerHTML = captions
    .map(
      (c, i) => {
        const isMine = c.author === currentUsername;
        const isMyVote = myVoteCaptionId === c.id;
        const voteLabel = myVoteCaptionId && !isMyVote ? "Move vote here" : "Vote";
        const canVote = token && !isMine && !isClosed;
        const showSignInVote = !token && !isClosed;

        return `
    <div class="caption-card${isMyVote ? " caption-voted" : ""}">
      ${captionSort === "votes" && i === 0 ? '<span class="leader-badge">Top caption</span>' : ""}
      ${isMyVote ? '<span class="leader-badge vote-badge">Your vote</span>' : ""}
      <div class="caption-text">${escapeHtml(c.text)}</div>
      <div class="caption-meta">by ${escapeHtml(c.author)} · ${c.voteCount} votes</div>
      ${canVote ? `<button class="btn btn-secondary voteBtn" data-id="${c.id}" style="margin-top:12px;width:auto" aria-label="${voteLabel} for caption by ${escapeHtml(c.author)}">${voteLabel}</button>` : ""}
      ${showSignInVote ? `<button class="btn btn-secondary signInVoteBtn" data-id="${c.id}" style="margin-top:12px;width:auto">Sign in to vote</button>` : ""}
    </div>
  `;
      },
    )
    .join("");

  list.querySelectorAll(".voteBtn").forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        const result = await api(`/captions/${btn.dataset.id}/votes`, { method: "POST" });
        showToast(result.data?.moved ? "Vote moved!" : "Vote recorded!", "success");
        openImage(currentImageId);
      } catch (e) {
        showToast(e.message);
        btn.disabled = false;
      }
    };
  });

  list.querySelectorAll(".signInVoteBtn").forEach((btn) => {
    btn.onclick = () => {
      requireAuth(async () => {
        await openImage(currentImageId);
        const voteBtn = document.querySelector(`.voteBtn[data-id="${btn.dataset.id}"]`);
        voteBtn?.click();
      });
    };
  });
}

async function loadWinner(imageId) {
  const panel = document.getElementById("winnerPanel");
  try {
    const { data } = await api(`/images/${imageId}/winner`);
    panel.classList.remove("hidden");
    panel.innerHTML = `
      <h3 class="section-title" style="font-size:18px;margin-bottom:8px">🏆 Contest winner</h3>
      <div class="caption-card caption-voted">
        <div class="caption-text">${escapeHtml(data.winner.text)}</div>
        <div class="caption-meta">by ${escapeHtml(data.winner.author)} · ${data.winner.voteCount} votes</div>
      </div>
    `;
  } catch {
    panel.classList.add("hidden");
    panel.innerHTML = "";
  }
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function setSort(sort) {
  captionSort = sort;
  document.getElementById("sortRecent").classList.toggle("active", sort === "recent");
  document.getElementById("sortVotes").classList.toggle("active", sort === "votes");
  document.getElementById("sortRecent").setAttribute("aria-pressed", sort === "recent");
  document.getElementById("sortVotes").setAttribute("aria-pressed", sort === "votes");
  if (currentImageId) openImage(currentImageId);
}

document.getElementById("backBtn").onclick = () => {
  document.getElementById("detail").classList.remove("active");
  document.getElementById("heroSection").style.display = "block";
  document.getElementById("gallery").style.display = "block";
  currentImageId = null;
  history.replaceState({}, "", window.location.pathname);
};

document.getElementById("shareBtn").onclick = async () => {
  const url = window.location.href;
  try {
    if (navigator.share) {
      await navigator.share({ title: "Photo Caption Contest", url });
    } else {
      await navigator.clipboard.writeText(url);
      showToast("Link copied!", "success");
    }
  } catch {
    showToast("Could not share link");
  }
};

function updateCharCount() {
  const len = captionText.value.length;
  charCount.textContent = `${len} / 280`;
  charCount.classList.toggle("char-count-warn", len >= 260);
}

document.getElementById("captionText").addEventListener("input", updateCharCount);

document.getElementById("navSignIn").onclick = () => openAuthModal("login");
document.getElementById("authModalClose").onclick = closeAuthModal;
document.getElementById("authModalBackdrop").onclick = closeAuthModal;
document.getElementById("captionSignInBtn").onclick = () => {
  openAuthModal("login", async () => {
    if (currentImageId) await openImage(currentImageId);
  });
};

document.getElementById("showRegister").onclick = (e) => {
  e.preventDefault();
  showAuth("register");
};

document.getElementById("showLogin").onclick = (e) => {
  e.preventDefault();
  showAuth("login");
};

document.getElementById("sortRecent").onclick = () => setSort("recent");
document.getElementById("sortVotes").onclick = () => setSort("votes");

document.getElementById("loginBtn").onclick = async () => {
  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  try {
    const { data } = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value,
      }),
    });
    await completeAuth(data);
    showToast("Welcome back!", "success");
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    btn.disabled = false;
  }
};

document.getElementById("registerBtn").onclick = async () => {
  const btn = document.getElementById("registerBtn");
  btn.disabled = true;
  try {
    const { data } = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: regUsername.value,
        email: regEmail.value,
        password: regPassword.value,
      }),
    });
    await completeAuth(data);
    showToast("Account created!", "success");
  } catch (e) {
    showToast(e.message, "error");
  } finally {
    btn.disabled = false;
  }
};

document.getElementById("navSignOut").onclick = async () => {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  token = "";
  currentUsername = "";
  myVoteCaptionId = null;
  localStorage.removeItem("token");
  updateNavAuth();
  setStatus("Browse contests — no sign-in needed");
  showToast("Signed out", "success");
  if (currentImageId) openImage(currentImageId);
};

document.getElementById("submitCaptionBtn").onclick = async () => {
  requireAuth(async () => {
    const btn = document.getElementById("submitCaptionBtn");
    btn.disabled = true;
    try {
      await api(`/images/${currentImageId}/captions`, {
        method: "POST",
        body: JSON.stringify({ text: captionText.value }),
      });
      captionText.value = "";
      updateCharCount();
      showToast("Caption submitted!", "success");
      openImage(currentImageId);
    } catch (e) {
      showToast(e.message);
    } finally {
      btn.disabled = false;
    }
  });
};

async function waitForApi() {
  const overlay = document.getElementById("wakeOverlay");
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

  for (let attempt = 0; attempt < (isLocal ? 3 : 30); attempt += 1) {
    try {
      const res = await fetch(`${API}/health/live`, { credentials: "include" });
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data?.data?.app === "photo-caption-contest") {
          overlay.classList.add("hidden");
          return;
        }
      }
    } catch {
      // Server may be cold-starting on Render
    }
    await new Promise((r) => setTimeout(r, isLocal ? 500 : 2000));
  }

  overlay.classList.add("hidden");
}

async function boot() {
  await waitForApi();
  await loadMe();
  await loadImages();

  const imageId = new URLSearchParams(window.location.search).get("image");
  if (imageId) {
    openImage(imageId);
  }
}

boot();
