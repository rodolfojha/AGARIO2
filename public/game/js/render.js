// public/game/js/render.js - Renderizado adaptado para apuestas

// === FUNCIONES HELPER ===

// Función helper para obtener valores de apuesta de múltiples fuentes
const getBettingValues = () => {
    let currentValue = 0;
    let currentBet = 0;
    
    try {
        // Intentar obtener de bettingClient primero (más confiable)
        if (typeof window !== 'undefined' && window.bettingClient) {
            currentValue = window.bettingClient.currentValue || 0;
            if (window.bettingClient.currentGame) {
                currentBet = window.bettingClient.currentGame.bet_amount || 0;
            }
        }
        
        // Fallback a variables globales
        if (currentValue === 0) {
            currentValue = global.gameValue || 0;
        }
        if (currentBet === 0) {
            currentBet = global.currentBet || 0;
        }
        
        // Si no hay valor inicial, usar la apuesta como valor inicial
        if (currentValue === 0 && currentBet > 0) {
            currentValue = currentBet;
        }
        
        // Log para debug
        if (currentValue > 0 || currentBet > 0) {
            console.log('💰 getBettingValues:', { currentValue, currentBet, source: 'render.js' });
        }
        
    } catch (error) {
        console.error('❌ Error en getBettingValues:', error);
        // Valores por defecto en caso de error
        currentValue = global.gameValue || 0;
        currentBet = global.currentBet || 0;
    }
    
    return { currentValue, currentBet };
};

// === FUNCIONES DE RENDERIZADO ===

const FULL_ANGLE = 2 * Math.PI;

const drawRoundObject = (position, radius, graph) => {
    graph.beginPath();
    graph.arc(position.x, position.y, radius, 0, FULL_ANGLE);
    graph.closePath();
    graph.fill();
    graph.stroke();
}

const drawFood = (position, food, graph) => {
    graph.fillStyle = 'hsl(' + food.hue + ', 100%, 50%)';
    graph.strokeStyle = 'hsl(' + food.hue + ', 100%, 45%)';
    graph.lineWidth = 0;
    drawRoundObject(position, food.radius, graph);
};

const drawVirus = (position, virus, graph) => {
    graph.strokeStyle = virus.stroke;
    graph.fillStyle = virus.fill;
    graph.lineWidth = virus.strokeWidth;
    let sides = 20;

    graph.beginPath();
    for (let theta = 0; theta < FULL_ANGLE; theta += FULL_ANGLE / sides) {
        let point = circlePoint(position, virus.radius, theta);
        graph.lineTo(point.x, point.y);
    }
    graph.closePath();
    graph.stroke();
    graph.fill();
};

const drawFireFood = (position, mass, playerConfig, graph) => {
    graph.strokeStyle = 'hsl(' + mass.hue + ', 100%, 45%)';
    graph.fillStyle = 'hsl(' + mass.hue + ', 100%, 50%)';
    graph.lineWidth = playerConfig.border + 2;
    drawRoundObject(position, mass.radius - 1, graph);
};

const valueInRange = (min, max, value) => Math.min(max, Math.max(min, value))

const circlePoint = (origo, radius, theta) => ({
    x: origo.x + radius * Math.cos(theta),
    y: origo.y + radius * Math.sin(theta)
});

const cellTouchingBorders = (cell, borders) =>
    cell.x - cell.radius <= borders.left ||
    cell.x + cell.radius >= borders.right ||
    cell.y - cell.radius <= borders.top ||
    cell.y + cell.radius >= borders.bottom

const regulatePoint = (point, borders) => ({
    x: valueInRange(borders.left, borders.right, point.x),
    y: valueInRange(borders.top, borders.bottom, point.y)
});

const drawCellWithLines = (cell, borders, graph) => {
    let pointCount = 30 + ~~(cell.mass / 5);
    let points = [];
    for (let theta = 0; theta < FULL_ANGLE; theta += FULL_ANGLE / pointCount) {
        let point = circlePoint(cell, cell.radius, theta);
        points.push(regulatePoint(point, borders));
    }
    graph.beginPath();
    graph.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        graph.lineTo(points[i].x, points[i].y);
    }
    graph.closePath();
    graph.fill();
    graph.stroke();
}

