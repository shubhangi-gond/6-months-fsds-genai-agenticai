# ♟️ Chess Game with Streamlit

A fully functional chess game with an interactive web interface built using Python and Streamlit.

## 🎯 Features

### Core Chess Functionality
- **Complete Chess Rules**: All standard chess moves including castling, en passant, and pawn promotion
- **Legal Move Validation**: Only valid moves are allowed, with check and checkmate detection
- **Game State Management**: Track current player, move history, and captured pieces
- **Special Moves**: 
  - Castling (kingside and queenside)
  - En passant captures
  - Automatic pawn promotion to queen

### Interactive UI
- **Visual Chess Board**: Beautiful 8x8 board with alternating light and dark squares
- **Piece Selection**: Click to select pieces and see valid moves highlighted
- **Real-time Updates**: Game state updates instantly after each move
- **Game Status**: Shows current player, check warnings, and game outcomes
- **Move History**: Track all moves made during the game
- **Captured Pieces**: Display pieces captured by each player

### User Experience
- **Responsive Design**: Clean, modern interface that works on different screen sizes
- **Intuitive Controls**: Simple click-to-select and click-to-move interaction
- **Visual Feedback**: 
  - Selected pieces highlighted in yellow
  - Valid moves highlighted in green
  - Current player and game status clearly displayed
- **Game Rules Reference**: Built-in help section with chess rules

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip package manager

### Installation

1. **Clone or download the project files**
   ```bash
   # If you have git
   git clone <repository-url>
   cd chess-game
   
   # Or simply download the files to a folder
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the game**
   ```bash
   streamlit run chess_game.py
   ```

4. **Open your browser**
   - The game will automatically open in your default web browser
   - If not, go to `http://localhost:8501`

## 🎮 How to Play

### Basic Gameplay
1. **Select a Piece**: Click on any of your pieces (white starts first)
2. **View Valid Moves**: Valid destinations will be highlighted in green
3. **Make a Move**: Click on a highlighted square to move your piece
4. **Switch Turns**: The game automatically switches between white and black players

### Special Rules
- **Check**: When your king is under attack, you must move to safety
- **Checkmate**: Game ends when a king is in check with no legal moves
- **Stalemate**: Game ends in a draw when no legal moves exist but king isn't in check
- **Castling**: Move your king 2 squares toward a rook (if conditions are met)
- **En Passant**: Capture a pawn that just moved 2 squares forward

### Game Controls
- **🔄 New Game**: Start a fresh game
- **↩️ Undo Move**: Undo the last move (coming soon)
- **💾 Save Game**: Save current game state (coming soon)

## 🏗️ Technical Details

### Architecture
- **ChessBoard Class**: Manages game state, piece movements, and rule validation
- **Piece Class**: Represents individual chess pieces with type and color
- **ChessGameUI Class**: Handles the Streamlit interface and user interactions

### Key Features
- **Legal Move Generation**: Calculates all valid moves for each piece type
- **Check Detection**: Determines if a king is under attack
- **Move Validation**: Ensures moves don't put own king in check
- **Game End Detection**: Automatically detects checkmate and stalemate

### File Structure
```
chess-game/
├── chess_game.py      # Main game logic and UI
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## 🎨 Customization

The game includes CSS styling that can be modified in the `display_board()` method:
- Board colors and styling
- Piece highlighting colors
- Square sizes and spacing
- Game status display formatting

## 🔮 Future Enhancements

- **Undo/Redo Functionality**: Allow players to undo moves
- **Game Saving/Loading**: Save games to file and resume later
- **AI Opponent**: Play against computer opponents of varying difficulty
- **Online Multiplayer**: Play against other players online
- **Chess Notation**: Display moves in standard algebraic notation
- **Game Analysis**: Show game statistics and analysis
- **Different Themes**: Multiple board and piece themes
- **Time Controls**: Add chess clocks for timed games

## 🐛 Known Issues

- Pawn promotion currently defaults to queen (manual promotion coming soon)
- Some edge cases in move validation may need refinement
- Board layout may need adjustments on very small screens

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

This project is open source and available under the MIT License.

## 🎯 About

This chess game was built as a demonstration of:
- Python object-oriented programming
- Streamlit web app development
- Game logic implementation
- Interactive UI design

Perfect for learning chess, Python programming, or just enjoying a game!

---

**Enjoy your chess game! ♟️**