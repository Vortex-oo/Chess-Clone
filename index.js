import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Chess } from 'chess.js';
import path from 'path';

const app = express();
const server = createServer(app);
const io = new Server(server);

// Setting up the chess game
const chess = new Chess();

let players = {};
let currentPlayer = 'W';

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('index');
});

io.on('connection' , (socket) =>{
    console.log("connected");

    if (!players.white) {
        players.white = socket.id;
        socket.emit('playerRole', 'w');
    }

    else if (!players.black) {
        players.black = socket.id;
        socket.emit('playerRole', 'b');
    }

    else  {
        socket.emit('playerRole', 'Room is full');
    }

    socket.on("disconnect", () => {
        
        console.log("disconnected");
        
        if (chess.turn()==='w' &&  players.white !== socket.id) {
            delete players.white;
        }
        
        else if (chess.turn()==='b' &&  players.white !== socket.id) {
            delete players.black;
        }
    })

    socket.on('move', (move) => {

        try {
            if (chess.turn()==="w" && !socket.id === players.white) {
                return;
            }
            if (chess.turn()==="b" && !socket.id === players.black) {
                return;
            }

            const result = chess.move(move);

            if (result) {
                currentPlayer = chess.turn();
                io.emit('move', move);
                io.emit('boardState', chess.fen());
            }
            else {
                socket.emit('Invalid move', move);
            }

        } catch (error) {
            console.log(error);
            socket.emit('Invalid move', move);
        }
    })

} )

server.listen(3000, () => {
    console.log('Server is running on port http://localhost:3000/');
});
