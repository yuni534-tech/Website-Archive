"use strict";

const TAGS = ["쇼핑", "게임", "운동", "정보", "컴퓨터", "아이돌", "공부", "AI", "기타"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_LIMIT = 2 * 1024 * 1024;
const STORAGE_KEY = "wa-demo-v1";
const DEMO_USER = { id: "demo", nickname: "moon" };

function exampleImage(id) {
  return "https://images.unsplash.com/" + id + "?auto=format&fit=crop&w=1200&q=82";
}

const EXAMPLE_POSTS = [
  {
    id: "games", author: DEMO_USER, title: "미니게임 세 개를 만들었어요",
    tag: "게임", aiUsed: true, url: "https://example.com/",
    image: exampleImage("photo-1550745165-9bc0b252726f"),
    description: "세 게임을 한 화면에 모았어요. 방향키로 움직이고, 한 판은 짧아요.",
    ratings: [{ userId: "sora", score: 5 }, { userId: "jun", score: 4 }],
    comments: [
      { id: "example-1", author: { id: "sora", nickname: "sora" }, text: "짧게 한 판 하기 좋아요!" },
      { id: "example-2", author: DEMO_USER, text: "해 봐서 고마워요!" }
    ]
  },
  {
    id: "books", author: { id: "sora", nickname: "sora" }, title: "동네 책방 찾아오는 길",
    tag: "정보", aiUsed: false, url: "https://example.com/",
    image: exampleImage("photo-1507842217343-583bb7270b66"),
    description: "처음 오는 사람도 찾기 쉽도록 입구 사진과 길 안내를 넣었어요.",
    ratings: [{ userId: "jun", score: 5 }], comments: []
  },
  {
    id: "study", author: { id: "jun", nickname: "jun" }, title: "공부한 날만 체크해요",
    tag: "공부", aiUsed: true, url: "https://example.com/",
    image: exampleImage("photo-1455390582262-044cdead277a"),
    description: "공부한 날만 달력에 표시돼요. 며칠 빠져도 다시 이어 쓰면 돼요.",
    ratings: [{ userId: "sora", score: 5 }], comments: []
  },
  {
    id: "songs", author: { id: "haru", nickname: "haru" }, title: "출근길에 듣는 곡을 모았어요",
    tag: "기타", aiUsed: false, url: "https://example.com/",
    image: exampleImage("photo-1516280440614-37939bbacd81"),
    description: "출근길에 듣는 곡을 모아뒀어요. 순서는 직접 바꿔 들을 수 있어요.",
    ratings: [], comments: []
  }
];

// 프리뷰용 데이터 저장소. Flask에 연결할 때 이 부분을 API 호출로 바꿀 수 있어요.
function loadDemoState() {
  const initialState = { accounts: [DEMO_USER], userId: null, posts: EXAMPLE_POSTS, theme: "light" };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.accounts) && Array.isArray(saved.posts) ? saved : initialState;
  } catch {
    return initialState;
  }
}

let state = loadDemoState();

function saveDemoState(changes, message) {
  const nextState = { ...state, ...changes };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    if (message) {
      message.textContent = "브라우저에 저장할 수 없어요. 첨부 이미지를 줄이거나 브라우저 저장 공간을 확인해 주세요.";
      return false;
    }
  }
  state = nextState;
  return true;
}

function replacePost(post, message) {
  const posts = state.posts.map(item => item.id === post.id ? post : item);
  return saveDemoState({ posts }, message);
}

function currentUser() {
  return state.accounts.find(account => account.id === state.userId);
}

function isOwner(author) {
  return author.id === currentUser()?.id;
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ??
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
}

const find = (selector, root = document) => root.querySelector(selector);
const home = find("#home");
const view = find("#view");
let activeTag = "전체";

function makeElement(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}

function webUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function picture(post, className) {
  const placeholder = makeElement("div", className + " photo-placeholder", "등록된 스크린샷이 없어요");
  if (!post.image) return placeholder;

  const img = makeElement("img", className);
  img.alt = post.title + " 스크린샷";
  if (className === "post-photo") img.loading = "lazy";
  img.addEventListener("error", () => {
    placeholder.textContent = "스크린샷을 불러올 수 없어요";
    img.replaceWith(placeholder);
  }, { once: true });
  img.src = post.image;
  return img;
}

function ratingLabel(post) {
  if (!post.ratings.length) return "평가 없음";
  const total = post.ratings.reduce((sum, rating) => sum + rating.score, 0);
  return "★ " + (total / post.ratings.length).toFixed(1);
}

function postLabels(post) {
  return post.tag + (post.aiUsed ? " · AI 사용" : " · AI 미사용");
}

