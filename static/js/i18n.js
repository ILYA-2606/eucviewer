(function () {
  const STORAGE_KEY = "dbb_language";
  const DEFAULT_LANG = "en";
  const SUPPORTED = ["en", "ru"];
  let language = DEFAULT_LANG;
  let messages = {};

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved)) language = saved;
  } catch (_) {}

  function interpolate(text, params) {
    return String(text).replace(/\{(\w+)\}/g, (_, key) => (
      params && Object.prototype.hasOwnProperty.call(params, key) ? params[key] : ""
    ));
  }

  async function load(lang) {
    const response = await fetch(`static/i18n/${lang}.json?v=5`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load locale: ${lang}`);
    messages = await response.json();
    language = lang;
    document.documentElement.lang = lang;
    applyStaticTranslations();
    updateLanguageButtons();
  }

  function t(key, params) {
    return interpolate(messages[key] || key, params);
  }

  function applyStaticTranslations(root) {
    const scope = root || document;
    const titleKey = document.documentElement.dataset.i18nTitle || document.body?.dataset.i18nTitle || "app.title";
    document.title = t(titleKey);
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    scope.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
    });
    scope.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
    });
  }

  function updateLanguageButtons() {
    document.querySelectorAll("[data-lang-option]").forEach((button) => {
      const active = button.dataset.langOption === language;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
      button.title = t(button.dataset.langOption === "ru" ? "language.ru" : "language.en");
    });
  }

  async function setLanguage(lang) {
    if (!SUPPORTED.includes(lang) || lang === language) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {}
    await load(lang);
    window.dispatchEvent(new CustomEvent("i18n:change", { detail: { language } }));
  }

  const ready = load(language).catch(() => {
    messages = {};
    applyStaticTranslations();
    updateLanguageButtons();
  });

  document.addEventListener("DOMContentLoaded", () => {
    ready.then(() => {
      document.querySelectorAll("[data-lang-option]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.dataset.langOption));
      });
      applyStaticTranslations();
      updateLanguageButtons();
    });
  });

  window.appI18n = {
    get language() { return language; },
    ready,
    t,
    setLanguage,
    applyStaticTranslations,
  };
})();
