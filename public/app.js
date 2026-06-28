const API = window.location.origin + "/api";
let token = localStorage.getItem("token") || "";
let currentImageId = null;
let captionSort = "votes";

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

async function refreshToken() {
  const res = await fetch(`${API}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Refresh failed");
  token = data.data.token;
  localStorage.setItem("token", token);
  return token;
}

async function api(path, opts = {}, retried = false) {
  const res = await fetch(API + path, {
    credentials: "include",
    ...opts,
    headers: { ...headers(), ...opts.headers },
  });
  const data = await res.json();

  if (res.status === 401 && token && !retried && !path.includes("/auth/")) {
    try {
      await refreshToken();
      return api(path, opts, true);
    } catch {
      token = "";
      localStorage.removeItem("token");
      showAuth("login");
      setStatus("Session expired");
      showToast("Session expired — please sign in again", "error");
      throw new Error("Session expired");
    }
  }

  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

function showAuth(state) {
  document.getElementById("loginForm").classList.toggle("hidden", state !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", state !== "register");
  document.getElementById("loggedInPanel").classList.toggle("hidden", state !== "loggedIn");
  document.getElementById("captionForm").classList.toggle("hidden", state !== "loggedIn");
}

async function loadMe() {
  if (!token) {
    showAuth("login");
    setStatus("Not signed in");
    return;
  }
  try {
    const { data } = await api("/auth/me");
    document.getElementById("usernameDisplay").textContent = data.username;
    showAuth("loggedIn");
    setStatus("Signed in as " + data.username);
  } catch {
    token = "";
    localStorage.removeItem("token");
    showAuth("login");
    setStatus("Not signed in");
  }
}

async function loadImages() {
  setLoading("imageGrid", true);
  try {
    const { data } = await api("/images");
    const grid = document.getElementById("imageGrid");
    if (!data.length) {
      grid.innerHTML = '<p class="detail-desc">No contest images yet.</p>';
      return;
    }
    grid.innerHTML = data
      .map(
        (img) => `
      <article class="template-card" data-id="${img.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(img.title)}">
        <img src="${img.url}" alt="${escapeHtml(img.title)}" loading="lazy" />
        <div class="template-card-body">${escapeHtml(img.title)}</div>
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
  } finally {
    setLoading("imageGrid", false);
  }
}

async function openImage(id) {
  currentImageId = id;
  setLoading("captionList", true);

  try {
    const { data } = await api(
      `/images/${id}?page=1&limit=20&sort=${captionSort}`,
    );

    document.getElementById("heroSection").style.display = "none";
    document.getElementById("authSection").style.display = "none";
    document.getElementById("gallery").style.display = "none";
    document.getElementById("detail").classList.add("active");

    document.getElementById("detailImg").src = data.url;
    document.getElementById("detailTitle").textContent = data.title;
    document.getElementById("detailDesc").textContent = data.description || "";
    renderCaptions(data.captions);
  } catch (e) {
    showToast(e.message);
  } finally {
    setLoading("captionList", false);
  }
}

function renderCaptions(captions) {
  const list = document.getElementById("captionList");
  if (!captions.length) {
    list.innerHTML = '<p class="detail-desc">No captions yet. Be the first!</p>';
    return;
  }

  list.innerHTML = captions
    .map(
      (c, i) => `
    <div class="caption-card">
      ${captionSort === "votes" && i === 0 ? '<span class="leader-badge">Top caption</span>' : ""}
      <div class="caption-text">${escapeHtml(c.text)}</div>
      <div class="caption-meta">by ${escapeHtml(c.author)} · ${c.voteCount} votes</div>
      ${token ? `<button class="btn btn-secondary voteBtn" data-id="${c.id}" style="margin-top:12px;width:auto" aria-label="Vote for caption by ${escapeHtml(c.author)}">Vote</button>` : ""}
    </div>
  `,
    )
    .join("");

  list.querySelectorAll(".voteBtn").forEach((btn) => {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await api(`/captions/${btn.dataset.id}/votes`, { method: "POST" });
        showToast("Vote recorded!", "success");
        openImage(currentImageId);
      } catch (e) {
        showToast(e.message);
        btn.disabled = false;
      }
    };
  });
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
  document.getElementById("authSection").style.display = "block";
  document.getElementById("gallery").style.display = "block";
};

document.getElementById("showRegister").onclick = (e) => {
  e.preventDefault();
  showAuth("register");
  document.getElementById("authTitle").textContent = "Create account";
};

document.getElementById("showLogin").onclick = (e) => {
  e.preventDefault();
  showAuth("login");
  document.getElementById("authTitle").textContent = "Sign in";
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
    token = data.token;
    localStorage.setItem("token", token);
    await loadMe();
    showToast("Welcome back!", "success");
  } catch (e) {
    showToast(e.message);
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
    token = data.token;
    localStorage.setItem("token", token);
    await loadMe();
    showToast("Account created!", "success");
  } catch (e) {
    showToast(e.message);
  } finally {
    btn.disabled = false;
  }
};

document.getElementById("logoutBtn").onclick = async () => {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  token = "";
  localStorage.removeItem("token");
  showAuth("login");
  setStatus("Not signed in");
  showToast("Signed out", "success");
};

document.getElementById("submitCaptionBtn").onclick = async () => {
  const btn = document.getElementById("submitCaptionBtn");
  btn.disabled = true;
  try {
    await api(`/images/${currentImageId}/captions`, {
      method: "POST",
      body: JSON.stringify({ text: captionText.value }),
    });
    captionText.value = "";
    showToast("Caption submitted!", "success");
    openImage(currentImageId);
  } catch (e) {
    showToast(e.message);
  } finally {
    btn.disabled = false;
  }
};

loadMe();
loadImages();
