// public/game/js/chat-client.js - Chat corregido sin auto-inicialización

class ChatClient {
    constructor(params) {
        // Inicialización segura sin depender de global
        this.canvas = null;
        this.socket = null;
        this.mobile = false;
        this.player = null;
        this.commands = {};
        
        var self = this;
        var input = document.getElementById('chatInput');
        
        if (input) {
            input.addEventListener('keypress', function(e) { self.sendChat(e); });
            input.addEventListener('keyup', function(key) {
                input = document.getElementById('chatInput');
                key = key.which || key.keyCode;
                if (key === 27) { // ESC key
                    input.value = '';
                    if (self.canvas && self.canvas.cv) {
                        self.canvas.cv.focus();
                    }
                }
            });
        }
        
        // Actualizar global cuando esté disponible
        if (typeof global !== 'undefined') {
            this.updateFromGlobal();
            global.chatClient = this;
        }
        
        console.log('💬 Chat client initialized safely');
    }

    // Actualizar referencias desde global
    updateFromGlobal() {
        if (typeof global !== 'undefined') {
            this.canvas = global.canvas || null;
            this.socket = global.socket || null;
            this.mobile = global.mobile || false;
            this.player = global.player || null;
        }
    }

    // === FUNCIONES DE CHAT ===
    
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');
        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? 'An unnamed cell' : name) + '</b>: ' + message;
        this.appendMessage(newline);
    }

    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');
        newline.className = 'system';
        newline.innerHTML = message;
        this.appendMessage(newline);
    }

    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        if (chatList) {
            if (chatList.childNodes.length > 10) {
                chatList.removeChild(chatList.childNodes[0]);
            }
            chatList.appendChild(node);
        }
    }

    sendChat(key) {
        var commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.which || key.keyCode;

        if (key === 13) { // ENTER
            var text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {
                if (text.indexOf('-') === 0) {
                    // Comando de chat
                    var args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('Unrecognized Command: ' + text + ', type -help for more info.');
                    }
                } else {
                    // Mensaje normal
                    if (this.socket && this.player) {
                        this.socket.emit('playerChat', { sender: this.player.name, message: text });
                        this.addChatLine(this.player.name, text, true);
                    }
                }
                input.value = '';
                if (this.canvas && this.canvas.cv) {
                    this.canvas.cv.focus();
                }
            }
        }
    }

    registerFunctions() {
        var self = this;
        
        // Comandos básicos
        this.registerCommand('ping', 'Check your latency.', function () {
            self.checkLatency();
        });

        this.registerCommand('dark', 'Toggle dark mode.', function () {
            self.toggleDarkMode();
        });

        this.registerCommand('border', 'Toggle visibility of border.', function () {
            self.toggleBorder();
        });

        this.registerCommand('mass', 'Toggle visibility of mass.', function () {
            self.toggleMass();
        });

        this.registerCommand('help', 'Information about the chat commands.', function () {
            self.printHelp();
        });

        // Comandos de apuestas
        this.registerCommand('value', 'Show current game value.', function () {
            const gameValue = global && global.gameValue ? global.gameValue : 0;
            const currentBet = global && global.currentBet ? global.currentBet : 0;
            
            if (gameValue > 0) {
                const roi = currentBet > 0 ? ((gameValue / currentBet - 1) * 100).toFixed(1) : '0';
                self.addSystemLine('Current value: $' + gameValue.toFixed(2) + ' | ROI: ' + roi + '%');
            } else {
                self.addSystemLine('No active game or spectating.');
            }
        });

        this.registerCommand('cashout', 'Quick cash out command.', function () {
            const gameValue = global && global.gameValue ? global.gameValue : 0;
            if (gameValue > 0 && window.bettingClient) {
                window.bettingClient.showCashOutModal();
                self.addSystemLine('Cash out modal opened.');
            } else {
                self.addSystemLine('No active game to cash out.');
            }
        });

        this.registerCommand('stats', 'Show betting statistics.', function () {
            const gameValue = global && global.gameValue ? global.gameValue : 0;
            const currentBet = global && global.currentBet ? global.currentBet : 0;
            
            if (currentBet > 0) {
                const roi = ((gameValue / currentBet - 1) * 100).toFixed(1);
                const profit = (gameValue - currentBet).toFixed(2);
                self.addSystemLine('Bet: $' + currentBet + ' | Current: $' + gameValue.toFixed(2) + ' | Profit: $' + profit + ' | ROI: ' + roi + '%');
            } else {
                self.addSystemLine('No active betting game.');
            }
        });

        console.log('📝 Chat commands registered');
    }

    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    printHelp() {
        var commands = this.commands;
        for (var cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                this.addSystemLine('-' + cmd + ': ' + commands[cmd].description);
            }
        }
    }

    // === FUNCIONES DE CONFIGURACIÓN ===
    
    checkLatency() {
        if (global) {
            global.startPingTime = Date.now();
        }
        if (this.socket) {
            this.socket.emit('pingcheck');
        }
    }

    toggleDarkMode() {
        if (!global) return;
        
        var LIGHT = '#f2fbff',
            DARK = '#181818';
        var LINELIGHT = '#000000',
            LINEDARK = '#ffffff';

        if (global.backgroundColor === LIGHT) {
            global.backgroundColor = DARK;
            global.lineColor = LINEDARK;
            this.addSystemLine('Dark mode enabled.');
        } else {
            global.backgroundColor = LIGHT;
            global.lineColor = LINELIGHT;
            this.addSystemLine('Dark mode disabled.');
        }
    }

    toggleBorder() {
        if (!global) return;
        
        if (!global.borderDraw) {
            global.borderDraw = true;
            this.addSystemLine('Showing border.');
        } else {
            global.borderDraw = false;
            this.addSystemLine('Hiding border.');
        }
    }

    toggleMass() {
        if (!global) return;
        
        if (global.toggleMassState === 0) {
            global.toggleMassState = 1;
            this.addSystemLine('Viewing mass enabled.');
        } else {
            global.toggleMassState = 0;
            this.addSystemLine('Viewing mass disabled.');
        }
    }

    // === ACTUALIZACIÓN DE REFERENCIAS ===
    
    update() {
        this.updateFromGlobal();
    }
}

// === NO AUTO-INICIALIZACIÓN ===
// Se inicializará desde app-betting.js

// Export para compatibilidad
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatClient;
}

console.log('📁 ChatClient.js loaded (no auto-init)');