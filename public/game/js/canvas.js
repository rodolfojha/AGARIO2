class Canvas {
    constructor(params) {
        // Verificar que global esté disponible
        if (typeof global === 'undefined') {
            console.error('❌ Global not available for Canvas - delaying initialization');
            this.initLater();
            return;
        }
        
        this.directionLock = false;
        this.target = global.target || { x: 0, y: 0 };
        this.reenviar = true;
        this.socket = global.socket || null;
        this.directions = [];
        this.bettingClient = null;
        
        var self = this;

        this.cv = document.getElementById('cvs');
        if (this.cv) {
            this.cv.width = global.screen.width;
            this.cv.height = global.screen.height;
            
            // Event listeners con bind correcto
            this.cv.addEventListener('mousemove', function(e) { self.gameInput(e); }, false);
            this.cv.addEventListener('mouseout', function() { self.outOfBounds(); }, false);
            this.cv.addEventListener('keypress', function(e) { self.keyInput(e); }, false);
            this.cv.addEventListener('keyup', function(event) {
                self.reenviar = true;
                self.directionUp(event);
            }, false);
            this.cv.addEventListener('keydown', function(e) { self.directionDown(e); }, false);
            this.cv.addEventListener('touchstart', function(e) { self.touchInput(e); }, false);
            this.cv.addEventListener('touchmove', function(e) { self.touchInput(e); }, false);
        }
        
        global.canvas = this;
        console.log('🎮 Canvas initialized successfully');
    }

    // Método para inicializar más tarde si global no está disponible
    initLater() {
        const self = this;
        const checkGlobal = setInterval(() => {
            if (typeof global !== 'undefined') {
                clearInterval(checkGlobal);
                console.log('🔄 Retrying Canvas initialization...');
                self.constructor();
            }
        }, 100);
    }

    // === CONTROLES DE DIRECCIÓN ===
    
    directionDown(event) {
        var key = event.which || event.keyCode;
        if (this.directional(key)) {
            this.directionLock = true;
            if (this.newDirection(key, this.directions, true)) {
                this.updateTarget(this.directions);
                if (this.socket) {
                    this.socket.emit('0', this.target);
                }
            }
        }
    }

    directionUp(event) {
        var key = event.which || event.keyCode;
        if (this.directional(key)) {
            if (this.newDirection(key, this.directions, false)) {
                this.updateTarget(this.directions);
                if (this.directions.length === 0) this.directionLock = false;
                if (this.socket) {
                    this.socket.emit('0', this.target);
                }
            }
        }
    }

    newDirection(direction, list, isAddition) {
        var result = false;
        var found = false;
        for (var i = 0, len = list.length; i < len; i++) {
            if (list[i] == direction) {
                found = true;
                if (!isAddition) {
                    result = true;
                    list.splice(i, 1);
                }
                break;
            }
        }
        if (isAddition && found === false) {
            result = true;
            list.push(direction);
        }
        return result;
    }

    updateTarget(list) {
        this.target = { x: 0, y: 0 };
        var directionHorizontal = 0;
        var directionVertical = 0;
        for (var i = 0, len = list.length; i < len; i++) {
            if (directionHorizontal === 0) {
                if (list[i] == (global.KEY_LEFT || 37)) directionHorizontal -= Number.MAX_VALUE;
                else if (list[i] == (global.KEY_RIGHT || 39)) directionHorizontal += Number.MAX_VALUE;
            }
            if (directionVertical === 0) {
                if (list[i] == (global.KEY_UP || 38)) directionVertical -= Number.MAX_VALUE;
                else if (list[i] == (global.KEY_DOWN || 40)) directionVertical += Number.MAX_VALUE;
            }
        }
        this.target.x += directionHorizontal;
        this.target.y += directionVertical;
        
        if (typeof global !== 'undefined') {
            global.target = this.target;
        }
    }

    directional(key) {
        return this.horizontal(key) || this.vertical(key);
    }

    horizontal(key) {
        const LEFT = global && global.KEY_LEFT ? global.KEY_LEFT : 37;
        const RIGHT = global && global.KEY_RIGHT ? global.KEY_RIGHT : 39;
        return key == LEFT || key == RIGHT;
    }

    vertical(key) {
        const UP = global && global.KEY_UP ? global.KEY_UP : 38;
        const DOWN = global && global.KEY_DOWN ? global.KEY_DOWN : 40;
        return key == UP || key == DOWN;
    }

    // === CONTROLES DE MOUSE Y TOUCH ===
    
    outOfBounds() {
        const continuity = global && global.continuity ? global.continuity : false;
        if (!continuity) {
            this.target = { x: 0, y: 0 };
            if (global) {
                global.target = this.target;
            }
        }
    }

    gameInput(mouse) {
        const gameStart = global && global.gameStart ? global.gameStart : false;
        if (!this.directionLock && gameStart && this.cv) {
            this.target.x = mouse.clientX - this.cv.width / 2;
            this.target.y = mouse.clientY - this.cv.height / 2;
            if (global) {
                global.target = this.target;
            }
        }
    }

    touchInput(touch) {
        touch.preventDefault();
        touch.stopPropagation();
        const gameStart = global && global.gameStart ? global.gameStart : false;
        if (!this.directionLock && gameStart && this.cv) {
            this.target.x = touch.touches[0].clientX - this.cv.width / 2;
            this.target.y = touch.touches[0].clientY - this.cv.height / 2;
            if (global) {
                global.target = this.target;
            }
        }
    }

    // === CONTROLES DE ACCIONES ===
    
    keyInput(event) {
        var key = event.which || event.keyCode;
        
        const FIREFOOD = global && global.KEY_FIREFOOD ? global.KEY_FIREFOOD : 119; // w
        const SPLIT = global && global.KEY_SPLIT ? global.KEY_SPLIT : 32; // space
        const CHAT = global && global.KEY_CHAT ? global.KEY_CHAT : 13; // enter
        
        if (key === FIREFOOD && this.reenviar) {
            if (this.canFireFood()) {
                if (this.socket) {
                    this.socket.emit('1');
                    this.reenviar = false;
                    console.log('🔥 Fire food');
                }
            }
        }
        else if (key === SPLIT && this.reenviar) {
            if (this.canSplit()) {
                // No reproducir audio que no existe
                if (this.socket) {
                    this.socket.emit('2');
                    this.reenviar = false;
                    console.log('✂️ Split cell');
                }
            }
        }
        else if (key === CHAT) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.focus();
            }
        }
        // NUEVO: Hotkey para cash out
        else if (key === 67) { // Tecla 'C'
            const gameValue = global && global.gameValue ? global.gameValue : 0;
            if (gameValue > 0) {
                if (this.bettingClient && this.bettingClient.currentGame) {
                    this.bettingClient.showCashOutModal();
                    console.log('💰 Cash out hotkey pressed');
                } else if (window.bettingClient && window.bettingClient.currentGame) {
                    window.bettingClient.showCashOutModal();
                    console.log('💰 Cash out hotkey pressed');
                }
            }
        }
    }

    // === FUNCIONES DE VALIDACIÓN ===
    
    canFireFood() {
        // Verificar si el jugador tiene masa suficiente
        const playerObj = global && global.player ? global.player : null;
        if (!playerObj || !playerObj.cells || playerObj.cells.length === 0) {
            return false;
        }
        
        const minMass = 16; // Masa mínima para disparar comida
        return playerObj.cells.some(cell => cell.mass >= minMass);
    }

    canSplit() {
        // Verificar si el jugador puede dividirse
        const playerObj = global && global.player ? global.player : null;
        if (!playerObj || !playerObj.cells || playerObj.cells.length === 0) {
            return false;
        }
        if (playerObj.cells.length >= 16) {
            return false; // Límite de células
        }
        
        const minMass = 36; // Masa mínima para dividirse
        return playerObj.cells.some(cell => cell.mass >= minMass);
    }

    // === FUNCIÓN DE ACTUALIZACIÓN ===
    
    update() {
        // Actualizar referencias de forma segura
        if (global) {
            this.socket = global.socket;
            this.target = global.target || this.target;
        }
        
        // Actualizar referencia de betting client
        if (typeof bettingClient !== 'undefined') {
            this.bettingClient = bettingClient;
        } else if (window.bettingClient) {
            this.bettingClient = window.bettingClient;
        }
        
        // Enviar target al servidor si hay cambios
        if (this.socket && global && global.gameStart) {
            this.socket.emit('0', this.target);
        }
    }

    // === UTILIDADES ===
    
    focus() {
        if (this.cv) {
            this.cv.focus();
        }
    }

    resize(width, height) {
        if (this.cv) {
            this.cv.width = width;
            this.cv.height = height;
        }
        if (global) {
            global.screen.width = width;
            global.screen.height = height;
        }
    }

    // === SETUP DE CONTROLES MÓVILES ===
    
    setupMobileControls() {
        const self = this;
        
        // Botón split
        const splitBtn = document.getElementById('split');
        if (splitBtn) {
            splitBtn.onclick = function() {
                if (self.socket && global && global.gameStart) {
                    self.socket.emit('2');
                    console.log('✂️ Split (mobile)');
                }
            };
        }
        
        // Botón feed
        const feedBtn = document.getElementById('feed');
        if (feedBtn) {
            feedBtn.onclick = function() {
                if (self.socket && global && global.gameStart) {
                    self.socket.emit('1');
                    console.log('🔥 Feed (mobile)');
                }
            };
        }
        
        console.log('📱 Mobile controls setup');
    }

    // === MÉTODO PARA RECONECTAR ===
    
    reconnect(newSocket) {
        this.socket = newSocket;
        if (global) {
            global.socket = newSocket;
        }
        console.log('🔄 Canvas reconnected to socket');
    }
}

// === NO AUTO-INICIALIZACIÓN ===
// El Canvas se inicializará desde app-betting.js cuando sea necesario

// Export para compatibilidad
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Canvas;
}

console.log('📁 Canvas.js loaded (no auto-init)');