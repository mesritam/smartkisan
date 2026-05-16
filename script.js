const state = {
  prices: [],
  currentUser: JSON.parse(localStorage.getItem("smartKisanUser") || "null")
};

const $ = (selector) => document.querySelector(selector);

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) {
    element.classList.add(type);
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }
  return payload;
}

function initNavigation() {
  const navbar = document.querySelector(".navbar");
  const toggle = $("#navToggle");
  const links = document.querySelectorAll(".nav-menu a");

  toggle.addEventListener("click", () => {
    const isOpen = navbar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      navbar.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function initRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  items.forEach((item) => observer.observe(item));
}

function updateFarmerUI(user) {
  state.currentUser = user;
  if (user) {
    localStorage.setItem("smartKisanUser", JSON.stringify(user));
    $("#welcomeFarmer").textContent = `Welcome, ${user.name}`;
  } else {
    localStorage.removeItem("smartKisanUser");
    $("#welcomeFarmer").textContent = "Welcome, farmer";
  }
}

function initAuth() {
  updateFarmerUI(state.currentUser);

  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = $("#loginMessage");
    setMessage(message, "Checking account...");

    try {
      const payload = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      updateFarmerUI(payload.user);
      setMessage(message, `Logged in as ${payload.user.name}.`, "success");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });

  $("#signupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = $("#signupMessage");
    setMessage(message, "Creating account...");

    try {
      const payload = await api("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      updateFarmerUI(payload.user);
      setMessage(message, `Account created for ${payload.user.name}.`, "success");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(message, error.message, "error");
    }
  });
}

function renderWeather(data) {
  $("#dashWeather").textContent = data.risk;
  $("#weatherMain").innerHTML = `
    <h3>${data.city}</h3>
    <span class="temp">${data.temperature} deg C</span>
    <p>${data.summary}</p>
    <div class="weather-facts">
      <span>Humidity ${data.humidity}%</span>
      <span>Wind ${data.wind} km/h</span>
      <span>Rain ${data.rainChance}%</span>
    </div>
  `;

  $("#forecastCards").innerHTML = data.forecast.map((day) => `
    <article class="weather-card">
      <span class="metric-label">${day.day}</span>
      <strong>${day.temp} deg C</strong>
      <p>${day.note}</p>
    </article>
  `).join("");
}

async function loadWeather() {
  const city = $("#weatherCity").value;
  $("#weatherMain").innerHTML = '<span class="loading-text">Loading weather...</span>';
  $("#forecastCards").innerHTML = "";

  try {
    const payload = await api(`/api/weather?city=${encodeURIComponent(city)}`);
    renderWeather(payload.weather);
  } catch (error) {
    $("#weatherMain").innerHTML = `<span class="loading-text">${error.message}</span>`;
  }
}

function renderPrices() {
  const query = $("#priceSearch").value.trim().toLowerCase();
  const category = $("#priceCategory").value;
  const rows = state.prices.filter((item) => {
    const matchesQuery = `${item.crop} ${item.market}`.toLowerCase().includes(query);
    const matchesCategory = category === "all" || item.category === category;
    return matchesQuery && matchesCategory;
  });

  $("#priceTable").innerHTML = rows.length ? rows.map((item) => `
    <tr>
      <td><strong>${item.crop}</strong></td>
      <td>${item.market}</td>
      <td>Rs. ${item.price}</td>
      <td class="${item.trendClass}">${item.trend}</td>
      <td class="${item.demandClass}">${item.demand}</td>
    </tr>
  `).join("") : '<tr><td colspan="5">No matching crop prices found.</td></tr>';

  const best = rows.find((item) => item.trend === "Up") || rows[0];
  if (best) {
    $("#dashPrice").textContent = best.crop;
  }
}

async function loadPrices() {
  try {
    const payload = await api("/api/prices");
    state.prices = payload.prices;
    renderPrices();
  } catch (error) {
    $("#priceTable").innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

function renderSuggestion(payload) {
  $("#suggestResults").innerHTML = payload.recommendations.map((item) => `
    <article class="result-card">
      <span>${item.fit}% suitability</span>
      <strong>${item.crop}</strong>
      <p>${item.reason}</p>
      <p><b>Next step:</b> ${item.action}</p>
      <div class="score-bar" aria-hidden="true"><span style="--score: ${item.fit}%"></span></div>
    </article>
  `).join("");
}

function initSuggestionForm() {
  $("#suggestForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    $("#suggestResults").innerHTML = '<article class="result-card"><span>Analyzing</span><strong>Please wait</strong><p>Checking soil, rainfall, season, and irrigation inputs.</p></article>';

    try {
      const payload = await api("/api/crop-suggestions", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      renderSuggestion(payload);
    } catch (error) {
      $("#suggestResults").innerHTML = `<article class="result-card"><span>Error</span><strong>Suggestion failed</strong><p>${error.message}</p></article>`;
    }
  });
}

async function loadSchemes() {
  try {
    const payload = await api("/api/schemes");
    $("#schemeGrid").innerHTML = payload.schemes.map((scheme) => `
      <article class="scheme-card">
        <span>${scheme.category}</span>
        <strong>${scheme.name}</strong>
        <p>${scheme.description}</p>
        <a href="${scheme.link}" target="_blank" rel="noreferrer">Learn more &rarr;</a>
      </article>
    `).join("");
  } catch (error) {
    $("#schemeGrid").innerHTML = `<span class="loading-text">${error.message}</span>`;
  }
}

function initContact() {
  $("#contactForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const status = $("#contactStatus");
    setMessage(status, "Sending message...");

    try {
      const payload = await api("/api/contact", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form))
      });
      setMessage(status, payload.message, "success");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(status, error.message, "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initRevealAnimations();
  initAuth();
  initSuggestionForm();
  initContact();

  $("#weatherButton").addEventListener("click", loadWeather);
  $("#priceSearch").addEventListener("input", renderPrices);
  $("#priceCategory").addEventListener("change", renderPrices);

  loadWeather();
  loadPrices();
  loadSchemes();
});