function postCard(post) {
  const article = makeElement("article", "post");
  const link = makeElement("a", "post-link");
  link.href = "#site/" + post.id;
  const content = makeElement("div", "post-content");
  const meta = makeElement("div", "post-meta");
  const author = makeElement("span", "post-author");
  const avatar = makeElement("span", "avatar", post.author.nickname[0].toUpperCase());
  avatar.setAttribute("aria-hidden", "true");
  author.append(avatar, post.author.nickname);

  const stats = makeElement("span", "post-stats");
  stats.append(makeElement("span", "", "댓글 " + post.comments.length), makeElement("span", "rating", ratingLabel(post)));
  meta.append(author, stats);
  content.append(
    makeElement("div", "post-category", postLabels(post)),
    makeElement("h3", "", post.title),
    makeElement("p", "post-desc", post.description),
    meta
  );
  link.append(picture(post, "post-photo"), content);
  article.append(link);
  return article;
}

function renderPosts() {
  const query = find("#search").value.trim().toLocaleLowerCase();
  const results = state.posts.filter(post => {
    const searchable = [post.title, post.description, post.tag, post.author.nickname].join(" ").toLocaleLowerCase();
    return (activeTag === "전체" || post.tag === activeTag) && searchable.includes(query);
  });
  find("#posts").replaceChildren(...(results.length
    ? results.map(postCard)
    : [makeElement("p", "empty-state", "검색 결과가 없어요. 검색어나 태그를 바꿔 보세요.")]));
}

function renderTagFilters() {
  const buttons = ["전체", ...TAGS].map(tag => {
    const button = makeElement("button", "category", tag);
    button.type = "button";
    button.classList.toggle("active", tag === activeTag);
    button.setAttribute("aria-pressed", String(tag === activeTag));
    button.addEventListener("click", () => {
      activeTag = tag;
      for (const item of find("#categories").children) {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      }
      renderPosts();
    });
    return button;
  });
  find("#categories").replaceChildren(...buttons);
}

function renderHeader() {
  const user = currentUser();
  find("#guest-actions").hidden = Boolean(user);
  find("#member-actions").hidden = !user;
  find("#member-name").textContent = user?.nickname ?? "";
  const dark = state.theme === "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  find('meta[name="theme-color"]').content = dark ? "#171b17" : "#f5f5f5";
  find("#theme-toggle").setAttribute("aria-pressed", String(dark));
  find("#theme-toggle span").textContent = dark ? "☀" : "☾";
}

function show(template) {
  view.replaceChildren(find("#" + template + "-template").content.cloneNode(true));
  home.hidden = true;
  view.hidden = false;
}

function showNotice(title, message) {
  show("notice");
  find("#notice-title").textContent = title;
  find("#notice-message").textContent = message;
}

function authLink(page, next) {
  return "#" + page + (next ? "?" + new URLSearchParams({ next }) : "");
}

function safeReturn(value) {
  return /^#(?:home|websites|create|site\/[a-z0-9-]+(?:\/edit)?)$/.test(value ?? "") ? value : "";
}

function showAuth(signup, next) {
  if (currentUser()) {
    location.replace(next || "#home");
    return;
  }

  show("auth");
  const title = signup ? "회원가입" : "로그인";
  find("#auth-title").textContent = title;
  find("#auth-submit").textContent = title;
  find("#auth-guide").textContent = signup
    ? "화면 체험용 가입이에요. 실제 비밀번호 대신 임의의 값을 입력해 주세요."
    : "화면 체험용 로그인에서는 비밀번호를 확인하지 않아요. 임의의 값을 입력해 주세요.";
  const alternate = find("#auth-switch");
  alternate.textContent = signup ? "이미 닉네임을 등록했나요? 로그인" : "처음인가요? 회원가입";
  alternate.href = authLink(signup ? "login" : "signup", next);
  find("#demo-login").hidden = signup;

  const form = find("#auth-form");
  form.elements.password.autocomplete = signup ? "new-password" : "current-password";
  const message = find(".form-message", form);

  function completeLogin(user, accounts) {
    if (!saveDemoState({ accounts, userId: user.id }, message)) return;
    renderHeader();
    location.replace(next || "#home");
  }

  find("#demo-login").addEventListener("click", () => completeLogin(DEMO_USER, state.accounts));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const nickname = form.elements.nickname.value.trim();
    const account = state.accounts.find(user => user.nickname.toLocaleLowerCase() === nickname.toLocaleLowerCase());
    if (!nickname || !form.elements.password.value.trim()) {
      message.textContent = "닉네임과 체험용 비밀번호를 입력해 주세요.";
      return;
    }
    if (signup && account) {
      message.textContent = "이미 등록된 닉네임이에요. 다른 닉네임을 입력해 주세요.";
      return;
    }
    if (!signup && !account) {
      message.textContent = "등록된 닉네임을 입력하거나 예시 계정을 사용해 주세요.";
      return;
    }
    const user = account ?? { id: makeId(), nickname };
    completeLogin(user, account ? state.accounts : [...state.accounts, user]);
  });
}

