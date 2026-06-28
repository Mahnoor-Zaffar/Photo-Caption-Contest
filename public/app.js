const API = window.location.origin + "/api";
let token = localStorage.getItem("token") || "";
let currentImageId = null;

const headers = () => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: "Bearer " + token } : {}),
});

const setStatus = (msg) => {
  document.getElementById("userLabel").textContent = msg;
};

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { ...headers(), ...opts.headers },
  });
  const data = await res.json();
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
  const { data } = await api("/images");
  const grid = document.getElementById("imageGrid");
  grid.innerHTML = data
    .map(
      (img, i) => `
    <article class="template-card" data-id="${img.id}">
      <img src="${img.url}" alt="${img.title}" loading="lazy" />
      <div class="template-card-body">${img.title}</div>
    </article>
  `,
    )
    .join("");

  grid.querySelectorAll(".template-card").forEach((card) => {
    card.onclick = () => openImage(card.dataset.id);
  });
}

async function openImage(id) {
  currentImageId = id;
  const { data } = await api(`/images/${id}?page=1&limit=20`);

  document.getElementById("heroSection").style.display = "none";
  document.getElementById("authSection").style.display = "none";
  document.getElementById("gallery").style.display = "none";
  document.getElementById("detail").classList.add("active");

  document.getElementById("detailImg").src = data.url;
  document.getElementById("detailTitle").textContent = data.title;
  document.getElementById("detailDesc").textContent = data.description || "";
  renderCaptions(data.captions);
}

function renderCaptions(captions) {
  const list = document.getElementById("captionList");
  if (!captions.length) {
    list.innerHTML = '<p class="detail-desc">No captions yet. Be the first!</p>';
    return;
  }

  list.innerHTML = captions
    .map(
      (c) => `
    <div class="caption-card">
      <div class="caption-text">${escapeHtml(c.text)}</div>
      <div class="caption-meta">by ${escapeHtml(c.author)} · ${c.voteCount} votes</div>
      ${token ? `<button class="btn btn-secondary voteBtn" data-id="${c.id}" style="margin-top:12px;width:auto">Vote</button>` : ""}
    </div>
  `,
    )
    .join("");

  list.querySelectorAll(".voteBtn").forEach((btn) => {
    btn.onclick = async () => {
      try {
        await api(`/captions/${btn.dataset.id}/votes`, { method: "POST" });
        openImage(currentImageId);
      } catch (e) {
        alert(e.message);
      }
    };
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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

document.getElementById("loginBtn").onclick = async () => {
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
  } catch (e) {
    alert(e.message);
  }
};

document.getElementById("registerBtn").onclick = async () => {
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
  } catch (e) {
    alert(e.message);
  }
};

document.getElementById("logoutBtn").onclick = async () => {
  await api("/auth/logout", { method: "POST" }).catch(() => {});
  token = "";
  localStorage.removeItem("token");
  showAuth("login");
  setStatus("Not signed in");
};

document.getElementById("submitCaptionBtn").onclick = async () => {
  try {
    await api(`/images/${currentImageId}/captions`, {
      method: "POST",
      body: JSON.stringify({ text: captionText.value }),
    });
    captionText.value = "";
    openImage(currentImageId);
  } catch (e) {
    alert(e.message);
  }
};

loadMe();
loadImages();
