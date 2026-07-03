import { BOARD_SIZE, createRandomBoard, type Board } from "./Board";
import type { MoveRecord } from "./GameSave";
import { type RNG, mulberry32, stringToHash } from "./Random";

export const MIN_AVG_MOVE_TIME = 200;
export const MIN_GAME_PROBABILITY = Math.pow(0.5, 7); // Allow luck equivalent to seven 50/50 guesses

export const CheatingStatus = {
	Fair: 0, // No cheating detected
	TooFast: 1, // Average move time is too fast to be human
	Improbable: 2, // The probability of making these moves without cheating is too low
	NonWin: 3, // The game wasn't a win (clicked a mine or didn't finish)
} as const;
export type CheatingStatus = (typeof CheatingStatus)[keyof typeof CheatingStatus];

export function checkCheating(seed: string, moves: MoveRecord[]): CheatingStatus {
	// Construct the game board
	const random: RNG = mulberry32(stringToHash(seed));
	const board = createRandomBoard(BOARD_SIZE, BOARD_SIZE, random);

	if (moves.length > 1) {
		// Calculate the average speed of all of the moves
		let sumMoveTime = 0;
		let lastTimestamp = moves[0].timestamp;
		for (let i = 1; i < moves.length; i++) {
			sumMoveTime += moves[i].timestamp - lastTimestamp;
			lastTimestamp = moves[i].timestamp;
		}
		const avgMoveTime = sumMoveTime / (moves.length - 1);

		if (avgMoveTime < MIN_AVG_MOVE_TIME) {
			return CheatingStatus.TooFast; // Too fast to be human
		}
	}

	// Calculate the probability of making these moves without cheating
	let gameProbability = 1;

	// First move isn't counted in probability of winning
	if (!applyMove(board, moves[0])) {
		return CheatingStatus.NonWin;
	}

	for (const move of moves.slice(1)) {
		gameProbability *= calculateMoveProbability(board, move);

		if (gameProbability < MIN_GAME_PROBABILITY) {
			return CheatingStatus.Improbable;
		}

		if (!applyMove(board, move)) {
			return CheatingStatus.NonWin; // Losing move
		}
	}

	if (board.safeCount !== board.cells.length - board.mineCount) {
		return CheatingStatus.NonWin; // Unfinished game
	}

	// Cheating isn't likely
	return CheatingStatus.Fair;
}

function applyMove(board: Board, move: MoveRecord): boolean {
	let safe = false;
	if (move.flag) {
		safe = flagCell(board, move.index);
	} else {
		safe = clickCell(board, move.index);
	}
	return safe;
}

function flagCell(board: Board, index: number): boolean {
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
		return true;
	}

	cell.isFlagged = !cell.isFlagged;
	board.flagCount += cell.isFlagged ? 1 : -1;
	return true;
}

function clickCell(board: Board, index: number): boolean {
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
		return true;
	}

	cell.isRevealed = true;
	if (cell.isMine) {
		// Game over
		return false;
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
	return true;
}

export function calculateMoveProbability(board: Board, move: MoveRecord): number {
	const moveCell = board.cells[move.index];

	// Chording and flag chording are always safe
	if (moveCell.isRevealed) {
		return 1;
	}

	// Unflagging is always safe
	if (move.flag && moveCell.isFlagged) {
		return 1;
	}

	// Incorrect flagging is always "safe" in a winning game as it will be undone later
	if (move.flag && !moveCell.isMine) {
		return 1;
	}

	let probability = naiveProbability(board, move);
	if (probability < 1) {
		// Try the advanced approach for non-trivial moves
		const new_probability = advancedProbability(board, move, 5);
		probability = Math.max(probability, new_probability);
	}

	return probability;
}

/**
 * Calculate the probability of this move being correct based on the immediate neighbors.
 * Note that this is not a thorough calculation, as it doesn't take multi-neighbor patterns into consideration. Therefore some moves that are guaranteed to be correct will be treated as guesses.
 *
 * @param board The current board
 * @param move The move being made
 * @returns The highest probability of the move being correct
 */
