const config = require('../../config');
const adjustForBoundaries = (position, radius, borderOffset, gameWidth, gameHeight) => {
    const borderCalc = radius + borderOffset;
    
    // Usar dimensiones actuales del config (que pueden haber sido actualizadas)
    const actualWidth = gameWidth || config.gameWidth;
    const actualHeight = gameHeight || config.gameHeight;
    
    if (position.x > actualWidth - borderCalc) {
        position.x = actualWidth - borderCalc;
    }
    if (position.y > actualHeight - borderCalc) {
        position.y = actualHeight - borderCalc;
    }
    if (position.x < borderCalc) {
        position.x = borderCalc;
    }
    if (position.y < borderCalc) {
        position.y = borderCalc;
    }
};

module.exports = {
    adjustForBoundaries
};