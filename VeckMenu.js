javascript:(function(){
    // --- Configuration ---
    const config = {
        aimbot: {
            enabled: true,
            fov: 180, // Default visual FOV
            smooth: 10, // Intensity (Higher = Slower/Smoother, Lower = Fast/Snappy)
            maxDistance: 1000,
            silent: true, // Default to silent so walls don't matter visually
            autoFire: false,
            autoFireDelay: 150,
            lockThroughWalls: false, // Key feature
            showFov: false // Key feature
        },
        visuals: {
            showHealth: false,
            showName: true,
            showDistance: false
        }
    };

    // --- State ---
    let target = null;
    let isFiring = false;
    let fireTimer = 0;
    
    // --- UI State ---
    let currentSection = 'home'; // home, fun, visual
    let menuDiv = null;
    let modsBtn = null;
    let isMenuOpen = false;
    let contentDiv = null; // The scrollable part of the menu

    // --- Initialization ---
    const init = () => {
        createMenu();
        hookGameLoop();
        hookRender();
    };

    // --- Menu UI Builder ---
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
        `;
        header.innerText = "Veck Menu";
        menuDiv.appendChild(header);

        // Content Area (Scrollable)
        contentDiv = document.createElement('div');
        contentDiv.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 15px;
            touch-action: pan-y;
        `;
        menuDiv.appendChild(contentDiv);

        // Footer (Close Button)
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
        makeDraggable(menuDiv);
        renderHome();
    };

    // --- View Rendering ---
    const renderHome = () => {
        currentSection = 'home';
        contentDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
                <button onclick="window._vekswitch='fun'; window._veksrender()" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600; text-align: left;">
                    ⚡ Fun Advantages
                </button>
                <button onclick="window._vekswitch='visual'; window._veksrender()" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 18px; font-weight: 600; text-align: left;">
                    👁️ Visuals
                </button>
            </div>
        `;
    };

    window._vekswitch = 'fun';
    window._veksrender = renderFun;

    const renderFun = () => {
        currentSection = 'fun';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._veksrender()" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Fun Advantages</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <!-- Aimbot -->
                <button onclick="window._veksopenAimbot()" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">
                    🎯 Aimbot
                </button>
                <!-- Placeholders for other mods -->
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">
                    🏃 Speed
                </button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">
                    🦅 Fly
                </button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">
                    🛡️ Regen
                </button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">
                    💣 Explosive
                </button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">
                    🚀 Rocket
                </button>
            </div>
        `;
    };

    const renderVisuals = () => {
        currentSection = 'visual';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._veksrender()" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Visuals</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📦 ESP Box</button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #3a3a3c; color: white; border: none; border-radius: 12px; font-size: 16px; font-weight: 600;">📏 Lines</button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">Health Bar</button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">Name Tags</button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">Chams</button>
                <button onclick="alert('Coming Soon')" style="padding: 20px; background: #2c2c2e; color: #888; border: 1px dashed #555; border-radius: 12px; font-size: 16px;">No Fog</button>
            </div>
        `;
    };

    window._veksopenAimbot = () => {
        currentSection = 'aimbot';
        contentDiv.innerHTML = `
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
                <button onclick="window._veksrender()" style="background: none; border: none; color: #007aff; font-size: 16px; padding: 0; margin-right: 10px;">← Back</button>
                <h3 style="margin: 0;">Aimbot</h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>Intensity</span>
                    <span id="smoothVal">${config.aimbot.smooth}</span>
                </label>
                <input type="range" id="smoothRange" min="1" max="20" value="${config.aimbot.smooth}" style="width: 100%;">
                <small style="color: #888;">Higher = Smoother, Lower = Snappy</small>
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

        // Bind Inputs
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
            config.aimbot.silent = e.target.checked; // Silent aim usually goes with wall lock
        };
        showFov.onchange = (e) => {
            config.aimbot.showFov = e.target.checked;
        };
    };

    // --- Drag Logic ---
    const makeDraggable = (el) => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        const onStart = (e) => {
            // Only drag if touching the header or empty space, not inputs
            if(e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
            
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            startX = touch.clientX;
            startY = touch.clientY;
            initialLeft = el.offsetLeft;
            initialTop = el.offsetTop;
            el.style.transition = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            const touch = e.touches ? e.touches[0] : e;
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;
            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
            el.style.transform = 'none';
        };

        const onEnd = () => {
            isDragging = false;
            el.style.transition = 'all 0.1s ease';
        };

        // Header click to drag
        const header = menuDiv.querySelector('div[style*="padding: 15px"]');
        if(header) {
            header.addEventListener('mousedown', onStart);
            header.addEventListener('touchstart', onStart, { passive: false });
        }

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);
    };

    // --- Aimbot Logic ---
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
                
                // FOV Check
                let angleDiff = Math.abs(angle - camRot.x);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

                // If "Lock Through Walls" is ON, we ignore FOV for targeting
                // But we still need to know if they are "in front" generally to avoid 360 snaps if desired
                // Here, we strictly follow: if LockThroughWalls is true, target ANY player in range
                if (config.aimbot.lockThroughWalls) {
                     if (dist < closestDist) {
                        closestDist = dist;
                        closestPlayer = p;
                    }
                } else {
                    // Standard FOV targeting
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
                // Smooth Rotation
                const targetAngle = Math.atan2(target.position.x - camPos.x, target.position.z - camPos.z);
                
                let diff = targetAngle - camRot.x;
                while (diff <= -Math.PI) diff += Math.PI * 2;
                while (diff > Math.PI) diff -= Math.PI * 2;

                camRot.x += diff / config.aimbot.smooth;

                // Silent Aim (Y axis)
                const targetY = target.position.y + 1.5; // Head height
                const pitch = Math.atan2(targetY - camPos.y, closestDist);
                window.game.camera.rotation.y += (pitch - window.game.camera.rotation.y) / config.aimbot.smooth;

                // Auto Fire
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

    // --- Visuals (FOV Circle) ---
    let fovCanvas = null;
    const hookRender = () => {
        if (window.__aimbotRendered) return;
        window.__aimbotRendered = true;

        // Create Canvas if not exists
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

                // Project 3D target to 2D screen
                const screenPos = projectToScreen(target.position);
                if (screenPos) {
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, 20, 0, Math.PI * 2);
                    ctx.strokeStyle = '#007aff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    
                    // Crosshair
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

    // --- Helper: Project 3D to 2D ---
    const projectToScreen = (pos) => {
        if (!window.game || !window.game.camera) return null;
        
        const camPos = window.game.camera.position;
        const camRot = window.game.camera.rotation;
        
        // Simple orthographic-ish projection for veck.io
        const dx = pos.x - camPos.x;
        const dz = pos.z - camPos.z;
        const dy = pos.y - camPos.y;

        // Rotation matrices
        const cosX = Math.cos(camRot.x);
        const sinX = Math.sin(camRot.x);
        const cosY = Math.cos(camRot.y);
        const sinY = Math.sin(camRot.y);

        // Rotate around Y axis (Yaw)
        const rx = dx * cosX - dz * sinX;
        const rz = dx * sinX + dz * cosX;

        // Rotate around X axis (Pitch)
        const ry = dy * cosY - rz * sinY;
        const rzFinal = dy * sinY + rz * cosY;

        // FOV scaling (approximate)
        const fov = 60; // Default FOV in degrees
        const fovRad = fov * (Math.PI / 180);
        
        if (rzFinal <= 0) return null; // Behind camera

        const screenX = window.innerWidth / 2 + (rx / rzFinal) * (window.innerWidth / (2 * Math.tan(fovRad / 2)));
        const screenY = window.innerHeight / 2 - (ry / rzFinal) * (window.innerHeight / (2 * Math.tan(fovRad / 2)));

        return { x: screenX, y: screenY };
    };

    // --- Hooking ---
    const hookGameLoop = () => {
        if (window.__aimbotHooked) return;
        
        if (!window.game) {
            setTimeout(hookGameLoop, 100);
            return;
        }

        window.__aimbotHooked = true;

        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = function(callback) {
            aimbotCore.update();
            return originalRAF.call(this, callback);
        };
    };

    // Run
    init();

})();
