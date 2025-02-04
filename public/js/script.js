const socket = io();
const chess = new Chess();
const board = document.querySelector('.chess-board');

let playerRole = null;
let dragPice = null;
let sourceSquare = null;

const renderBoard = () => {
    const imaginaryBoard = chess.board();
    board.innerHTML = '';

    imaginaryBoard.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const sqElement = document.createElement('div');
            sqElement.classList.add('square',
                (rowIndex + squareIndex) % 2 === 0 ? 'light' : 'dark'
            );

            sqElement.dataset.row = rowIndex;
            sqElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', square.color === 'w' ? 'white' : 'black');
                pieceElement.innerHTML = getPiceUniCode(square);
                pieceElement.draggable = playerRole === square.color && playerRole === chess.turn();

                pieceElement.addEventListener('dragstart', (e) => {
                    if (pieceElement.draggable) {
                        dragPice = square;
                        sourceSquare = {
                            row: rowIndex,
                            col: squareIndex
                        };
                        e.dataTransfer.setData('text/plain', '');
                    }
                });

                pieceElement.addEventListener('dragend', (e) => {
                    dragPice = null;
                    sourceSquare = null;
                });

                sqElement.appendChild(pieceElement);
            }

            sqElement.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            sqElement.addEventListener('drop', (e) => {
                e.preventDefault();
                if (dragPice) {
                    const targetElement = e.target.classList.contains('square') ? 
                        e.target : e.target.parentElement;
                    
                    const targetSquare = {
                        row: parseInt(targetElement.dataset.row),
                        col: parseInt(targetElement.dataset.col)
                    };
                    
                    handleMove(sourceSquare, targetSquare);
                }
            });

            board.appendChild(sqElement);
        });
    });
};

const handleMove = (sourceSquare, targetSquare) => {
    const from = `${String.fromCharCode(97 + parseInt(sourceSquare.col))}${8 - parseInt(sourceSquare.row)}`;
    const to = `${String.fromCharCode(97 + parseInt(targetSquare.col))}${8 - parseInt(targetSquare.row)}`;
    
    const move = {
        from: from,
        to: to,
        promotion: 'q'
    };
    
    socket.emit('move', move);
};

const getPiceUniCode = (piece) => {
    const unicodePieces = {
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚',
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔'
    };

    if (!piece || !piece.type || !piece.color) return null;

    const pieceKey = piece.color === 'w' ? piece.type.toUpperCase() : piece.type.toLowerCase();
    return unicodePieces[pieceKey] || null;
};

// Socket event listeners
socket.on('playerRole', (role) => {
    playerRole = role;
    renderBoard();
});

socket.on('move', (move) => {
    chess.move(move);
    renderBoard();
});

socket.on('boardState', (fen) => {
    chess.load(fen);
    renderBoard();
});


renderBoard();