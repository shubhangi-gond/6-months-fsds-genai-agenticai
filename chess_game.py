import streamlit as st
import numpy as np
from typing import List, Tuple, Optional, Dict
from enum import Enum
import copy

class PieceType(Enum):
    PAWN = "pawn"
    ROOK = "rook"
    KNIGHT = "knight"
    BISHOP = "bishop"
    QUEEN = "queen"
    KING = "king"

class Color(Enum):
    WHITE = "white"
    BLACK = "black"

class Piece:
    def __init__(self, piece_type: PieceType, color: Color):
        self.type = piece_type
        self.color = color
        self.has_moved = False
    
    def __str__(self):
        symbols = {
            (PieceType.KING, Color.WHITE): "♔",
            (PieceType.QUEEN, Color.WHITE): "♕",
            (PieceType.ROOK, Color.WHITE): "♖",
            (PieceType.BISHOP, Color.WHITE): "♗",
            (PieceType.KNIGHT, Color.WHITE): "♘",
            (PieceType.PAWN, Color.WHITE): "♙",
            (PieceType.KING, Color.BLACK): "♚",
            (PieceType.QUEEN, Color.BLACK): "♛",
            (PieceType.ROOK, Color.BLACK): "♜",
            (PieceType.BISHOP, Color.BLACK): "♝",
            (PieceType.KNIGHT, Color.BLACK): "♞",
            (PieceType.PAWN, Color.BLACK): "♟",
        }
        return symbols.get((self.type, self.color), "")

