const BUILD = "1.00";

const defaults = {
  showCombined: true,
  showTikTok: true,
  showInstagram: true,
  backgroundColor: "#0b1117",
  brightness: 100,
  refreshDuration: 300000
};

let settings = loadSettings();

let refreshTimer = null;

let tapTimes = [];

const els = {
  display: document.getElementById("display"),

  settingsPanel:
    document.getElementById("settingsPanel"),

  settingsHotspot:
    document.getElementById("settingsHotspot"),

  closeSettings:
    document.getElementById("closeSettings"),

  saveSettings:
    document.getElementById("saveSettings"),

  resetSettings:
    document.getElementById("resetSettings"),

  showCombined:
    document.getElementById("showCombined"),

  showTikTok:
    document.getElementById("showTikTok"),

  showInstagram:
    document.getElementById("showInstagram"),

  backgroundColor:
    document.getElementById("backgroundColor"),

  backgroundColorValue:
    document.getElementById("backgroundColorValue"),

  brightnessSlider:
    document.getElementById("brightnessSlider"),

  brightnessValue:
    document.getElementById("brightnessValue"),

  refreshDuration:
    document.getElementById("refreshDuration"),

  buildNumber:
    document.getElementById("buildNumber"),

  homeBuildNumber:
    document.getElementById("homeBuildNumber"),

  combinedSection:
    document.getElementById("combinedSection"),

  tiktokSection:
    document.getElementById("tiktokSection"),

  instagramSection:
    document.getElementById("instagramSection"),

  accountName:
    document.getElementById("accountName"),

  tiktokHandle:
    document.getElementById("tiktokHandle"),

  instagramHandle:
    document.getElementById("instagramHandle"),

  totalViews:
    document.getElementById("totalViews"),

  totalFollowers:
    document.getElementById("totalFollowers"),

  tiktokViews:
    document.getElementById("tiktokViews"),

  tiktokFollowers:
    document.getElementById("tiktokFollowers"),

  instagramViews:
    document.getElementById("instagramViews"),

  instagramFollowers:
    document.getElementById("instagramFollowers"),

  viewsChange:
    document.getElementById("viewsChange"),

  followersChange:
    document.getElementById("followersChange"),

  lastUpdated:
    document.getElementById("lastUpdated"),

  statusDot:
    document.getElementById("statusDot")
};

function loadSettings() {
  try {
    const saved =
      JSON.parse(
        localStorage.getItem("socialFrameSettings") || "{}"
      );

    return {
      ...defaults,
      ...saved
    };
  } catch {
    return {
      ...defaults
    };
  }
}

function saveSettingsToStorage() {
  localStorage.setItem(
    "socialFrameSettings",
    JSON.stringify(settings)
  );
}

function syncSettingsControls() {
  els.showCombined.checked =
    settings.showCombined;

  els.showTikTok.checked =
    settings.showTikTok;

  els.showInstagram.checked =
    settings.showInstagram;

  els.backgroundColor.value =
    settings.backgroundColor;

  els.backgroundColorValue.textContent =
    settings.backgroundColor.toUpperCase();

  els.brightnessSlider.value =
    settings.brightness;

  els.brightnessValue.textContent =
    `${settings.brightness}%`;

  els.refreshDuration.value =
    String(settings.refreshDuration);
}

function applySettings() {
  document.documentElement.style.setProperty(
    "--bg",
    settings.backgroundColor
  );

  els.display.style.backgroundColor =
    settings.backgroundColor;

  els.display.style.filter =
    `brightness(${settings.brightness / 100})`;

  els.combinedSection.classList.toggle(
    "hidden",
    !settings.showCombined
  );

  els.tiktokSection.classList.toggle(
    "hidden",
    !settings.showTikTok
  );

  els.instagramSection.classList.toggle(
    "hidden",
    !settings.showInstagram
  );

  els.homeBuildNumber.textContent =
    `Build ${BUILD}`;

  els.buildNumber.textContent =
    BUILD;

  startRefreshTimer();
}

function startRefreshTimer() {
  clearInterval(refreshTimer);

  refreshTimer =
    setInterval(
      loadData,
      Number(settings.refreshDuration)
    );
}

function openSettings() {
  syncSettingsControls();

  els.settingsPanel.classList.remove(
    "hidden"
  );
}

function closeSettings() {
  els.settingsPanel.classList.add(
    "hidden"
  );
}

