  const aimbotCore = {
    getDistanceToEnemy(target) {
      if (target.position) {
        const dx = target.position.x - (window.game?.camera?.position?.x || 0);
        const dy = target.position.y - (window.game?.camera?.position?.y || 0);
        const dz = target.position.z - (window.game?.camera?.position?.z || 0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
      if (target.x !== undefined && target.y !== undefined) {
        const playerX = window.game?.localPlayer?.x || window.innerWidth / 2;
        const playerY = window.game?.localPlayer?.y || window.innerHeight / 2;
        const dx = target.x - playerX;
        const dy = target.y - playerY;
        return Math.sqrt(dx*dx + dy*dy);
      }
      const pos = this.getTargetPos(target);
      if (!pos) return Infinity;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return Math.sqrt(Math.pow(pos.x - cx, 2) + Math.pow(pos.y - cy, 2));
    },
    
    getTargetPos(target, headshot = false) {
      // Try to get head position first for headshots
      if (headshot && target.headPosition) {
        if (target.headPosition.clone) {
          const pos = target.headPosition.clone();
          if (window.game?.camera) {
            pos.project(window.game.camera);
            return { x: (pos.x + 1) * window.innerWidth / 2, y: (-pos.y + 1) * window.innerHeight / 2 };
          }
          return { x: target.headPosition.x, y: target.headPosition.y };
        }
        return { x: target.headPosition.x, y: target.headPosition.y };
      }
      
      // Try head bone for 3D games
      if (headshot && target.bones) {
        const head = target.bones.find(b => b.name === 'head' || b.name === 'HEAD');
        if (head && window.game?.camera) {
          const pos = head.position.clone ? head.position.clone() : { ...head.position };
          pos.project(window.game.camera);
          return { x: (pos.x + 1) * window.innerWidth / 2, y: (-pos.y + 1) * window.innerHeight / 2 };
        }
      }
      
      // Offset for headshot (aim higher)
      if (target.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        if (headshot) {
          // Aim at top 20% of hitbox (head area)
          return { x: centerX, y: rect.top + rect.height * 0.2 };
        }
        return { x: centerX, y: centerY };
      }
      
      if (target.position && window.game?.camera) {
        const pos = target.position.clone ? target.position.clone() : target.position;
        pos.project(window.game.camera);
        const screenX = (pos.x + 1) * window.innerWidth / 2;
        const screenY = (-pos.y + 1) * window.innerHeight / 2;
        if (headshot) {
          // Move up for headshot
          return { x: screenX, y: screenY - 30 };
        }
        return { x: screenX, y: screenY };
      }
      
      if (target.x !== undefined && target.y !== undefined) {
        if (headshot) {
          return { x: target.x, y: target.y - 20 };
        }
        return { x: target.x, y: target.y };
      }
      
      return null;
    },
    
    isOnScreen(pos) {
      if (!pos) return false;
      if (state.lockThroughWalls) return true; // Skip visibility check
      return pos.x > -100 && pos.x < window.innerWidth + 100 && 
             pos.y > -100 && pos.y < window.innerHeight + 100;
    },
    
    isInFOV(target) {
      if (state.aimbotFOV >= 360) return true;
      const pos = this.getTargetPos(target);
      if (!pos) return false;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const angle = Math.atan2(pos.y - cy, pos.x - cx) * 180 / Math.PI;
      const normalizedAngle = ((angle % 360) + 360) % 360;
      const angleDiff = Math.abs(normalizedAngle - 0);
      return angleDiff <= state.aimbotFOV / 2;
    },
    
    findClosestEnemy() {
      const targets = this.findTargets();
      if (targets.length === 0) return null;
      let closest = null;
      let closestDist = Infinity;
      
      for (const target of targets) {
        // Skip visibility check if lock through walls is on
        if (!state.lockThroughWalls) {
          const pos = this.getTargetPos(target);
          if (!this.isOnScreen(pos)) continue;
        }
        
        if (!this.isInFOV(target)) continue;
        
        const dist = this.getDistanceToEnemy(target);
        if (dist < closestDist) {
          closestDist = dist;
          closest = { element: target, dist };
        }
      }
      
      // Get fresh position for the closest target (with headshot)
      if (closest) {
        closest.pos = this.getTargetPos(closest.element, true); // true = headshot
      }
      
      return closest;
    },
    
    findTargets() {
      const targets = [];
      
      // Scan larger area if lock through walls is on
      const scanAll = state.lockThroughWalls;
      
      if (window.game) {
        if (window.game.players) {
          Object.values(window.game.players).forEach(p => {
            if (p && !p.isLocal && (p.active !== false || scanAll) && (p.health > 0 || scanAll)) {
              if (!state.teamCheck || p.team !== window.game.localPlayer?.team) {
                targets.push(p);
              }
            }
          });
        }
        if (window.game.enemies) {
          Object.values(window.game.enemies).forEach(e => {
            if (e && (e.active !== false || scanAll)) targets.push(e);
          });
        }
        if (window.game.entities) {
          Object.values(window.game.entities).forEach(e => {
            if (e && e.type === 'enemy' && (e.active !== false || scanAll)) targets.push(e);
          });
        }
      }
      
      if (targets.length === 0) {
        const selectors = ['.player:not(.local)', '.enemy', '[class*="enemy"]', 
          '[class*="opponent"]', '[class*="target"]', '[data-team]:not([data-team="own"])'];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            // More lenient size check if locking through walls
            const minSize = scanAll ? 1 : 5;
            if (rect.width > minSize && rect.height > minSize) {
              if (scanAll) {
                targets.push(el);
              } else {
                const style = window.getComputedStyle(el);
                if (style.display !== 'none' && style.visibility !== 'hidden') {
                  targets.push(el);
                }
              }
            }
          });
        }
      }
      
      return targets;
    },
    
    lockOnto(targetData) {
      if (!targetData || !targetData.pos) return;
      
      const { pos } = targetData;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      
      const dx = pos.x - cx;
      const dy = pos.y - cy;
      
      // INSANE MODE: 100% = INSTANT SNAP, no smoothing
      const strength = state.aimbotStrength;
      
      let moveX, moveY;
      
      if (strength >= 100) {
        // INSTANT SNAP - teleport crosshair to head
        moveX = dx;
        moveY = dy;
      } else if (strength >= 80) {
        // FAST - almost instant
        const speed = 0.5 + (strength / 200);
        moveX = dx * speed;
        moveY = dy * speed;
      } else {
        // NORMAL - smoothed
        const speed = 0.05 + (strength / 200);
        moveX = dx * speed;
        moveY = dy * speed;
      }
      
      // Update visual indicator
      const indicator = document.getElementById('aimbot-target');
      if (indicator) {
        indicator.style.display = 'block';
        indicator.style.left = (pos.x - 8) + 'px';
        indicator.style.top = (pos.y - 8) + 'px';
        // Change color based on strength
        if (strength >= 100) {
          indicator.style.borderColor = '#ff0000';
          indicator.style.boxShadow = '0 0 30px #ff0000, 0 0 60px #ff0000';
        } else if (strength >= 80) {
          indicator.style.borderColor = '#ff8800';
          indicator.style.boxShadow = '0 0 20px #ff8800, 0 0 40px #ff8800';
        } else {
          indicator.style.borderColor = '#ffd700';
          indicator.style.boxShadow = '0 0 20px #ffd700, 0 0 40px #ffd700';
        }
      }
      
      // Apply aim - Try multiple methods to ensure it works
      
      // Method 1: Pointer Lock (Mouse Movement)
      if (document.pointerLockElement) {
        const canvas = document.pointerLockElement;
        // Dispatch a synthetic mouse move event
        const event = new MouseEvent('mousemove', { 
          movementX: moveX, 
          movementY: moveY, 
          bubbles: true 
        });
        canvas.dispatchEvent(event);
        
        // Also try to update internal camera controls if available
        if (window.game?.controls) {
          const sens = strength >= 100 ? 0.001 : 0.002;
          window.game.controls.yaw -= moveX * sens;
          window.game.controls.pitch -= moveY * sens;
        }
        return;
      }
      
      // Method 2: Direct Camera Rotation (Three.js style)
      if (window.game?.camera) {
        const sensitivity = strength >= 100 ? 0.001 : 0.002;
        // Ensure we don't break the camera rotation structure
        if (window.game.camera.rotation) {
          window.game.camera.rotation.y -= moveX * sensitivity;
          window.game.camera.rotation.x -= moveY * sensitivity;
        }
        return;
      }
      
      // Method 3: Direct Canvas Mouse Move (Fallback)
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const event = new MouseEvent('mousemove', {
          clientX: rect.left + cx + moveX,
          clientY: rect.top + cy + moveY,
          movementX: moveX,
          movementY: moveY,
          bubbles: true
        });
        canvas.dispatchEvent(event);
      }
    },
    
    update() {
      if (!state.aimbot) {
        const indicator = document.getElementById('aimbot-target');
        if (indicator) {
          indicator.style.display = 'none';
          indicator.style.borderColor = '#ffd700';
          indicator.style.boxShadow = '0 0 20px #ffd700, 0 0 40px #ffd700';
        }
        return;
      }
      
      const target = this.findClosestEnemy();
      
      if (target) {
        state.target = target;
        this.lockOnto(target);
      } else {
        state.target = null;
        const indicator = document.getElementById('aimbot-target');
        if (indicator) indicator.style.display = 'none';
      }
    }
  };

  const hookGameLoop = () => {
    if (window.__aimbotHooked) return;
    window.__aimbotHooked = true;
    
    // Use only requestAnimationFrame for smoother updates
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      aimbotCore.update();
      return originalRAF.call(this, callback);
    };
  };
