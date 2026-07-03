const STORAGE_KEY = "smart-splitter:v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function loadSmartSplitterStore() {
  if (typeof window === "undefined") {
    return { groups: [], expenses: [], friends: [] };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { groups: [], expenses: [], friends: [] };

  const parsed = safeParse(raw);
  if (!parsed || typeof parsed !== "object") {
    return { groups: [], expenses: [], friends: [] };
  }

  return {
    groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
    friends: Array.isArray(parsed.friends) ? parsed.friends : [],
  };
}

export function saveSmartSplitterStore(store) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