function formatNumber(value) {
  const n =
    Number(value || 0);

  if (n >= 1000000000) {
    return `${(
      n / 1000000000
    ).toFixed(
      n >= 10000000000 ? 1 : 2
    )}B`;
  }

  if (n >= 1000000) {
    return `${(
      n / 1000000
    ).toFixed(
      n >= 10000000 ? 1 : 2
    )}M`;
  }

  if (n >= 1000) {
    return `${(
      n / 1000
    ).toFixed(
      n >= 100000 ? 0 : 1
    )}K`;
  }

  return n.toLocaleString();
}

function formatChange(
  value,
  label
) {
  const n =
    Number(value || 0);

  const sign =
    n > 0 ? "+" : "";

  return `${sign}${formatNumber(n)} ${label} this week`;
}

function renderData(data) {
  const tiktok =
    data.tiktok || {};

  const instagram =
    data.instagram || {};

  const totalViews =
    Number(tiktok.views || 0) +
    Number(instagram.views || 0);

  const totalFollowers =
    Number(tiktok.followers || 0) +
    Number(instagram.followers || 0);

  els.accountName.textContent =
    data.displayName || "@youraccount";

  els.tiktokHandle.textContent =
    tiktok.handle || "@youraccount";

  els.instagramHandle.textContent =
    instagram.handle || "@youraccount";

  els.totalViews.textContent =
    formatNumber(totalViews);

  els.totalFollowers.textContent =
    formatNumber(totalFollowers);

  els.tiktokViews.textContent =
    formatNumber(tiktok.views);

  els.tiktokFollowers.textContent =
    formatNumber(tiktok.followers);

  els.instagramViews.textContent =
    formatNumber(instagram.views);

  els.instagramFollowers.textContent =
    formatNumber(instagram.followers);

  els.viewsChange.textContent =
    formatChange(
      data.weeklyViewsChange,
      "views"
    );

  els.followersChange.textContent =
    formatChange(
      data.weeklyFollowersChange,
      "followers"
    );

  const updated =
    data.updatedAt
      ? new Date(data.updatedAt)
      : new Date();

  els.lastUpdated.textContent =
    `Updated ${updated.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit"
      }
    )}`;

  els.statusDot.style.background =
    "#4ade80";

  els.statusDot.style.boxShadow =
    "0 0 14px rgba(74,222,128,.75)";
}

async function loadData() {
  try {
    const response =
      await fetch(
        `/api/stats?t=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `Server returned ${response.status}`
      );
    }

    const data =
      await response.json();

    renderData(data);
  } catch (error) {
    console.error(error);

    els.lastUpdated.textContent =
      "Data unavailable";

    els.statusDot.style.background =
      "#f87171";

    els.statusDot.style.boxShadow =
      "0 0 14px rgba(248,113,113,.6)";
  }
}

els.settingsHotspot.addEventListener(
  "click",
  () => {
    const now =
      Date.now();

    tapTimes =
      tapTimes.filter(
        time =>
          now - time < 2500
      );

    tapTimes.push(now);

    if (
      tapTimes.length >= 5
    ) {
      tapTimes = [];

      openSettings();
    }
  }
);

els.closeSettings.addEventListener(
  "click",
  closeSettings
);

els.backgroundColor.addEventListener(
  "input",
  () => {
    els.backgroundColorValue.textContent =
      els.backgroundColor.value.toUpperCase();
  }
);

els.brightnessSlider.addEventListener(
  "input",
  () => {
    els.brightnessValue.textContent =
      `${els.brightnessSlider.value}%`;
  }
);

els.saveSettings.addEventListener(
  "click",
  () => {
    settings = {
      showCombined:
        els.showCombined.checked,

      showTikTok:
        els.showTikTok.checked,

      showInstagram:
        els.showInstagram.checked,

      backgroundColor:
        els.backgroundColor.value,

      brightness:
        Number(
          els.brightnessSlider.value
        ),

      refreshDuration:
        Number(
          els.refreshDuration.value
        )
    };

    if (
      !settings.showCombined &&
      !settings.showTikTok &&
      !settings.showInstagram
    ) {
      settings.showCombined = true;
    }

    saveSettingsToStorage();

    applySettings();

    closeSettings();
  }
);

els.resetSettings.addEventListener(
  "click",
  () => {
    settings = {
      ...defaults
    };

    saveSettingsToStorage();

    syncSettingsControls();

    applySettings();
  }
);

syncSettingsControls();

applySettings();

loadData();