// MODIFICADO: Dibujar células con indicadores de valor
const drawCells = (cells, playerConfig, toggleMassState, borders, graph) => {
    for (let cell of cells) {
        // Determinar si es el jugador actual
        const isCurrentPlayer = cell.id === player.id;
        
        // Color base de la célula
        graph.fillStyle = cell.color;
        graph.strokeStyle = cell.borderColor;
        
        // NUEVO: Borde especial para jugadores con apuestas altas
        if (isCurrentPlayer) {
            const { currentValue, currentBet } = getBettingValues();
            
            // Aplicar borde según el rendimiento
            if (currentValue > currentBet * 1.5) {
                // Borde dorado para jugadores ganando
                graph.strokeStyle = '#FFD700';
                graph.lineWidth = 8;
            } else if (currentValue < currentBet * 0.5) {
                // Borde rojo para jugadores perdiendo
                graph.strokeStyle = '#FF4444';
                graph.lineWidth = 8;
            } else {
                graph.lineWidth = 6;
            }
        } else {
            graph.lineWidth = 6;
        }

        // Dibujar la célula
        if (cellTouchingBorders(cell, borders)) {
            drawCellWithLines(cell, borders, graph);
        } else {
            drawRoundObject(cell, cell.radius, graph);
        }

        // Dibujar nombre del jugador
        let fontSize = Math.max(cell.radius / 3, 12);
        graph.lineWidth = playerConfig.textBorderSize;
        graph.fillStyle = playerConfig.textColor;
        graph.strokeStyle = playerConfig.textBorder;
        graph.miterLimit = 1;
        graph.lineJoin = 'round';
        graph.textAlign = 'center';
        graph.textBaseline = 'middle';
        graph.font = 'bold ' + fontSize + 'px sans-serif';
        graph.strokeText(cell.name, cell.x, cell.y);
        graph.fillText(cell.name, cell.x, cell.y);

        // NUEVO: Dibujar valor de apuesta en el círculo del jugador actual
        if (isCurrentPlayer && cell.radius > 15) {
            try {
                const { currentValue, currentBet } = getBettingValues();
                
                // Mostrar valor actual del círculo
                if (currentValue > 0) {
                    // Calcular valor del círculo basado en su masa relativa
                    const playerCells = cells.filter(c => c.id === cell.id);
                    const totalPlayerMass = playerCells.reduce((sum, c) => sum + (c.mass || 0), 0);
                    const cellValueRatio = totalPlayerMass > 0 ? (cell.mass || 0) / totalPlayerMass : 0;
                    const cellValue = currentValue * cellValueRatio;
                    
                    if (isFinite(cellValue) && cellValue > 0) {
                        // Valor actual del círculo (debajo del nombre)
                        const valueText = `$${cellValue.toFixed(2)}`;
                        const valueFontSize = Math.max(fontSize * 0.6, 8);
                        graph.font = 'bold ' + valueFontSize + 'px sans-serif';
                        graph.fillStyle = '#FFD700'; // Dorado
                        graph.strokeStyle = '#000000';
                        graph.lineWidth = 2;
                        
                        const valueY = cell.y + fontSize * 0.8;
                        graph.strokeText(valueText, cell.x, valueY);
                        graph.fillText(valueText, cell.x, valueY);
                        
                        // Mostrar ROI si hay apuesta inicial
                        if (currentBet > 0 && currentValue !== currentBet) {
                            const roi = ((currentValue / currentBet - 1) * 100);
                            const roiText = (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%';
                            const roiFontSize = Math.max(fontSize * 0.5, 6);
                            graph.font = 'bold ' + roiFontSize + 'px sans-serif';
                            graph.fillStyle = roi >= 0 ? '#2ecc71' : '#e74c3c'; // Verde si gana, rojo si pierde
                            graph.strokeStyle = '#000000';
                            graph.lineWidth = 1;
                            
                            const roiY = valueY + valueFontSize * 0.8;
                            graph.strokeText(roiText, cell.x, roiY);
                            graph.fillText(roiText, cell.x, roiY);
                        }
                    }
                }
            } catch (error) {
                console.error('Error drawing cell value:', error);
            }
        }

        // Dibujar masa (si está habilitado)
        if (toggleMassState === 1) {
            graph.font = 'bold ' + Math.max(fontSize / 3 * 2, 10) + 'px sans-serif';
            if (cell.name.length === 0) fontSize = 0;
            graph.strokeText(Math.round(cell.mass), cell.x, cell.y + fontSize);
            graph.fillText(Math.round(cell.mass), cell.x, cell.y + fontSize);
        }
    }
};

const drawGrid = (global, player, screen, graph) => {
    graph.lineWidth = 1;
    graph.strokeStyle = global.lineColor;
    graph.globalAlpha = 0.15;
    graph.beginPath();

    for (let x = -player.x; x < screen.width; x += screen.height / 18) {
        graph.moveTo(x, 0);
        graph.lineTo(x, screen.height);
    }

    for (let y = -player.y; y < screen.height; y += screen.height / 18) {
        graph.moveTo(0, y);
        graph.lineTo(screen.width, y);
    }

    graph.stroke();
    graph.globalAlpha = 1;
};

const drawBorder = (borders, graph) => {
    graph.lineWidth = 1;
    graph.strokeStyle = '#000000'
    graph.beginPath()
    graph.moveTo(borders.left, borders.top);
    graph.lineTo(borders.right, borders.top);
    graph.lineTo(borders.right, borders.bottom);
    graph.lineTo(borders.left, borders.bottom);
    graph.closePath()
    graph.stroke();
};

// MODIFICADO: Mensajes de error con información de apuestas
const drawErrorMessage = (message, graph, screen) => {
    graph.fillStyle = '#333333';
    graph.fillRect(0, 0, screen.width, screen.height);
    graph.textAlign = 'center';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 30px sans-serif';
    graph.fillText(message, screen.width / 2, screen.height / 2);
    
    // NUEVO: Mostrar información de pérdida/ganancia
    const { currentBet } = getBettingValues();
    if (currentBet > 0) {
        graph.font = 'bold 20px sans-serif';
        const lossText = 'Apuesta perdida: $' + currentBet.toFixed(2);
        graph.fillStyle = '#e74c3c';
        graph.fillText(lossText, screen.width / 2, screen.height / 2 + 50);
    }
}

// NUEVO: Función para dibujar HUD de apuestas
const drawBettingHUD = (graph, screen) => {
    const { currentValue, currentBet } = getBettingValues();
    
    // Verificar si debemos mostrar el HUD
    if (global.playerType !== 'player' || currentValue === 0) return;
    
    // Background del HUD
    graph.fillStyle = 'rgba(0, 0, 0, 0.8)';
    graph.fillRect(screen.width - 200, 10, 190, 80);
    
    // Texto del valor actual
    graph.textAlign = 'left';
    graph.fillStyle = '#FFFFFF';
    graph.font = 'bold 14px sans-serif';
    graph.fillText('Valor Actual:', screen.width - 190, 30);
    
    // Valor en grande
    graph.font = 'bold 18px sans-serif';
    graph.fillStyle = '#FFD700';
    graph.fillText('$' + currentValue.toFixed(2), screen.width - 190, 50);
    
    // ROI
    if (currentBet > 0) {
        const roi = ((currentValue / currentBet - 1) * 100);
        graph.font = 'bold 12px sans-serif';
        graph.fillStyle = roi >= 0 ? '#2ecc71' : '#e74c3c';
        const roiText = 'ROI: ' + (roi >= 0 ? '+' : '') + (roi || 0).toFixed(1) + '%';
        graph.fillText(roiText, screen.width - 190, 70);
    }
};

// NUEVO: Función helper para obtener posición relativa
const getPosition = (entity, player, screen) => {
    return {
        x: entity.x - player.x + screen.width / 2,
        y: entity.y - player.y + screen.height / 2
    }
}

// Export para usar en app-betting.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        drawFood,
        drawVirus,
        drawFireFood,
        drawCells,
        drawErrorMessage,
        drawGrid,
        drawBorder,
        drawBettingHUD,
        getPosition
    };
}