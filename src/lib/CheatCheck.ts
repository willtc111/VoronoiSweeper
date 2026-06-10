import { BOARD_SIZE, createRandomBoard, type Board } from "./Board";
import type { MoveRecord } from "./GameSave";
import { type RNG, mulberry32, stringToHash } from "./Random";

export const MIN_AVG_MOVE_TIME = 100;
export const MIN_GAME_PROBABILITY = 0.001; // naturally got a 0.0022

export function isCheating(seed: string, moves: MoveRecord[]): boolean {
	console.log(moves);

	if (moves.length < 2) {
		// Trivial game (unlikely, but possible).
		return false;
	}

	// Construct the game board
	const random: RNG = mulberry32(stringToHash(seed));
	const board = createRandomBoard(BOARD_SIZE, BOARD_SIZE, random);

	// Calculate the average speed of all of the moves
	let sumMoveTime = 0;
	let lastTimestamp = moves[0].timestamp;
	for (let i = 1; i < moves.length; i++) {
		sumMoveTime += moves[i].timestamp - lastTimestamp;
		lastTimestamp = moves[i].timestamp;
	}
	const avgMoveTime = sumMoveTime / (moves.length - 1);

	if (avgMoveTime < MIN_AVG_MOVE_TIME) {
		console.log(`Cheating detected on game "${seed}": average speed of ${avgMoveTime}ms per move`);
		return true; // Too fast to be human
	}

	// Calculate the probability of making these moves without cheating
	let gameProbability = 1;
	for (const move of moves) {
		gameProbability *= moveProbability(board, move);
	}
	if (gameProbability < MIN_GAME_PROBABILITY) {
		console.log(
			`Cheating detected on game "${seed}": correct move probability of ${gameProbability}`
		);
		console.log(moves);
		return true; // Too lucky to be playing fairly
	}

	// Cheating isn't likely
	return false;
}

/**
 * Calculate the probability of this move being correct based on the current board state.
 * Note that this is not a thorough calculation, as it doesn't take multi-neighbor patterns into consideration. Therefore some moves that are guaranteed to be correct will be treated as guesses.
 *
 * @param board The current board
 * @param move The move being made
 * @returns The highest probability of the move being correct
 */
function moveProbability(board: Board, move: MoveRecord): number {
	if (board.cells[move.index].isRevealed) {
		// If the cell is already revealed, the move is chording and is never a guess
		applyMove(board, move);
		return 1;
	}

	// Calculate the probability of this move being guessed based on the current board state.
	const unknownCellCount = board.cells.length - board.flagCount - board.safeCount;
	const remainingMineCount = board.mineCount - board.flagCount;
	const mineProbability = remainingMineCount / unknownCellCount;
	const baseProbability = move.flag ? mineProbability : 1 - mineProbability;
	let probability = baseProbability;

	// For each revealed neighbor
	for (const iNeighbor of board.cells[move.index].neighbors) {
		const neighbor = board.cells[iNeighbor];
		if (!neighbor.isRevealed) {
			continue;
		}

		// Calculate the probability of making this move based solely on this neighbor
		let flagsNearNeighbor = 0;
		let unknownNearNeighbor = 0;
		for (const iNeighborNeighbor of neighbor.neighbors) {
			const neighborNeighbor = board.cells[iNeighborNeighbor];
			if (neighborNeighbor.isFlagged) {
				flagsNearNeighbor += 1;
			} else if (!neighborNeighbor.isRevealed) {
				unknownNearNeighbor += 1;
			}
		}
		const minesRemaining = neighbor.neighborMines - flagsNearNeighbor;
		const localMineProbability = minesRemaining / unknownNearNeighbor;
		const localProbability = move.flag ? localMineProbability : 1 - localMineProbability;
		// Save this probability if it is the new best odds for this move
		probability = Math.max(probability, localProbability);
	}

	applyMove(board, move);
	return probability;
}

function applyMove(board: Board, move: MoveRecord) {
	if (move.flag) {
		flagCell(board, move.index);
	} else {
		clickCell(board, move.index);
	}
}

function flagCell(board: Board, index: number) {
	// Handle flag chording
	const cell = board.cells[index];
	if (cell.isRevealed) {
		// If the number of unflagged neighbors is equal to the remaining mine count, flag all remaining neighbors
		const flaggedNeighbors = cell.neighbors.reduce((count, iNeighbor) => {
			return count + (board.cells[iNeighbor].isFlagged ? 1 : 0);
		}, 0);
		const remainingMines = cell.neighborMines - flaggedNeighbors;
		const unflaggedNeighbors = cell.neighbors.filter(
			(iNeighbor) => !board.cells[iNeighbor].isFlagged && !board.cells[iNeighbor].isRevealed
		);
		if (unflaggedNeighbors.length == remainingMines) {
			for (const iNeighbor of unflaggedNeighbors) {
				const neighbor = board.cells[iNeighbor];
				flagCell(board, neighbor.index);
			}
		}
		return;
	}

	cell.isFlagged = !cell.isFlagged;
	board.flagCount += cell.isFlagged ? 1 : -1;
}

function clickCell(board: Board, index: number) {
	const cell = board.cells[index];

	if (cell.isRevealed) {
		// If the number of flagged neighbors is equal to cell value, reveal all remaining neighbors
		const neighborFlags = cell.neighbors.reduce((count, iNeighbor) => {
			return count + (board.cells[iNeighbor].isFlagged ? 1 : 0);
		}, 0);

		if (neighborFlags == cell.neighborMines) {
			for (const iNeighbor of cell.neighbors) {
				const neighbor = board.cells[iNeighbor];
				if (!neighbor.isFlagged && !neighbor.isRevealed) {
					clickCell(board, neighbor.index);
				}
			}
		}
		return;
	}

	cell.isRevealed = true;
	if (cell.isMine) {
		// Game over
		return;
	}

	// Automatically expand revealed area for 0s
	if (cell.neighborMines == 0 && !cell.isMine) {
		for (const iNeighbor of cell.neighbors) {
			const neighbor = board.cells[iNeighbor];
			if (!neighbor.isFlagged && !neighbor.isRevealed && !neighbor.isMine) {
				clickCell(board, neighbor.index);
			}
		}
	}
	board.safeCount += 1;
}