async function readScreenshot(file) {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("JPG, PNG, WEBP 이미지를 선택해 주세요.");
  if (file.size > IMAGE_LIMIT) throw new Error("2MB 이하의 이미지를 선택해 주세요.");

  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result), { once: true });
    reader.addEventListener("error", reject, { once: true });
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = data;
  try {
    await image.decode();
  } catch {
    throw new Error("이미지를 읽을 수 없어요. 다른 파일을 선택해 주세요.");
  }
  return data;
}

function showEditor(post) {
  show("editor");
  const form = find("#site-form");
  const elements = form.elements;
  const message = find(".form-message", form);
  const preview = find("#image-preview");
  const remove = find("#remove-image");
  const submit = find("#editor-submit");
  let image = post?.image ?? "";
  let selection = 0;

  for (const tag of TAGS) {
    elements.tag.add(new Option(tag, tag));
  }
  find("#editor-title").textContent = post ? "게시물 수정" : "사이트 올리기";
  submit.textContent = post ? "변경 내용 저장" : "등록하기";
  if (post) {
    const back = find("#editor-back");
    back.href = find("#editor-cancel").href = "#site/" + post.id;
    back.textContent = "← 게시물 상세";
    elements.title.value = post.title;
    elements.url.value = post.url;
    elements.description.value = post.description;
    elements.tag.value = post.tag;
    elements.aiUsed.value = post.aiUsed ? "yes" : "no";
  }

  function renderPreview() {
    preview.hidden = remove.hidden = !image;
    if (image) preview.src = image;
    else preview.removeAttribute("src");
  }

  renderPreview();
  elements.image.addEventListener("change", async () => {
    const file = elements.image.files[0];
    if (!file) return;
    const selected = ++selection;
    submit.disabled = true;
    message.textContent = "";
    try {
      const data = await readScreenshot(file);
      if (selected !== selection) return;
      image = data;
      renderPreview();
    } catch (error) {
      if (selected !== selection) return;
      message.textContent = error instanceof Error ? error.message : "파일을 읽을 수 없어요.";
      elements.image.value = "";
    } finally {
      if (selected === selection) submit.disabled = false;
    }
  });

  remove.addEventListener("click", () => {
    selection += 1;
    image = elements.image.value = message.textContent = "";
    submit.disabled = false;
    renderPreview();
    elements.image.focus();
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (submit.disabled) return;
    const title = elements.title.value.trim();
    const description = elements.description.value.trim();
    const url = webUrl(elements.url.value.trim());
    if (!title || !description || !url) {
      message.textContent = "이름과 소개를 입력하고, 주소는 http:// 또는 https://로 시작해 주세요.";
      return;
    }

    const updated = {
      ...(post ?? { id: makeId(), author: currentUser(), ratings: [], comments: [] }),
      title, description, url, tag: elements.tag.value, aiUsed: elements.aiUsed.value === "yes", image
    };
    const saved = post ? replacePost(updated, message) : saveDemoState({ posts: [updated, ...state.posts] }, message);
    if (saved) location.replace("#site/" + updated.id);
  });
}