function naiveProbability(board: Board, move: MoveRecord): number {
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
		if (probability == 1) {
			break;
		}
	}

	return probability;
}

/**
 * Calculate the probability of this move being correct based on the local board state.
 * Note that this is an imperfect calculation, as it only considers a limited region of the board.
 *
 * @param board The current board
 * @param move The move being made
 * @param maxUnknown Limit on the number of unrevealed cells to consider (default of 5, max of 30)
 * @returns The highest probability of the move being correct
 */
function advancedProbability(board: Board, move: MoveRecord, maxUnknown: number = 5): number {
	maxUnknown = Math.max(Math.min(30, maxUnknown), 3);

	// Find the local frontier cell indices
	const cellIndicesSet = new Set<number>();
	cellIndicesSet.add(move.index);
	let addedCells = true;
	let unknownCount = 0;
	while (addedCells && unknownCount < maxUnknown) {
		addedCells = false;
		for (const iCell of cellIndicesSet) {
			if (unknownCount >= maxUnknown) {
				break;
			}
			const cell = board.cells[iCell];
			if (cell.isFlagged) {
				continue; // Don't propagate fronteir through flagged cells
			}
			const cellIsRevealed = cell.isRevealed;
			for (const iNeighbor of cell.neighbors) {
				if (unknownCount >= maxUnknown) {
					break;
				}
				if (cellIndicesSet.has(iNeighbor)) {
					continue;
				}
				const neighbor = board.cells[iNeighbor];
				if (cellIsRevealed && !neighbor.isRevealed) {
					// Get unrevealed neighbor of revealed cells
					cellIndicesSet.add(iNeighbor);
					addedCells = true;
					unknownCount += neighbor.isFlagged ? 0 : 1; // Don't count flagged cells as unknown
				} else if (!cellIsRevealed && neighbor.isRevealed) {
					cellIndicesSet.add(iNeighbor);
					addedCells = true;
				}
			}
		}
	}

	if (cellIndicesSet.size == 1) {
		return 0; // Random guesses handled by the naive case
	}

	// Split frontier into unknown and revealed cells
	const frontierCellIndices = [...cellIndicesSet];
	const revealedCellIndices = frontierCellIndices.filter((i) => board.cells[i].isRevealed);
	const unknownCellIndices = frontierCellIndices.filter((i) => {
		const cell = board.cells[i];
		return !(cell.isRevealed || cell.isFlagged);
	});
	const cellIndexLookup = new Map();
	for (let i = 0; i < unknownCellIndices.length; i++) {
		cellIndexLookup.set(unknownCellIndices[i], i);
	}

	// Try every possible assignment of mines to see how many valid ones contain the player's move
	let agree = 0;
	let disagree = 0;
	const n = unknownCellIndices.length;
	for (let i = 0; i < 1 << n; i++) {
		// integer bits represent mine assignments

		// Check the assignment for validity
		let valid = true;
		for (const revealedCellIndex of revealedCellIndices) {
			const revealedCell = board.cells[revealedCellIndex];
			let sumFlags = 0;
			let minFlags = revealedCell.neighborMines; // number of needed flags to be valid
			for (const iNeighbor of revealedCell.neighbors) {
				const neighbor = board.cells[iNeighbor];
				if (neighbor.isRevealed) {
					continue;
				} else if (neighbor.isFlagged) {
					sumFlags++;
				} else if (cellIndexLookup.has(iNeighbor)) {
					sumFlags += (i >> cellIndexLookup.get(iNeighbor)) & 1;
				} else {
					// Unrevealed cell, but outside of our region of consideration.  Treat it as optional.
					minFlags--;
				}
			}
			if (sumFlags < minFlags || revealedCell.neighborMines < sumFlags) {
				valid = false;
				break;
			}
		}

		// Assignment is valid, so see if it agrees with the player's move or not
		if (valid) {
			const assignmentFlagged: boolean = ((i >> cellIndexLookup.get(move.index)) & 1) === 1;
			if (assignmentFlagged === move.flag) {
				agree++;
			} else {
				disagree++;
			}
		}
	}

	const probability = agree / (agree + disagree);
	return probability;
}