class ChessBoard:
    def __init__(self):
        self.board = [[None for _ in range(8)] for _ in range(8)]
        self.current_player = Color.WHITE
        self.move_history = []
        self.captured_pieces = []
        self.game_over = False
        self.winner = None
        self.en_passant_target = None
        self.castling_rights = {
            Color.WHITE: {'kingside': True, 'queenside': True},
            Color.BLACK: {'kingside': True, 'queenside': True}
        }
        self.setup_initial_position()
    
    def setup_initial_position(self):
        # Set up pawns
        for col in range(8):
            self.board[1][col] = Piece(PieceType.PAWN, Color.BLACK)
            self.board[6][col] = Piece(PieceType.PAWN, Color.WHITE)
        
        # Set up other pieces
        piece_order = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
                      PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK]
        
        for col in range(8):
            self.board[0][col] = Piece(piece_order[col], Color.BLACK)
            self.board[7][col] = Piece(piece_order[col], Color.WHITE)
    
    def get_piece(self, row: int, col: int) -> Optional[Piece]:
        if 0 <= row < 8 and 0 <= col < 8:
            return self.board[row][col]
        return None
    
    def set_piece(self, row: int, col: int, piece: Optional[Piece]):
        if 0 <= row < 8 and 0 <= col < 8:
            self.board[row][col] = piece
    
    def is_valid_position(self, row: int, col: int) -> bool:
        return 0 <= row < 8 and 0 <= col < 8
    
    def get_valid_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        piece = self.get_piece(row, col)
        if not piece or piece.color != self.current_player:
            return []
        
        moves = []
        
        if piece.type == PieceType.PAWN:
            moves = self._get_pawn_moves(row, col)
        elif piece.type == PieceType.ROOK:
            moves = self._get_rook_moves(row, col)
        elif piece.type == PieceType.KNIGHT:
            moves = self._get_knight_moves(row, col)
        elif piece.type == PieceType.BISHOP:
            moves = self._get_bishop_moves(row, col)
        elif piece.type == PieceType.QUEEN:
            moves = self._get_queen_moves(row, col)
        elif piece.type == PieceType.KING:
            moves = self._get_king_moves(row, col)
        
        # Filter out moves that would put own king in check
        valid_moves = []
        for move_row, move_col in moves:
            if self._is_legal_move(row, col, move_row, move_col):
                valid_moves.append((move_row, move_col))
        
        return valid_moves
    
    def _get_pawn_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        piece = self.get_piece(row, col)
        moves = []
        direction = -1 if piece.color == Color.WHITE else 1
        start_row = 6 if piece.color == Color.WHITE else 1
        
        # Forward moves
        new_row = row + direction
        if self.is_valid_position(new_row, col) and not self.get_piece(new_row, col):
            moves.append((new_row, col))
            
            # Double move from starting position
            if row == start_row:
                new_row = row + 2 * direction
                if self.is_valid_position(new_row, col) and not self.get_piece(new_row, col):
                    moves.append((new_row, col))
        
        # Capture moves
        for dc in [-1, 1]:
            new_row, new_col = row + direction, col + dc
            if self.is_valid_position(new_row, new_col):
                target_piece = self.get_piece(new_row, new_col)
                if target_piece and target_piece.color != piece.color:
                    moves.append((new_row, new_col))
                # En passant
                elif (new_row, new_col) == self.en_passant_target:
                    moves.append((new_row, new_col))
        
        return moves
    
    def _get_rook_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        return self._get_linear_moves(row, col, [(0, 1), (0, -1), (1, 0), (-1, 0)])
    
    def _get_bishop_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        return self._get_linear_moves(row, col, [(1, 1), (1, -1), (-1, 1), (-1, -1)])
    
    def _get_queen_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        return self._get_linear_moves(row, col, [(0, 1), (0, -1), (1, 0), (-1, 0), 
                                                (1, 1), (1, -1), (-1, 1), (-1, -1)])
    
    def _get_linear_moves(self, row: int, col: int, directions: List[Tuple[int, int]]) -> List[Tuple[int, int]]:
        piece = self.get_piece(row, col)
        moves = []
        
        for dr, dc in directions:
            for i in range(1, 8):
                new_row, new_col = row + i * dr, col + i * dc
                if not self.is_valid_position(new_row, new_col):
                    break
                
                target_piece = self.get_piece(new_row, new_col)
                if target_piece:
                    if target_piece.color != piece.color:
                        moves.append((new_row, new_col))
                    break
                else:
                    moves.append((new_row, new_col))
        
        return moves
    
    def _get_knight_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        piece = self.get_piece(row, col)
        moves = []
        knight_moves = [(2, 1), (2, -1), (-2, 1), (-2, -1), 
                       (1, 2), (1, -2), (-1, 2), (-1, -2)]
        
        for dr, dc in knight_moves:
            new_row, new_col = row + dr, col + dc
            if self.is_valid_position(new_row, new_col):
                target_piece = self.get_piece(new_row, new_col)
                if not target_piece or target_piece.color != piece.color:
                    moves.append((new_row, new_col))
        
        return moves
    
    def _get_king_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        piece = self.get_piece(row, col)
        moves = []
        king_moves = [(1, 0), (-1, 0), (0, 1), (0, -1), 
                     (1, 1), (1, -1), (-1, 1), (-1, -1)]
        
        for dr, dc in king_moves:
            new_row, new_col = row + dr, col + dc
            if self.is_valid_position(new_row, new_col):
                target_piece = self.get_piece(new_row, new_col)
                if not target_piece or target_piece.color != piece.color:
                    moves.append((new_row, new_col))
        
        # Castling
        if not piece.has_moved and not self.is_in_check(piece.color):
            moves.extend(self._get_castling_moves(row, col))
        
        return moves
    
    def _get_castling_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        moves = []
        color = self.get_piece(row, col).color
        
        # Kingside castling
        if (self.castling_rights[color]['kingside'] and 
            not self.get_piece(row, 5) and not self.get_piece(row, 6)):
            if (not self._is_square_attacked(row, 5, color) and 
                not self._is_square_attacked(row, 6, color)):
                moves.append((row, 6))
        
        # Queenside castling
        if (self.castling_rights[color]['queenside'] and 
            not self.get_piece(row, 1) and not self.get_piece(row, 2) and not self.get_piece(row, 3)):
            if (not self._is_square_attacked(row, 2, color) and 
                not self._is_square_attacked(row, 3, color)):
                moves.append((row, 2))
        
        return moves
    
    def _is_legal_move(self, from_row: int, from_col: int, to_row: int, to_col: int) -> bool:
        # Make a copy of the board and try the move
        temp_board = copy.deepcopy(self)
        temp_board._make_move_without_validation(from_row, from_col, to_row, to_col)
        
        # Check if this move puts own king in check
        piece = self.get_piece(from_row, from_col)
        return not temp_board.is_in_check(piece.color)
    
    def _make_move_without_validation(self, from_row: int, from_col: int, to_row: int, to_col: int):
        piece = self.get_piece(from_row, from_col)
        captured_piece = self.get_piece(to_row, to_col)
        
        # Move the piece
        self.set_piece(to_row, to_col, piece)
        self.set_piece(from_row, from_col, None)
        
        if piece:
            piece.has_moved = True
    
    def make_move(self, from_row: int, from_col: int, to_row: int, to_col: int) -> bool:
        piece = self.get_piece(from_row, from_col)
        
        if not piece or piece.color != self.current_player:
            return False
        
        valid_moves = self.get_valid_moves(from_row, from_col)
        if (to_row, to_col) not in valid_moves:
            return False
        
        captured_piece = self.get_piece(to_row, to_col)
        
        # Handle special moves
        self._handle_special_moves(from_row, from_col, to_row, to_col)
        
        # Make the move
        self.set_piece(to_row, to_col, piece)
        self.set_piece(from_row, from_col, None)
        piece.has_moved = True
        
        if captured_piece:
            self.captured_pieces.append(captured_piece)
        
        # Record move
        self.move_history.append({
            'from': (from_row, from_col),
            'to': (to_row, to_col),
            'piece': piece.type,
            'captured': captured_piece.type if captured_piece else None
        })
        
        # Switch players
        self.current_player = Color.BLACK if self.current_player == Color.WHITE else Color.WHITE
        
        # Update en passant target
        self._update_en_passant_target(from_row, from_col, to_row, to_col)
        
        # Check for game end
        self._check_game_end()
        
        return True
    
    def _handle_special_moves(self, from_row: int, from_col: int, to_row: int, to_col: int):
        piece = self.get_piece(from_row, from_col)
        
        # Castling
        if piece.type == PieceType.KING and abs(to_col - from_col) == 2:
            if to_col > from_col:  # Kingside
                rook = self.get_piece(from_row, 7)
                self.set_piece(from_row, 5, rook)
                self.set_piece(from_row, 7, None)
                rook.has_moved = True
            else:  # Queenside
                rook = self.get_piece(from_row, 0)
                self.set_piece(from_row, 3, rook)
                self.set_piece(from_row, 0, None)
                rook.has_moved = True
        
        # En passant capture
        if (piece.type == PieceType.PAWN and 
            (to_row, to_col) == self.en_passant_target):
            captured_pawn_row = to_row + (1 if piece.color == Color.WHITE else -1)
            captured_pawn = self.get_piece(captured_pawn_row, to_col)
            self.captured_pieces.append(captured_pawn)
            self.set_piece(captured_pawn_row, to_col, None)
        
        # Update castling rights
        if piece.type == PieceType.KING:
            self.castling_rights[piece.color]['kingside'] = False
            self.castling_rights[piece.color]['queenside'] = False
        elif piece.type == PieceType.ROOK:
            if from_col == 0:
                self.castling_rights[piece.color]['queenside'] = False
            elif from_col == 7:
                self.castling_rights[piece.color]['kingside'] = False
    
    def _update_en_passant_target(self, from_row: int, from_col: int, to_row: int, to_col: int):
        piece = self.get_piece(to_row, to_col)
        
        # Reset en passant target
        self.en_passant_target = None
        
        # Set en passant target for double pawn move
        if (piece.type == PieceType.PAWN and abs(to_row - from_row) == 2):
            self.en_passant_target = ((from_row + to_row) // 2, to_col)
    
    def is_in_check(self, color: Color) -> bool:
        # Find the king
        king_pos = None
        for row in range(8):
            for col in range(8):
                piece = self.get_piece(row, col)
                if piece and piece.type == PieceType.KING and piece.color == color:
                    king_pos = (row, col)
                    break
            if king_pos:
                break
        
        if not king_pos:
            return False
        
        return self._is_square_attacked(king_pos[0], king_pos[1], color)
    
    def _is_square_attacked(self, row: int, col: int, defending_color: Color) -> bool:
        attacking_color = Color.BLACK if defending_color == Color.WHITE else Color.WHITE
        
        for r in range(8):
            for c in range(8):
                piece = self.get_piece(r, c)
                if piece and piece.color == attacking_color:
                    # Temporarily switch player to get attacking moves
                    original_player = self.current_player
                    self.current_player = attacking_color
                    
                    moves = []
                    if piece.type == PieceType.PAWN:
                        moves = self._get_pawn_moves(r, c)
                    elif piece.type == PieceType.ROOK:
                        moves = self._get_rook_moves(r, c)
                    elif piece.type == PieceType.KNIGHT:
                        moves = self._get_knight_moves(r, c)
                    elif piece.type == PieceType.BISHOP:
                        moves = self._get_bishop_moves(r, c)
                    elif piece.type == PieceType.QUEEN:
                        moves = self._get_queen_moves(r, c)
                    elif piece.type == PieceType.KING:
                        # King attacks without castling
                        king_moves = [(1, 0), (-1, 0), (0, 1), (0, -1), 
                                     (1, 1), (1, -1), (-1, 1), (-1, -1)]
                        for dr, dc in king_moves:
                            new_row, new_col = r + dr, c + dc
                            if self.is_valid_position(new_row, new_col):
                                moves.append((new_row, new_col))
                    
                    self.current_player = original_player
                    
                    if (row, col) in moves:
                        return True
        
        return False
    
    def _check_game_end(self):
        # Check if current player has any legal moves
        has_legal_moves = False
        for row in range(8):
            for col in range(8):
                piece = self.get_piece(row, col)
                if piece and piece.color == self.current_player:
                    if self.get_valid_moves(row, col):
                        has_legal_moves = True
                        break
            if has_legal_moves:
                break
        
        if not has_legal_moves:
            if self.is_in_check(self.current_player):
                # Checkmate
                self.game_over = True
                self.winner = Color.BLACK if self.current_player == Color.WHITE else Color.WHITE
            else:
                # Stalemate
                self.game_over = True
                self.winner = None

class ChessGameUI:
    def __init__(self):
        if 'chess_board' not in st.session_state:
            st.session_state.chess_board = ChessBoard()
        if 'selected_square' not in st.session_state:
            st.session_state.selected_square = None
        if 'highlighted_moves' not in st.session_state:
            st.session_state.highlighted_moves = []
    
    def display_board(self):
        board = st.session_state.chess_board
        
        st.markdown("""
        <style>
        .chess-board {
            display: grid;
            grid-template-columns: repeat(8, 60px);
            grid-template-rows: repeat(8, 60px);
            gap: 2px;
            margin: 20px auto;
            padding: 10px;
            background-color: #8B4513;
            border-radius: 10px;
        }
        .chess-square {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            cursor: pointer;
            border-radius: 5px;
        }
        .light-square {
            background-color: #F0D9B5;
        }
        .dark-square {
            background-color: #B58863;
        }
        .selected-square {
            background-color: #FFFF00 !important;
            box-shadow: 0 0 10px rgba(255, 255, 0, 0.7);
        }
        .valid-move {
            background-color: #90EE90 !important;
        }
        .game-info {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background-color: #f0f2f6;
            border-radius: 10px;
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Game status
        status_text = ""
        if board.game_over:
            if board.winner:
                status_text = f"🎉 {board.winner.value.title()} wins!"
            else:
                status_text = "🤝 Draw (Stalemate)"
        else:
            current_player = board.current_player.value.title()
            check_status = " (In Check!)" if board.is_in_check(board.current_player) else ""
            status_text = f"Current Player: {current_player}{check_status}"
        
        st.markdown(f'<div class="game-info"><h3>{status_text}</h3></div>', unsafe_allow_html=True)
        
        # Display board
        cols = st.columns(8)
        
        for row in range(8):
            for col in range(8):
                with cols[col]:
                    piece = board.get_piece(row, col)
                    piece_symbol = str(piece) if piece else ""
                    
                    # Determine square color
                    is_light = (row + col) % 2 == 0
                    square_class = "light-square" if is_light else "dark-square"
                    
                    # Check if square is selected or a valid move
                    if st.session_state.selected_square == (row, col):
                        square_class += " selected-square"
                    elif (row, col) in st.session_state.highlighted_moves:
                        square_class += " valid-move"
                    
                    # Create button for each square
                    square_key = f"square_{row}_{col}"
                    if st.button(piece_symbol, key=square_key, help=f"Square {chr(ord('a')+col)}{8-row}"):
                        self.handle_square_click(row, col)
        
        # Add coordinate labels
        st.markdown("**Files:** a b c d e f g h")
        st.markdown("**Ranks:** 8 7 6 5 4 3 2 1")
    
    def handle_square_click(self, row: int, col: int):
        board = st.session_state.chess_board
        
        if board.game_over:
            return
        
        if st.session_state.selected_square is None:
            # Select a square
            piece = board.get_piece(row, col)
            if piece and piece.color == board.current_player:
                st.session_state.selected_square = (row, col)
                st.session_state.highlighted_moves = board.get_valid_moves(row, col)
        else:
            # Try to make a move
            from_row, from_col = st.session_state.selected_square
            
            if (row, col) == st.session_state.selected_square:
                # Deselect
                st.session_state.selected_square = None
                st.session_state.highlighted_moves = []
            elif (row, col) in st.session_state.highlighted_moves:
                # Make the move
                if board.make_move(from_row, from_col, row, col):
                    st.session_state.selected_square = None
                    st.session_state.highlighted_moves = []
                    st.rerun()
            else:
                # Select a different piece
                piece = board.get_piece(row, col)
                if piece and piece.color == board.current_player:
                    st.session_state.selected_square = (row, col)
                    st.session_state.highlighted_moves = board.get_valid_moves(row, col)
                else:
                    st.session_state.selected_square = None
                    st.session_state.highlighted_moves = []
    
    def display_game_controls(self):
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("🔄 New Game"):
                st.session_state.chess_board = ChessBoard()
                st.session_state.selected_square = None
                st.session_state.highlighted_moves = []
                st.rerun()
        
        with col2:
            if st.button("↩️ Undo Move"):
                # This would require implementing move undo functionality
                st.info("Undo functionality coming soon!")
        
        with col3:
            if st.button("💾 Save Game"):
                st.info("Save functionality coming soon!")
    
    def display_captured_pieces(self):
        board = st.session_state.chess_board
        
        if board.captured_pieces:
            st.subheader("Captured Pieces")
            
            white_captured = [p for p in board.captured_pieces if p.color == Color.WHITE]
            black_captured = [p for p in board.captured_pieces if p.color == Color.BLACK]
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("**White pieces captured:**")
                if white_captured:
                    st.write(" ".join([str(p) for p in white_captured]))
                else:
                    st.write("None")
            
            with col2:
                st.write("**Black pieces captured:**")
                if black_captured:
                    st.write(" ".join([str(p) for p in black_captured]))
                else:
                    st.write("None")
    
    def display_move_history(self):
        board = st.session_state.chess_board
        
        if board.move_history:
            st.subheader("Move History")
            
            # Display last 10 moves
            recent_moves = board.move_history[-10:]
            for i, move in enumerate(recent_moves):
                from_square = f"{chr(ord('a')+move['from'][1])}{8-move['from'][0]}"
                to_square = f"{chr(ord('a')+move['to'][1])}{8-move['to'][0]}"
                move_text = f"{move['piece'].value.title()}: {from_square} → {to_square}"
                if move['captured']:
                    move_text += f" (captured {move['captured'].value})"
                st.write(f"{len(board.move_history)-len(recent_moves)+i+1}. {move_text}")

def main():
    st.set_page_config(
        page_title="Chess Game",
        page_icon="♟️",
        layout="wide"
    )
    
    st.title("♟️ Chess Game")
    st.markdown("---")
    
    game_ui = ChessGameUI()
    
    # Main game layout
    col1, col2 = st.columns([2, 1])
    
    with col1:
        game_ui.display_board()
        game_ui.display_game_controls()
    
    with col2:
        game_ui.display_captured_pieces()
        st.markdown("---")
        game_ui.display_move_history()
        
        # Game rules
        with st.expander("🎯 How to Play"):
            st.markdown("""
            **Chess Rules:**
            1. Click on a piece to select it
            2. Valid moves will be highlighted in green
            3. Click on a highlighted square to move
            4. The goal is to checkmate the opponent's king
            
            **Special Moves:**
            - **Castling**: Move king 2 squares toward a rook
            - **En Passant**: Capture a pawn that just moved 2 squares
            - **Promotion**: Pawn reaching the end becomes a queen
            
            **Game Ends:**
            - **Checkmate**: King is in check with no escape
            - **Stalemate**: No legal moves but king not in check
            """)

if __name__ == "__main__":
    main()