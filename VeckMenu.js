(() => {
  if (window.__MY_MOD_MENU__) {
    window.__MY_MOD_MENU__.toggle();
    return;
  }

  const state = {
    open: false,
    section: null,
    aimbot: false,
    aimbotStrength: 50,
    aimbotFOV: 90, // Field of view for targeting
    aimbotMode: "closest", // "closest" or "head"
    teamCheck: true // Don't target teammates
  };

  // AIMBOT CORE - Add this object to store the aimbot logic
  const aimbotCore = {
    active: false,
    target: null,
    
    // Find enemy players - works with common game structures
    findTargets() {
      // Try multiple common player selectors
      const selectors = [
        '.player', '.enemy', '[class*="player"]', '[class*="enemy"]',
        '[class*="character"]', '.entity', '[class*="entity"]',
        'canvas' // fallback for games that render to canvas
      ];
      
      let targets = [];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Filter to likely player elements (have position, visible, etc.)
          targets = Array.from(elements).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 10 && rect.height > 10 && 
                   rect.top > 0 && rect.left > 0 &&
                   rect.bottom < window.innerHeight &&
                   rect.right < window.innerWidth;
          });
          if (targets.length > 0) break;
        }
      }
      
      // Alternative: Scan for game objects in window scope
      if (targets.length === 0 && window.game && window.game.players) {
        targets = Object.values(window.game.players).filter(p => 
          p && !p.isLocal && (!state.teamCheck || p.team !== window.game.localPlayer?.team)
        );
      }
      
      return targets;
    },
    
    // Get center position of target
    getTargetPos(target) {
      if (target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      }
      // For game object format
      if (target.x !== undefined && target.y !== undefined) {
        return { x: target.x, y: target.y };
      }
      return null;
    },
    
    // Calculate distance from center of screen
    getDistance(pos) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
    },
    
    // Main aimbot loop
    update() {
      if (!state.aimbot) return;
      
      const targets = this.findTargets();
      if (targets.length === 0) return;
      
      // Find best target
      let bestTarget = null;
      let bestScore = Infinity;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      for (const target of targets) {
        const pos = this.getTargetPos(target);
        if (!pos) continue;
        
        const dist = this.getDistance(pos);
        const angle = Math.atan2(pos.y - cy, pos.x - cx) * 180 / Math.PI;
        const fovDist = Math.abs(((angle % 360) + 360) % 360 - 180);
        
        // Only target within FOV
        if (fovDist > state.aimbotFOV / 2) continue;
        
        const score = state.aimbotMode === "closest" ? dist : 
                      (target.classList?.contains("head") ? dist * 0.5 : dist);
        
        if (score < bestScore) {
          bestScore = score;
          bestTarget = { element: target, pos };
        }
      }
      
      if (bestTarget) {
        this.aimAt(bestTarget.pos);
      }
    },
    
    // Move aim toward target
    aimAt(pos) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      
      // Apply strength as smoothing factor (higher = snappier)
      const strength = state.aimbotStrength / 100;
      const smoothFactor = 1 - (strength * 0.9); // 10-100% strength
      
      const moveX = dx * (1 - smoothFactor);
      const moveY = dy * (1 - smoothFactor);
      
      // Method 1: Dispatch mouse events (works for canvas games)
      if (document.querySelector('canvas')) {
        const canvas = document.querySelector('canvas');
        const rect = canvas.getBoundingClientRect();
        
        // Some games use pointer lock - we need to dispatch movement
        const moveEvent = new MouseEvent('mousemove', {
          movementX: moveX,
          movementY: moveY,
          clientX: rect.left + cx + moveX,
          clientY: rect.top + cy + moveY,
          bubbles: true
        });
        
        canvas.dispatchEvent(moveEvent);
        
        // Also try direct pointer lock manipulation
        if (document.pointerLockElement === canvas) {
          // Store accumulated movement for games that read movementX/Y
          window.__aimbot_dx = (window.__aimbot_dx || 0) + moveX;
          window.__aimbot_dy = (window.__aimbot_dy || 0) + moveY;
        }
      }
      
      // Method 2: Direct camera manipulation (for games exposing camera)
      if (window.game && window.game.camera) {
        const sensitivity = 0.001;
        window.game.camera.rotation.y -= moveX * sensitivity;
        window.game.camera.rotation.x -= moveY * sensitivity;
      }
      
      // Method 3: Window-level mouse event override
      const originalMouseMove = window.onmousemove;
      Object.defineProperty(window, 'onmousemove', {
        get() { return originalMouseMove; },
        set() {}
      });
    }
  };

  // Hook into game loops if possible
  const hookGameLoop = () => {
    // Try to find and patch requestAnimationFrame or game update
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      aimbotCore.update();
      return originalRAF.call(this, callback);
    };
    
    // Alternative: run our own loop
    if (!window.__aimbotInterval) {
      window.__aimbotInterval = setInterval(() => {
        aimbotCore.update();
      }, 1000 / 60); // 60fps
    }
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
    
    /* Aimbot FOV circle visualization */
    #aimbot-fov {
      position: fixed;
      pointer-events: none;
      z-index: 2147483645;
      border: 2px solid rgba(119, 119, 255, 0.3);
      border-radius: 50%;
      display: none;
    }
    
    #aimbot-target {
      position: fixed;
      width: 10px;
      height: 10px;
      background: red;
      border-radius: 50%;
      pointer-events: none;
      z-index: 2147483645;
      display: none;
      box-shadow: 0 0 10px red;
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

  // Add FOV circle and target indicator
  const fovCircle = document.createElement("div");
  fovCircle.id = "aimbot-fov";
  
  const targetIndicator = document.createElement("div");
  targetIndicator.id = "aimbot-target";

  document.body.appendChild(menu);
  document.body.appendChild(slider);
  document.body.appendChild(button);
  document.body.appendChild(fovCircle);
  document.body.appendChild(targetIndicator);

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
      mods[1] = "Team Check";
      mods[2] = "Show FOV";
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
            class="mm-mod ${section === "ADVANTAGES" && i === 0 && state.aimbot ? "active" : ""}
            ${section === "ADVANTAGES" && i === 1 && state.teamCheck ? "active" : ""}
            ${section === "ADVANTAGES" && i === 2 && state.showFOV ? "active" : ""}"
            data-index="${i}">
            ${name}
          </button>
        `).join("")}
      </div>

      <div class="mm-status">
        ${section === "ADVANTAGES"
          ? "Aimbot: " + (state.aimbot ? "ON" : "OFF") + " | Strength: " + state.aimbotStrength + "%"
          : "More mods coming soon."}
      </div>
    `;

    body.querySelector(".mm-back").addEventListener("click", renderHome);

    if (section === "ADVANTAGES") {
      body.querySelector(".mm-mod[data-index='0']")
        .addEventListener("click", toggleAimbot);
      body.querySelector(".mm-mod[data-index='1']")
        .addEventListener("click", toggleTeamCheck);
      body.querySelector(".mm-mod[data-index='2']")
        .addEventListener("click", toggleShowFOV);
    }
  }

  function toggleAimbot() {
    state.aimbot = !state.aimbot;

    const modButton = body.querySelector(".mm-mod[data-index='0']");

    if (modButton) {
      modButton.classList.toggle("active", state.aimbot);
    }

    slider.style.display = state.aimbot ? "block" : "none";
    
    // Show/hide FOV circle
    fovCircle.style.display = (state.aimbot && state.showFOV) ? "block" : "none";
    
    // Update FOV circle size
    if (state.aimbot && state.showFOV) {
      const size = Math.min(window.innerWidth, window.innerHeight) * (state.aimbotFOV / 180);
      fovCircle.style.width = size + "px";
      fovCircle.style.height = size + "px";
      fovCircle.style.left = (window.innerWidth / 2 - size / 2) + "px";
      fovCircle.style.top = (window.innerHeight / 2 - size / 2) + "px";
    }

    positionSlider();

    if (state.aimbot) {
      console.log("[Mod Menu] Aimbot enabled:", state.aimbotStrength);
      hookGameLoop(); // Start the aimbot loop
    } else {
      console.log("[Mod Menu] Aimbot disabled");
      targetIndicator.style.display = "none";
    }
    
    // Refresh the section to update status text
    if (state.section === "ADVANTAGES") {
      renderSection("ADVANTAGES");
    }
  }
  
  function toggleTeamCheck() {
    state.teamCheck = !state.teamCheck;
    const modButton = body.querySelector(".mm-mod[data-index='1']");
    if (modButton) {
      modButton.classList.toggle("active", state.teamCheck);
    }
    console.log("[Mod Menu] Team check:", state.teamCheck);
  }
  
  function toggleShowFOV() {
    state.showFOV = !state.showFOV;
    const modButton = body.querySelector(".mm-mod[data-index='2']");
    if (modButton) {
      modButton.classList.toggle("active", state.showFOV);
    }
    fovCircle.style.display = (state.aimbot && state.showFOV) ? "block" : "none";
    console.log("[Mod Menu] Show FOV:", state.showFOV);
  }

  function positionSlider() {
    if (!state.aimbot) return;

    const rect = menu.getBoundingClientRect();

    slider.style.left = `${rect.right + 10}px`;
    slider.style.top = `${rect.top + 48}px`;
  }

  strengthSlider.addEventListener("input", () => {
    state.aimbotStrength = Number(strengthSlider.value);
    strengthValue.textContent = `${state.aimbotStrength}%`;
    
    // Update status if visible
    const status = body.querySelector(".mm-status");
    if (status && state.section === "ADVANTAGES") {
      status.textContent = "Aimbot: " + (state.aimbot ? "ON" : "OFF") + " | Strength: " + state.aimbotStrength + "%";
    }
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

    menu.style.left = `${Math.max(5, e.clientX - offsetX)}px`;
    menu.style.top = `${Math.max(5, e.clientY - offsetY)}px`;
    menu.style.bottom = "auto";

    positionSlider();
  });

  header.addEventListener("pointerup", () => {
    dragging = false;
  });

  window.addEventListener("resize", () => {
    positionSlider();
    // Update FOV circle position on resize
    if (state.aimbot && state.showFOV) {
      const size = Math.min(window.innerWidth, window.innerHeight) * (state.aimbotFOV / 180);
      fovCircle.style.width = size + "px";
      fovCircle.style.height = size + "px";
      fovCircle.style.left = (window.innerWidth / 2 - size / 2) + "px";
      fovCircle.style.top = (window.innerHeight / 2 - size / 2) + "px";
    }
  });

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