function showDetail(initialPost) {
  show("detail");
  let post = initialPost;
  const page = "#site/" + post.id;
  const user = currentUser();
  const owner = isOwner(post.author);
  find("#detail-title").textContent = post.title;
  find("#detail-tag").textContent = postLabels(post);
  find("#detail-author").textContent = "게시자 " + post.author.nickname;
  find("#detail-description").textContent = post.description;
  find("#detail-image").append(picture(post, "detail-photo"));
  find("#visit-site").href = webUrl(post.url);
  find("#owner-actions").hidden = !owner;
  find("#edit-site").href = page + "/edit";
  for (const link of view.querySelectorAll(".login-to-detail")) {
    link.href = authLink("login", page);
  }

  function renderRating() {
    const rating = post.ratings.find(entry => entry.userId === user?.id);
    find("#detail-rating").textContent = ratingLabel(post);
    find("#rating-guest").hidden = Boolean(user);
    find("#rating-form").hidden = !user || Boolean(rating);
    find("#rating-result").hidden = !rating;
    if (rating) find("#rating-result").textContent = "남긴 별점 " + rating.score + "점";
  }

  function renderComments() {
    find("#comment-count").textContent = post.comments.length;
    const items = post.comments.map(comment => {
      const item = makeElement("li");
      const header = makeElement("div", "comment-head");
      header.append(makeElement("strong", "", comment.author.nickname));
      if (isOwner(comment.author)) {
        const button = makeElement("button", "button-secondary danger", "삭제");
        button.type = "button";
        button.setAttribute("aria-label", comment.author.nickname + " 댓글 삭제");
        button.addEventListener("click", () => {
          const message = find("#comment-message");
          const updated = { ...post, comments: post.comments.filter(entry => entry.id !== comment.id) };
          if (!replacePost(updated, message)) return;
          post = updated;
          renderComments();
          message.textContent = "댓글이 삭제됐어요.";
          find("#comment").focus();
        });
        header.append(button);
      }
      item.append(header, makeElement("p", "", comment.text));
      return item;
    });
    if (!items.length) items.push(makeElement("li", "muted", "아직 댓글이 없어요."));
    find("#comments").replaceChildren(...items);
  }

  find("#delete-site").addEventListener("click", () => {
    if (!isOwner(post.author) || !window.confirm("이 게시물을 삭제할까요?")) return;
    const posts = state.posts.filter(item => item.id !== post.id);
    if (saveDemoState({ posts }, find("#detail-message"))) location.replace("#websites");
  });

  find("#rating-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const score = Number(form.elements.score.value);
    if (!user || ![1, 2, 3, 4, 5].includes(score) || post.ratings.some(rating => rating.userId === user.id)) return;
    const updated = { ...post, ratings: [...post.ratings, { userId: user.id, score }] };
    if (!replacePost(updated, find(".form-message", form))) return;
    post = updated;
    renderRating();
    find("#rating-result").setAttribute("tabindex", "-1");
    find("#rating-result").focus();
  });

  find("#comments-guest").hidden = Boolean(user);
  find("#comment-form").hidden = !user;
  find("#comment-form").addEventListener("submit", event => {
    event.preventDefault();
    const form = event.currentTarget;
    const comment = form.elements.comment.value.trim();
    const message = find("#comment-message");
    if (!user || !comment) {
      message.textContent = "댓글 내용을 입력해 주세요.";
      return;
    }
    const updated = { ...post, comments: [...post.comments, { id: makeId(), author: user, text: comment }] };
    if (!replacePost(updated, message)) return;
    post = updated;
    form.reset();
    renderComments();
    message.textContent = "댓글이 등록됐어요.";
  });

  renderRating();
  renderComments();
}

function renderRoute() {
  const [route = "", query = ""] = location.hash.slice(1).split("?");
  if (["", "home", "websites"].includes(route)) {
    view.hidden = true;
    view.replaceChildren();
    home.hidden = false;
    renderPosts();
    document.title = "WA — Website Archive";
    if (route === "websites") find("#websites").scrollIntoView();
    else window.scrollTo(0, 0);
    return;
  }

  const siteRoute = /^site\/([a-z0-9-]+)(\/edit)?$/.exec(route);
  const post = siteRoute && state.posts.find(item => item.id === siteRoute[1]);
  const editing = Boolean(siteRoute?.[2]);

  if (route === "login" || route === "signup") {
    showAuth(route === "signup", safeReturn(new URLSearchParams(query).get("next")));
  } else if (siteRoute && !post) {
    showNotice("게시물을 찾을 수 없어요", "삭제되었거나 현재 브라우저에 없는 게시물이에요.");
  } else if (route === "create" || editing) {
    if (!currentUser()) {
      location.replace(authLink("login", "#" + route));
      return;
    }
    if (editing && !isOwner(post.author)) showNotice("수정할 수 없어요", "게시물을 작성한 사람만 수정할 수 있어요.");
    else showEditor(post || undefined);
  } else if (post) {
    showDetail(post);
  } else {
    showNotice("페이지를 찾을 수 없어요", "목록에서 웹사이트를 다시 찾아보세요.");
  }

  const title = find("h1", view);
  if (title) {
    document.title = title.textContent + " · WA";
    window.scrollTo(0, 0);
    title.focus({ preventScroll: true });
  }
}

find("#search").addEventListener("input", renderPosts);
find("#theme-toggle").addEventListener("click", () => {
  saveDemoState({ theme: state.theme === "dark" ? "light" : "dark" });
  renderHeader();
});
find("#logout").addEventListener("click", () => {
  saveDemoState({ userId: null });
  renderHeader();
  if (/^#(?:create|site\/[^/]+\/edit)$/.test(location.hash)) location.replace("#home");
  else renderRoute();
  find("#guest-actions a").focus();
});
window.addEventListener("hashchange", renderRoute);
renderHeader();
renderTagFilters();
renderRoute();
