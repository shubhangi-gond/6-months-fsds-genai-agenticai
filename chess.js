// Chess Game JavaScript Implementation
class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameState = 'playing'; // playing, check, checkmate, stalemate, draw
        this.lastMove = null;
        this.capturedPieces = { white: [], black: [] };
        this.kingPositions = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        this.gameTimer = { white: 600, black: 600 }; // 10 minutes each
        this.timerInterval = null;
        this.settings = {
            highlightMoves: true,
            soundEffects: true,
            showCoordinates: true
        };
        
        this.pieceUnicodes = {
            white: {
                king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙'
            },
            black: {
                king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟'
            }
        };
        
        this.init();
    }
    
    init() {
        this.createBoard();
        this.renderBoard();
        this.bindEvents();
        this.updateGameStatus();
        this.startTimer();
    }
    
    initializeBoard() {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        
        // Set up black pieces
        board[0] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({ type: piece, color: 'black' }));
        board[1] = Array(8).fill().map(() => ({ type: 'pawn', color: 'black' }));
        
        // Set up white pieces
        board[6] = Array(8).fill().map(() => ({ type: 'pawn', color: 'white' }));
        board[7] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({ type: piece, color: 'white' }));
        
        return board;
    }
    
    createBoard() {
        const chessBoard = document.getElementById('chessBoard');
        chessBoard.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                square.addEventListener('click', (e) => this.handleSquareClick(e));
                chessBoard.appendChild(square);
            }
        }
    }
    
    renderBoard() {
        const squares = document.querySelectorAll('.chess-square');
        
        squares.forEach(square => {
            const row = parseInt(square.dataset.row);
            const col = parseInt(square.dataset.col);
            const piece = this.board[row][col];
            
            // Clear square
            square.innerHTML = '';
            square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
            
            // Add piece if exists
            if (piece) {
                const pieceElement = document.createElement('span');
                pieceElement.className = 'chess-piece';
                pieceElement.textContent = this.pieceUnicodes[piece.color][piece.type];
                square.appendChild(pieceElement);
            }
            
            // Highlight last move
            if (this.lastMove && 
                ((this.lastMove.from.row === row && this.lastMove.from.col === col) ||
                 (this.lastMove.to.row === row && this.lastMove.to.col === col))) {
                square.classList.add('last-move');
            }
            
            // Highlight if king is in check
            if (piece && piece.type === 'king' && this.isInCheck(piece.color)) {
                square.classList.add('in-check');
            }
        });
        
        this.updateCapturedPieces();
    }
    
    handleSquareClick(event) {
        if (this.gameState !== 'playing' && this.gameState !== 'check') return;
        
        const square = event.currentTarget;
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = this.board[row][col];
        
        if (this.selectedSquare) {
            // Try to make a move
            if (this.isValidMove(this.selectedSquare, { row, col })) {
                this.makeMove(this.selectedSquare, { row, col });
                this.clearSelection();
                this.switchPlayer();
                this.updateGameStatus();
            } else if (piece && piece.color === this.currentPlayer) {
                // Select different piece of same color
                this.selectSquare({ row, col });
            } else {
                this.clearSelection();
            }
        } else if (piece && piece.color === this.currentPlayer) {
            // Select piece
            this.selectSquare({ row, col });
        }
    }
    
    selectSquare(position) {
        this.clearSelection();
        this.selectedSquare = position;
        
        const square = document.querySelector(`[data-row="${position.row}"][data-col="${position.col}"]`);
        square.classList.add('selected');
        
        if (this.settings.highlightMoves) {
            this.highlightValidMoves(position);
        }
    }
    
    clearSelection() {
        document.querySelectorAll('.chess-square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'valid-capture');
        });
        this.selectedSquare = null;
    }
    
    highlightValidMoves(from) {
        const validMoves = this.getValidMoves(from);
        
        validMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            if (this.board[move.row][move.col]) {
                square.classList.add('valid-capture');
            } else {
                square.classList.add('valid-move');
            }
        });
    }
    
    isValidMove(from, to) {
        const validMoves = this.getValidMoves(from);
        return validMoves.some(move => move.row === to.row && move.col === to.col);
    }
    
    getValidMoves(from) {
        const piece = this.board[from.row][from.col];
        if (!piece || piece.color !== this.currentPlayer) return [];
        
        let moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves = this.getPawnMoves(from, piece.color);
                break;
            case 'rook':
                moves = this.getRookMoves(from);
                break;
            case 'knight':
                moves = this.getKnightMoves(from);
                break;
            case 'bishop':
                moves = this.getBishopMoves(from);
                break;
            case 'queen':
                moves = this.getQueenMoves(from);
                break;
            case 'king':
                moves = this.getKingMoves(from);
                break;
        }
        
        // Filter out moves that would put own king in check
        return moves.filter(move => !this.wouldBeInCheck(from, move, piece.color));
    }
    
    getPawnMoves(from, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Forward move
        const newRow = from.row + direction;
        if (this.isValidPosition(newRow, from.col) && !this.board[newRow][from.col]) {
            moves.push({ row: newRow, col: from.col });
            
            // Double move from starting position
            if (from.row === startRow && !this.board[newRow + direction][from.col]) {
                moves.push({ row: newRow + direction, col: from.col });
            }
        }
        
        // Capture moves
        [-1, 1].forEach(colOffset => {
            const newCol = from.col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getRookMoves(from) {
        const moves = [];
        const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        
        directions.forEach(([rowDir, colDir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = from.row + rowDir * i;
                const newCol = from.col + colDir * i;
                
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== this.board[from.row][from.col].color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        });
        
        return moves;
    }
    
    getKnightMoves(from) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        knightMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = from.row + rowOffset;
            const newCol = from.col + colOffset;
            
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.board[from.row][from.col].color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getBishopMoves(from) {
        const moves = [];
        const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        
        directions.forEach(([rowDir, colDir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = from.row + rowDir * i;
                const newCol = from.col + colDir * i;
                
                if (!this.isValidPosition(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== this.board[from.row][from.col].color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        });
        
        return moves;
    }
    
    getQueenMoves(from) {
        return [...this.getRookMoves(from), ...this.getBishopMoves(from)];
    }
    
    getKingMoves(from) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        directions.forEach(([rowOffset, colOffset]) => {
            const newRow = from.row + rowOffset;
            const newCol = from.col + colOffset;
            
            if (this.isValidPosition(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== this.board[from.row][from.col].color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    isValidPosition(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    makeMove(from, to) {
        const piece = this.board[from.row][from.col];
        const capturedPiece = this.board[to.row][to.col];
        
        // Store move in history
        const move = {
            from,
            to,
            piece,
            captured: capturedPiece,
            notation: this.getMoveNotation(from, to, piece, capturedPiece)
        };
        
        this.moveHistory.push(move);
        this.lastMove = { from, to };
        
        // Handle captured piece
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            if (this.settings.soundEffects) {
                this.playSound('capture');
            }
        } else if (this.settings.soundEffects) {
            this.playSound('move');
        }
        
        // Move piece
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        
        // Update king position
        if (piece.type === 'king') {
            this.kingPositions[piece.color] = { row: to.row, col: to.col };
        }
        
        // Handle pawn promotion
        if (piece.type === 'pawn' && (to.row === 0 || to.row === 7)) {
            this.board[to.row][to.col] = { type: 'queen', color: piece.color };
        }
        
        this.renderBoard();
        this.updateMoveHistory();
    }
    
    wouldBeInCheck(from, to, color) {
        // Create a copy of the board to test the move
        const originalPiece = this.board[to.row][to.col];
        const movingPiece = this.board[from.row][from.col];
        
        // Make temporary move
        this.board[to.row][to.col] = movingPiece;
        this.board[from.row][from.col] = null;
        
        // Update king position if moving king
        let originalKingPos = null;
        if (movingPiece.type === 'king') {
            originalKingPos = { ...this.kingPositions[color] };
            this.kingPositions[color] = { row: to.row, col: to.col };
        }
        
        const inCheck = this.isInCheck(color);
        
        // Restore board
        this.board[from.row][from.col] = movingPiece;
        this.board[to.row][to.col] = originalPiece;
        
        // Restore king position
        if (originalKingPos) {
            this.kingPositions[color] = originalKingPos;
        }
        
        return inCheck;
    }
    
    isInCheck(color) {
        const kingPos = this.kingPositions[color];
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Check if any opponent piece can attack the king
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === opponentColor) {
                    const attacks = this.getPieceAttacks({ row, col }, piece);
                    if (attacks.some(attack => attack.row === kingPos.row && attack.col === kingPos.col)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    getPieceAttacks(from, piece) {
        // Similar to getValidMoves but doesn't filter for check
        switch (piece.type) {
            case 'pawn':
                return this.getPawnAttacks(from, piece.color);
            case 'rook':
                return this.getRookMoves(from);
            case 'knight':
                return this.getKnightMoves(from);
            case 'bishop':
                return this.getBishopMoves(from);
            case 'queen':
                return this.getQueenMoves(from);
            case 'king':
                return this.getKingMoves(from);
            default:
                return [];
        }
    }
    
    getPawnAttacks(from, color) {
        const attacks = [];
        const direction = color === 'white' ? -1 : 1;
        const newRow = from.row + direction;
        
        [-1, 1].forEach(colOffset => {
            const newCol = from.col + colOffset;
            if (this.isValidPosition(newRow, newCol)) {
                attacks.push({ row: newRow, col: newCol });
            }
        });
        
        return attacks;
    }
    
    hasValidMoves(color) {
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.board[row][col];
                if (piece && piece.color === color) {
                    const validMoves = this.getValidMoves({ row, col });
                    if (validMoves.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        this.updatePlayerHighlight();
    }
    
    updateGameStatus() {
        const inCheck = this.isInCheck(this.currentPlayer);
        const hasValidMoves = this.hasValidMoves(this.currentPlayer);
        
        if (!hasValidMoves) {
            if (inCheck) {
                this.gameState = 'checkmate';
                const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                this.endGame(`Checkmate! ${winner} wins!`);
            } else {
                this.gameState = 'stalemate';
                this.endGame('Stalemate! Game is a draw.');
            }
        } else if (inCheck) {
            this.gameState = 'check';
            this.updateStatusText(`${this.currentPlayer} is in check!`);
        } else {
            this.gameState = 'playing';
            this.updateStatusText(`${this.currentPlayer} to move`);
        }
        
        this.renderBoard();
    }
    
    updateStatusText(text) {
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = text;
        }
    }
    
    updatePlayerHighlight() {
        document.querySelectorAll('.player-info').forEach(player => {
            player.classList.remove('active');
        });
        
        const currentPlayerElement = document.querySelector(`.player-${this.currentPlayer}`);
        if (currentPlayerElement) {
            currentPlayerElement.classList.add('active');
        }
    }
    
    updateMoveHistory() {
        const movesList = document.getElementById('movesList');
        const movesHeader = movesList.querySelector('.moves-header');
        
        // Clear existing moves except header
        Array.from(movesList.children).forEach(child => {
            if (!child.classList.contains('moves-header')) {
                child.remove();
            }
        });
        
        // Add moves in pairs (white, black)
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const moveRow = document.createElement('div');
            moveRow.className = 'move-row';
            
            const moveNumber = Math.floor(i / 2) + 1;
            const whiteMove = this.moveHistory[i];
            const blackMove = this.moveHistory[i + 1];
            
            moveRow.innerHTML = `
                <span>${moveNumber}</span>
                <span>${whiteMove ? whiteMove.notation : ''}</span>
                <span>${blackMove ? blackMove.notation : ''}</span>
            `;
            
            movesList.appendChild(moveRow);
        }
        
        // Update move counter
        const moveNumberElement = document.getElementById('moveNumber');
        if (moveNumberElement) {
            moveNumberElement.textContent = Math.floor(this.moveHistory.length / 2) + 1;
        }
    }
    
    updateCapturedPieces() {
        ['white', 'black'].forEach(color => {
            const container = document.getElementById(`${color}Captured`);
            if (container) {
                container.innerHTML = '';
                this.capturedPieces[color].forEach(piece => {
                    const pieceElement = document.createElement('span');
                    pieceElement.className = 'captured-piece';
                    pieceElement.textContent = this.pieceUnicodes[piece.color][piece.type];
                    container.appendChild(pieceElement);
                });
            }
        });
    }
    
    getMoveNotation(from, to, piece, captured) {
        const files = 'abcdefgh';
        const fromNotation = files[from.col] + (8 - from.row);
        const toNotation = files[to.col] + (8 - to.row);
        
        let notation = '';
        
        if (piece.type === 'pawn') {
            if (captured) {
                notation = files[from.col] + 'x' + toNotation;
            } else {
                notation = toNotation;
            }
        } else {
            const pieceSymbol = piece.type === 'knight' ? 'N' : piece.type[0].toUpperCase();
            notation = pieceSymbol + (captured ? 'x' : '') + toNotation;
        }
        
        return notation;
    }
    
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.gameState === 'playing' || this.gameState === 'check') {
                this.gameTimer[this.currentPlayer]--;
                this.updateTimerDisplay();
                
                if (this.gameTimer[this.currentPlayer] <= 0) {
                    const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
                    this.endGame(`Time's up! ${winner} wins!`);
                }
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        ['white', 'black'].forEach(color => {
            const timerElement = document.getElementById(`${color}Timer`);
            if (timerElement) {
                const minutes = Math.floor(this.gameTimer[color] / 60);
                const seconds = this.gameTimer[color] % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.gameTimer[color] <= 60) {
                    timerElement.classList.add('warning');
                } else {
                    timerElement.classList.remove('warning');
                }
            }
        });
    }
    
    endGame(message) {
        this.gameState = 'ended';
        clearInterval(this.timerInterval);
        this.showModal('Game Over', message);
        if (this.settings.soundEffects) {
            this.playSound('gameEnd');
        }
    }
    
    showModal(title, message) {
        const modal = document.getElementById('gameModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('show');
    }
    
    hideModal() {
        const modal = document.getElementById('gameModal');
        modal.classList.remove('show');
    }
    
    newGame() {
        clearInterval(this.timerInterval);
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.moveHistory = [];
        this.gameState = 'playing';
        this.lastMove = null;
        this.capturedPieces = { white: [], black: [] };
        this.kingPositions = { white: { row: 7, col: 4 }, black: { row: 0, col: 4 } };
        this.gameTimer = { white: 600, black: 600 };
        
        this.renderBoard();
        this.updateGameStatus();
        this.updateMoveHistory();
        this.updatePlayerHighlight();
        this.startTimer();
        this.hideModal();
    }
    
    undoMove() {
        if (this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        
        // Restore piece positions
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.captured;
        
        // Restore king position if it was moved
        if (lastMove.piece.type === 'king') {
            this.kingPositions[lastMove.piece.color] = lastMove.from;
        }
        
        // Restore captured piece
        if (lastMove.captured) {
            const capturedArray = this.capturedPieces[lastMove.captured.color];
            const index = capturedArray.findIndex(piece => 
                piece.type === lastMove.captured.type && piece.color === lastMove.captured.color
            );
            if (index !== -1) {
                capturedArray.splice(index, 1);
            }
        }
        
        // Switch player back
        this.switchPlayer();
        
        // Update last move
        this.lastMove = this.moveHistory.length > 0 ? 
            { from: this.moveHistory[this.moveHistory.length - 1].from, 
              to: this.moveHistory[this.moveHistory.length - 1].to } : null;
        
        this.renderBoard();
        this.updateGameStatus();
        this.updateMoveHistory();
        this.clearSelection();
    }
    
    playSound(type) {
        // Simple sound effects using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        switch (type) {
            case 'move':
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                break;
            case 'capture':
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                break;
            case 'gameEnd':
                oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                break;
        }
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    bindEvents() {
        // New Game button
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        
        // Undo button
        document.getElementById('undoBtn').addEventListener('click', () => this.undoMove());
        
        // Modal controls
        document.getElementById('modalClose').addEventListener('click', () => this.hideModal());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('newGameFromModal').addEventListener('click', () => this.newGame());
        
        // Settings toggles
        document.getElementById('highlightMoves').addEventListener('change', (e) => {
            this.settings.highlightMoves = e.target.checked;
        });
        
        document.getElementById('soundEffects').addEventListener('change', (e) => {
            this.settings.soundEffects = e.target.checked;
        });
        
        document.getElementById('showCoordinates').addEventListener('change', (e) => {
            this.settings.showCoordinates = e.target.checked;
            const coordinates = document.querySelector('.board-coordinates');
            coordinates.style.display = e.target.checked ? 'block' : 'none';
        });
        
        // Close modal when clicking outside
        document.getElementById('gameModal').addEventListener('click', (e) => {
            if (e.target.id === 'gameModal') {
                this.hideModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearSelection();
            } else if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                this.undoMove();
            } else if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.newGame();
            }
        });
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.chessGame = new ChessGame();
});