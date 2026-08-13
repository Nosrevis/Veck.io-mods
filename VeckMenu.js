(() => {
  if (window.__MY_MOD_MENU__) {
    window.__MY_MOD_MENU__.toggle();
    return;
  }

  const state = {
    open: false,
    section: null,
    aimbot: false,
    aimbotStrength: 50
  };

  const style = document.createElement("style");

  style.textContent = `
    #my-mod-menu,
    #my-mod-menu * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
    }

    #my-mod-menu {
      position: fixed;
      left: 22px;
      bottom: 22px;
      width: 310px;
      background: #17171d;
      color: white;
      border: 1px solid #444451;
      border-radius: 10px;
      box-shadow: 0 12px 35px rgba(0,0,0,.55);
      z-index: 2147483647;
      overflow: hidden;
      user-select: none;
    }

    #my-mod-menu .mm-header {
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 15px;
      background: #202027;
      border-bottom: 1px solid #383842;
      cursor: move;
      font-weight: 800;
      letter-spacing: 1px;
    }

    #my-mod-menu .mm-title {
      font-size: 16px;
    }

    #my-mod-menu .mm-close {
      width: 28px;
      height: 28px;
      border: 0;
      border-radius: 6px;
      background: #30303a;
      color: #ddd;
      cursor: pointer;
      font-size: 18px;
    }

    #my-mod-menu .mm-close:hover {
      background: #444450;
    }

    #my-mod-menu .mm-body {
      padding: 14px;
    }

    #my-mod-menu .mm-home {
      display: grid;
      gap: 10px;
    }

    #my-mod-menu .mm-section {
      height: 58px;
      border: 1px solid #454550;
      background: #24242d;
      color: white;
      border-radius: 7px;
      cursor: pointer;
      font-size: 15px;
      font-weight: 700;
      text-align: left;
      padding: 0 17px;
      transition: .12s;
    }

    #my-mod-menu .mm-section:hover {
      background: #30303b;
      border-color: #656575;
      transform: translateX(2px);
    }

    #my-mod-menu .mm-back {
      background: transparent;
      border: 0;
      color: #aaa;
      cursor: pointer;
      padding: 0 0 12px;
      font-size: 13px;
    }

    #my-mod-menu .mm-back:hover {
      color: white;
    }

    #my-mod-menu .mm-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    #my-mod-menu .mm-mod {
      min-height: 48px;
      background: #25252e;
      border: 1px solid #40404c;
      color: #ddd;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }

    #my-mod-menu .mm-mod:hover {
      background: #30303b;
    }

    #my-mod-menu .mm-mod.active {
      background: #34344a;
      border-color: #7777ff;
      color: white;
    }

    #my-mod-menu .mm-status {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      background: #202027;
      color: #999;
      font-size: 11px;
      line-height: 1.4;
    }

    #my-mod-slider {
      position: fixed;
      display: none;
      z-index: 2147483646;
      width: 190px;
      padding: 13px;
      background: #17171d;
      border: 1px solid #444451;
      border-radius: 9px;
      box-shadow: 0 10px 30px rgba(0,0,0,.5);
      color: white;
    }

    #my-mod-slider .slider-title {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    #my-mod-slider input {
      width: 100%;
      accent-color: #7777ff;
    }

    #my-mod-slider .slider-value {
      text-align: center;
      color: #aaa;
      font-size: 11px;
      margin-top: 5px;
    }

    #my-mod-button {
      position: fixed;
      left: 18px;
      bottom: 18px;
      z-index: 2147483647;
      display: none;
      padding: 11px 17px;
      border: 1px solid #555563;
      border-radius: 7px;
      background: #202027;
      color: white;
      cursor: pointer;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 7px 22px rgba(0,0,0,.45);
    }

    #my-mod-button:hover {
      background: #30303b;
    }
  `;

  document.head.appendChild(style);

  const menu = document.createElement("div");
  menu.id = "my-mod-menu";

  menu.innerHTML = `
    <div class="mm-header">
      <span class="mm-title">MOD MENU</span>
      <button class="mm-close">×</button>
    </div>

    <div class="mm-body"></div>
  `;

  const slider = document.createElement("div");
  slider.id = "my-mod-slider";

  slider.innerHTML = `
    <div class="slider-title">AIMBOT STRENGTH</div>
    <input type="range" min="0" max="100" value="50">
    <div class="slider-value">50%</div>
  `;

  const button = document.createElement("button");
  button.id = "my-mod-button";
  button.textContent = "MODS";

  document.body.appendChild(menu);
  document.body.appendChild(slider);
  document.body.appendChild(button);

  const body = menu.querySelector(".mm-body");
  const closeButton = menu.querySelector(".mm-close");
  const strengthSlider = slider.querySelector("input");
  const strengthValue = slider.querySelector(".slider-value");

  function renderHome() {
    state.section = null;

    body.innerHTML = `
      <div class="mm-home">
        <button class="mm-section" data-section="FUN">
          FUN
        </button>

        <button class="mm-section" data-section="ADVANTAGES">
          ADVANTAGES
        </button>

        <button class="mm-section" data-section="VISUAL">
          VISUAL
        </button>
      </div>
    `;

    body.querySelectorAll(".mm-section").forEach(btn => {
      btn.addEventListener("click", () => {
        renderSection(btn.dataset.section);
      });
    });
  }

  function renderSection(section) {
    state.section = section;

    const mods = [
      "Mod Slot 1",
      "Mod Slot 2",
      "Mod Slot 3",
      "Mod Slot 4",
      "Mod Slot 5",
      "Mod Slot 6"
    ];

    if (section === "ADVANTAGES") {
      mods[0] = "Aimbot";
    }

    body.innerHTML = `
      <button class="mm-back">← Back</button>

      <div style="
        font-size:17px;
        font-weight:800;
        margin-bottom:12px;
      ">
        ${section}
      </div>

      <div class="mm-grid">
        ${mods.map((name, i) => `
          <button
            class="mm-mod ${section === "ADVANTAGES" && i === 0 && state.aimbot ? "active" : ""}"
            data-index="${i}">
            ${name}
          </button>
        `).join("")}
      </div>

      <div class="mm-status">
        ${section === "ADVANTAGES"
          ? "Enable a mod to configure it."
          : "More mods coming soon."}
      </div>
    `;

    body.querySelector(".mm-back").addEventListener("click", renderHome);

    if (section === "ADVANTAGES") {
      body.querySelector(".mm-mod[data-index='0']")
        .addEventListener("click", toggleAimbot);
    }
  }

  function toggleAimbot() {
    state.aimbot = !state.aimbot;

    const modButton = body.querySelector(".mm-mod[data-index='0']");

    if (modButton) {
      modButton.classList.toggle("active", state.aimbot);
    }

    slider.style.display = state.aimbot ? "block" : "none";

    positionSlider();

    /*
      This is intentionally just the UI/state hook.

      For your own offline game, use:

        state.aimbotStrength

      inside your game's own targeting code.
    */

    if (state.aimbot) {
      console.log(
        "[Mod Menu] Aimbot enabled:",
        state.aimbotStrength
      );
    } else {
      console.log("[Mod Menu] Aimbot disabled");
    }
  }

  function positionSlider() {
    if (!state.aimbot) return;

    const rect = menu.getBoundingClientRect();

    slider.style.left = `${rect.right + 10}px`;
    slider.style.top = `${rect.top + 48}px`;
  }

  strengthSlider.addEventListener("input", () => {
    state.aimbotStrength = Number(strengthSlider.value);
    strengthValue.textContent =
      `${state.aimbotStrength}%`;

    /*
      Offline/own-game integration point:

      Your game's aimbot implementation can read:

        state.aimbotStrength
    */
  });

  function openMenu() {
    state.open = true;
    menu.style.display = "block";
    button.style.display = "none";
    renderHome();
    positionSlider();
  }

  function closeMenu() {
    state.open = false;
    menu.style.display = "none";
    slider.style.display = "none";
    button.style.display = "block";
  }

  closeButton.addEventListener("click", closeMenu);
  button.addEventListener("click", openMenu);

  // Simple dragging
  const header = menu.querySelector(".mm-header");

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("pointerdown", e => {
    dragging = true;

    const rect = menu.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    header.setPointerCapture(e.pointerId);
  });

  header.addEventListener("pointermove", e => {
    if (!dragging) return;

    menu.style.left =
      `${Math.max(5, e.clientX - offsetX)}px`;

    menu.style.top =
      `${Math.max(5, e.clientY - offsetY)}px`;

    menu.style.bottom = "auto";

    positionSlider();
  });

  header.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("resize", positionSlider);

  window.__MY_MOD_MENU__ = {
    toggle() {
      state.open ? closeMenu() : openMenu();
    },

    open: openMenu,
    close: closeMenu,

    state
  };

  // Start with the small button.
  closeMenu();
})();
