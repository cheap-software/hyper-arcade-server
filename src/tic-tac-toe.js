function createGameState() {
    return {
        board: [
            [0, 0, 0], 
            [0, 0, 0], 
            [0, 0, 0]
        ], 
        turn: 1
    }
}

function gameLoop(state) {
    if (!state) {
        return;
    }

    let winner = checkWinner(state);
    if (winner) {
        return winner;
    }

    return false;
}

function checkWinner(state) {
    // Check rows for winner
    for (let i = 0; i < 3; i++) {
        let row = state.board[i];
        if (row[0]*row[1]*row[2] === 1) {
            return 1;
        } else if (row[0]*row[1]*row[2] === 8) {
            return 2;
        }
    }

    // Check cols for winner
    for (let i = 0; i < 3; i++) {
        let col = [
            state.board[i][0], 
            state.board[i][1], 
            state.board[i][2]
        ];

        if (col[0]*col[1]*col[2] === 1) {
            return 1;
        } else if (col[0]*col[1]*col[2] === 8) {
            return 2;
        }
    }

    // Check diagonals for winner
    if (state.board[0][0]*state.board[1][1]*state.board[2][2] === 1) {
        return 1;
    } else if (state.board[0][0]*state.board[1][1]*state.board[2][2] === 8) {
        return 2;
    } else if (state.board[0][2]*state.board[1][1]*state.board[2][0] === 1) {
        return 1;
    } else if (state.board[0][2]*state.board[1][1]*state.board[2][0] === 8) {
        return 2;
    }

    return 0;
}