javascript:(function(){
    // --- 1. Configuration ---
    const config = {
        aimbot: {
            enabled: true,
            fov: 180,
            smooth: 10, 
            maxDistance: 1000,
            silent: true, 
            autoFire: false,
            lockThroughWalls: false, 
            showFov: false 
        },
        visuals: {
            showHealth: false,
            showName: true,
            showDistance: false
        },
        fun: {
            speed: false,
            fly: false
        }
    };

    // --- 2. State & Globals ---
    let target = null;
    let isFiring = false;
    let fireTimer = 0;
    let menuDiv = null;
    let modsBtn = null;
    let isMenuOpen = false;
    let contentDiv = null; 
    let fovCanvas = null;
    let ctx = null;

    // --- 3. Menu UI ---
    const createMenu = () => {
        if (menuDiv) return;

        // Toggle Button
        modsBtn = document.createElement('button');
        modsBtn.innerText = "Mods";
        modsBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 10000;
            padding: 12px 24px;
            background: #007aff;
            color: white;
            border: none;
            cursor: pointer;
            border-radius: 20px;
            font-size: 16px;
            font-weight: bold;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            touch-action: manipulation;
            font-family: sans-serif;
        `;
        modsBtn.onclick = () => {
            isMenuOpen = !isMenuOpen;
            menuDiv.style.display = isMenuOpen ? 'block' : 'none';
        };
        document.body.appendChild(modsBtn);

        // Main Menu Container
        menuDiv = document.createElement('div');
        menuDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1c1c1e;
            color: white;
            padding: 0;
            border-radius: 16px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            z-index: 9999;
            width: 300px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
            border: 1px solid #333;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px;
            background: #2c2c2e;
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid #444;
            user-select: none;
        `;
        header.innerText = "Veck Menu";
        menuDiv.appendChild(header);

        // Content Area
        contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            touch-action: pan-y;
        `;
        menuDiv.appendChild(contentDiv);

        // Footer
        const footer = document.createElement('div');
        footer.style.cssText = `
            padding: 10px;
            background: #2c2c2e;
            text-align: center;
            border-top: 1px solid #444;
        `;
        const closeBtn = document.createElement('button');
        closeBtn.innerText = "Close";
        closeBtn.style.cssText = `
            background: #ff3b30;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
            width: 100%;
        `;
        closeBtn.onclick = () => {
            isMenuOpen = false;
            menuDiv.style.display = 'none';
        };
        footer.appendChild(closeBtn);
        menuDiv.appendChild(footer);

        document.body.appendChild(menuDiv);
        makeDraggable(menuDiv, header);
        renderHome();
    };

    // --- 4. View Rendering ---
    const renderHome = () => {
        currentSection = 'home';
        contentDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button onclick="window._vSwitch('fun')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    🎉 Fun
                </button>
                <button onclick="window._vSwitch('advantages')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    ⚡ Advantages
                </button>
                <button onclick="window._vSwitch('visual')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600;">
                    👁️ Visual
                </button>
            </div>
        `;
    };

    let currentSection = 'home';
    
    const renderFun = () => {
        currentSection = 'fun';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Fun</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="alert('Speed mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🏃 Speed</button>
                <button onclick="alert('Fly mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🦅 Fly</button>
                <button onclick="alert('Jump mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🦘 Jump</button>
                <button onclick="alert('Skin mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🎨 Skin</button>
                <button onclick="alert('Emote mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">😂 Emote</button>
                <button onclick="alert('Pet mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🐶 Pet</button>
            </div>
        `;
    };

    const renderAdvantages = () => {
        currentSection = 'advantages';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Advantages</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="window._vSwitch('aimbot')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                    🎯 Aimbot
                </button>
                <button onclick="alert('Regen mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🛡️ Regen</button>
                <button onclick="alert('Speed mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">⚡ Speed</button>
                <button onclick="alert('Fly mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🚀 Fly</button>
                <button onclick="alert('Explosive mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">💥 Explosive</button>
                <button onclick="alert('Rocket mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🔥 Rocket</button>
            </div>
        `;
    };

    const renderVisuals = () => {
        currentSection = 'visual';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('home')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Visual</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="alert('ESP Box mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📦 ESP Box</button>
                <button onclick="alert('Lines mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📏 Lines</button>
                <button onclick="alert('Health Bar mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">❤️ Health</button>
                <button onclick="alert('Name Tags mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🏷️ Names</button>
                <button onclick="alert('Chams mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🎨 Chams</button>
                <button onclick="alert('No Fog mod coming soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">🌫️ No Fog</button>
            </div>
        `;
    };

    const renderAimbot = () => {
        currentSection = 'aimbot';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._vSwitch('advantages')" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Aimbot</h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Intensity</span>
                    <span id="smoothVal">${config.aimbot.smooth}</span>
                </label>
                <input type="range" id="smoothRange" min="1" max="20" value="${config.aimbot.smooth}" style="width: 100%;">
                <small style="color: #888;">Higher = Smoother</small>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Lock Through Walls</span>
                    <input type="checkbox" id="lockWalls" ${config.aimbot.lockThroughWalls ? 'checked' : ''}>
                </label>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Show FOV Circle</span>
                    <input type="checkbox" id="showFov" ${config.aimbot.showFov ? 'checked' : ''}>
                </label>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>FOV Radius</span>
                    <span id="fovVal">${config.aimbot.fov}</span>
                </label>
                <input type="range" id="fovRange" min="1" max="360" value="${config.aimbot.fov}" style="width: 100%;">
            </div>
        `;

        const smoothRange = contentDiv.querySelector('#smoothRange');
        const fovRange = contentDiv.querySelector('#fovRange');
        const lockWalls = contentDiv.querySelector('#lockWalls');
        const showFov = contentDiv.querySelector('#showFov');

        smoothRange.oninput = (e) => {
            config.aimbot.smooth = parseInt(e.target.value);
            contentDiv.querySelector('#smoothVal').innerText = e.target.value;
        };
        fovRange.oninput = (e) => {
            config.aimbot.fov = parseInt(e.target.value);
            contentDiv.querySelector('#fovVal').innerText = e.target.value;
        };
        lockWalls.onchange = (e) => {
            config.aimbot.lockThroughWalls = e.target.checked;
        };
        showFov.onchange = (e) => {
            config.aimbot.showFov = e.target.checked;
        };
    };

    // Global switcher
    window._vSwitch = (section) => {
        if (section === 'fun') renderFun();
        else if (section === 'advantages') renderAdvantages();
        else if (section === 'visual') renderVisuals();
        else if (section === 'aimbot') renderAimbot();
        else if (section === 'home') renderHome();
    };

    // --- 5. Drag Logic ---
    const makeDraggable = (el, handle) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onStart = (e) => {
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;
            el.style.transition = 'none';
            el.style.transform = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        };

        const onEnd = () => {
            isDragging = false;
            el.style.transition = 'all 0.1s ease';
        };

        const h = handle || menuDiv.querySelector('div[style*="padding: 15px"]');
        if(h) {
            h.addEventListener('mousedown', onStart);
            h.addEventListener('touchstart', onStart, { passive: false });
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    };

    // --- 6. Aimbot Logic ---
    const aimbotCore = {
        update: () => {
            if (!window.game || !window.game.camera) return;
            if (!config.aimbot.enabled) {
                target = null;
                return;
            }

            const players = window.game.entities.players;
            if (!players) return;

            let closestDist = Infinity;
            let closestPlayer = null;
            const camPos = window.game.camera.position;
            const camRot = window.game.camera.rotation;

            players.forEach(p => {
                if (!p || !p.visible) return;
                
                const dx = p.position.x - camPos.x;
                const dz = p.position.z - camPos.z;
                const dist = Math.sqrt(dx*dx + dz*dz);

                if (dist > config.aimbot.maxDistance) return;

                const angle = Math.atan2(dx, dz);
                let angleDiff = Math.abs(angle - camRot.x);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                if (config.aimbot.lockThroughWalls) {
                     if (dist < closestDist) {
                        closestDist = dist;
                        closestPlayer = p;
                    }
                } else {
                    if (angleDiff < (config.aimbot.fov / 2) * (Math.PI / 180)) {
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestPlayer = p;
                        }
                    }
                }
            });

            target = closestPlayer;

            if (target) {
                const targetAngle = Math.atan2(target.position.x - camPos.x, target.position.z - camPos.z);
                let diff = targetAngle - camRot.x;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;
                camRot.x += diff / config.aimbot.smooth;

                const targetY = target.position.y + 1.5;
                const pitch = Math.atan2(targetY - camPos.y, closestDist);
                window.game.camera.rotation.y += (pitch - window.game.camera.rotation.y) / config.aimbot.smooth;

                if (config.aimbot.autoFire) {
                    if (!isFiring) {
                        if (window.game.actions && window.game.actions.fire) {
                            window.game.actions.fire();
                        }
                        isFiring = true;
                        fireTimer = config.aimbot.autoFireDelay;
                    }
                } else {
                    isFiring = false;
                }
            } else {
                isFiring = false;
            }
        }
    };

    // --- 7. Visuals (FOV) ---
    const hookRender = () => {
        if (window.__aimbotRendered) return;
        window.__aimbotRendered = true;

        if (!document.getElementById('veks-fov-canvas')) {
            fovCanvas = document.createElement('canvas');
            fovCanvas.id = 'veks-fov-canvas';
            fovCanvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 9998;
            `;
            document.body.appendChild(fovCanvas);
            ctx = fovCanvas.getContext('2d');
        }

        window.requestAnimationFrame(function renderLoop() {
            if (fovCanvas && config.aimbot.showFov && target) {
                const canvas = fovCanvas;
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                const screenPos = projectToScreen(target.position);
                if (screenPos) {
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, 20, 0, Math.PI * 2);
                    ctx.strokeStyle = '#007aff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x - 5, screenPos.y);
                    ctx.lineTo(screenPos.x + 5, screenPos.y);
                    ctx.moveTo(screenPos.x, screenPos.y - 5);
                    ctx.lineTo(screenPos.x, screenPos.y + 5);
                    ctx.stroke();
                }
            } else if (fovCanvas) {
                const ctx = fovCanvas.getContext('2d');
                ctx.clearRect(0, 0, fovCanvas.width, fovCanvas.height);
            }
            
            requestAnimationFrame(renderLoop);
        });
    };

    // --- Helper ---
    const projectToScreen = (pos) => {
        if (!window.game || !window.game.camera) return null;
        const camPos = window.game.camera.position;
        const camRot = window.game.camera.rotation;
        const dx = pos.x - camPos.x;
        const dz = pos.z - camPos.z;
        const dy = pos.y - camPos.y;
        const cosX = Math.cos(camRot.x);
        const sinX = Math.sin(camRot.x);
        const cosY = Math.cos(camRot.y);
        const sinY = Math.sin(camRot.y);
        const rx = dx * cosX - dz * sinX;
        const rz = dx * sinX + dz * cosX;
        const ry = dy * cosY - rz * sinY;
        const rzFinal = dy * sinY + rz * cosY;
        const fov = 60; 
        const fovRad = fov * (Math.PI / 180);
        if (rzFinal <= 0) return null; 
        const screenX = window.innerWidth / 2 + (rx / rzFinal) * (window.innerWidth / (2 * Math.tan(fovRad / 2)));
        const screenY = window.innerHeight / 2 - (ry / rzFinal) * (window.innerHeight / (2 * Math.tan(fovRad / 2)));
        return { x: screenX, y: screenY };
    };

    // --- 8. Initialization ---
    const init = () => {
        createMenu();
        
        // Wait for game
        if (window.game) {
            hookGameLoop();
            hookRender();
        } else {
            const checkGame = setInterval(() => {
                if (window.game) {
                    clearInterval(checkGame);
                    hookGameLoop();
                    hookRender();
                }
            }, 100);
        }
    };

    const hookGameLoop = () => {
        if (window.__aimbotHooked) return;
        window.__aimbotHooked = true;
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            aimbotCore.update();
            return originalRAF.call(this, callback);
        };
    };

    init();

})();
