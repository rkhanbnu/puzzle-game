// Game configuration
const puzzleConfig = {
  easy: { rows: 3, cols: 3 },
  hard: { rows: 5, cols: 5 },
  currentImage: '',
  currentDifficulty: 'easy',
  isPlaying: false,
  timer: 0,
  timerInterval: null,
  bestTime: Infinity,
  fastestTime: Infinity,
  pieces: [],
  emptyIndex: 0
};

// Image library with direct Google Drive links
const imageLibrary = [
  {
    name: "Mountain View",
    url: "https://drive.google.com/uc?export=view&id=1BYoqIu4at048MWl8k775t8qR5S2nAAwk"
  },
  {
    name: "Ocean Sunset",
    url: "https://drive.google.com/uc?export=view&id=1UMXhvwR1GuRoisJKPEv7PDwXfGc1ikMK"
  },
  {
    name: "Forest Path",
    url: "https://drive.google.com/uc?export=view&id=1O5_dKFz_AeWBCcEwl-QOWk7fRoEQJYO0"
  },
  {
    name: "City Skyline",
    url: "https://drive.google.com/uc?export=view&id=1CpmO1SomubhwutCR-StRwXRZ2wdtoWD4"
  },
  {
    name: "Desert Landscape",
    url: "https://drive.google.com/uc?export=view&id=14JEpjCDz0ZlG_0QDnFHxVAhnOK-jttB5"
  }
];

// DOM elements
const elements = {
  puzzleBoard: document.getElementById('puzzle-board'),
  referenceImage: document.getElementById('reference-image'),
  easyBtn: document.getElementById('easy-btn'),
  hardBtn: document.getElementById('hard-btn'),
  retryBtn: document.getElementById('retry-btn'),
  timerDisplay: document.querySelector('.timer'),
  bestTimeDisplay: document.querySelector('.best-time'),
  fastestTimeDisplay: document.getElementById('fastest-time'),
  winMessage: document.getElementById('win-message'),
  finalTime: document.getElementById('final-time'),
  playAgainBtn: document.getElementById('play-again-btn'),
  imageSelect: document.getElementById('image-select')
};

// Image error handler
function handleImageError(img) {
  console.error("Failed to load image:", img.src);
  img.src = "https://via.placeholder.com/250?text=Image+not+loading";
  alert("Failed to load image. Please check your internet connection or image permissions.");
}

// Initialize the game
function initGame() {
  loadFastestTime();
  
  // Set the first image as default
  puzzleConfig.currentImage = imageLibrary[0].url;
  elements.referenceImage.src = puzzleConfig.currentImage;
  
  setupEventListeners();
  startNewGame();
}

// Set up event listeners
function setupEventListeners() {
  elements.easyBtn.addEventListener('click', () => setDifficulty('easy'));
  elements.hardBtn.addEventListener('click', () => setDifficulty('hard'));
  elements.retryBtn.addEventListener('click', startNewGame);
  elements.playAgainBtn.addEventListener('click', startNewGame);
  elements.imageSelect.addEventListener('change', handleImageChange);
}

// Handle image selection change
function handleImageChange(e) {
  const selectedImage = imageLibrary[e.target.value];
  puzzleConfig.currentImage = selectedImage.url;
  elements.referenceImage.src = selectedImage.url;
  startNewGame();
}

// Set difficulty level
function setDifficulty(difficulty) {
  if (puzzleConfig.currentDifficulty === difficulty) return;
  
  puzzleConfig.currentDifficulty = difficulty;
  
  // Update UI
  elements.easyBtn.classList.toggle('active', difficulty === 'easy');
  elements.hardBtn.classList.toggle('active', difficulty === 'hard');
  
  // Start new game with selected difficulty
  startNewGame();
}

// Start a new game
function startNewGame() {
  // Reset game state
  puzzleConfig.isPlaying = true;
  puzzleConfig.pieces = [];
  clearInterval(puzzleConfig.timerInterval);
  puzzleConfig.timer = 0;
  updateTimerDisplay();
  
  // Hide win message
  elements.winMessage.style.display = 'none';
  
  // Create puzzle pieces
  createPuzzle();
}

// Create the puzzle pieces
function createPuzzle() {
  const { rows, cols } = puzzleConfig[puzzleConfig.currentDifficulty];
  const totalPieces = rows * cols;
  
  // Clear the board
  elements.puzzleBoard.innerHTML = '';
  elements.puzzleBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  elements.puzzleBoard.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  
  // Create an array of piece indices
  let pieceIndices = Array.from({ length: totalPieces - 1 }, (_, i) => i);
  
  // Shuffle the pieces (Fisher-Yates shuffle)
  for (let i = pieceIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieceIndices[i], pieceIndices[j]] = [pieceIndices[j], pieceIndices[i]];
  }
  
  // Add empty space at random position
  puzzleConfig.emptyIndex = Math.floor(Math.random() * totalPieces);
  pieceIndices.splice(puzzleConfig.emptyIndex, 0, -1); // -1 represents empty space
  
  // Create puzzle pieces
  for (let i = 0; i < totalPieces; i++) {
    const piece = document.createElement('div');
    piece.className = 'puzzle-piece';
    
    if (pieceIndices[i] === -1) {
      piece.classList.add('empty');
      piece.dataset.index = i;
      piece.dataset.empty = 'true';
    } else {
      const pieceIndex = pieceIndices[i];
      const row = Math.floor(pieceIndex / cols);
      const col = pieceIndex % cols;
      
      piece.style.backgroundImage = `url(${puzzleConfig.currentImage})`;
      piece.style.backgroundPosition = `-${col * (100 / (cols - 1))}% -${row * (100 / (rows - 1))}%`;
      piece.dataset.index = i;
      piece.dataset.correctIndex = pieceIndex;
    }
    
    piece.addEventListener('click', () => handlePieceClick(i));
    elements.puzzleBoard.appendChild(piece);
    puzzleConfig.pieces.push(piece);
  }
  
  // Start timer
  puzzleConfig.timerInterval = setInterval(() => {
    puzzleConfig.timer++;
    updateTimerDisplay();
  }, 1000);
}

// Handle piece click
function handlePieceClick(clickedIndex) {
  if (!puzzleConfig.isPlaying) return;
  
  const clickedPiece = puzzleConfig.pieces[clickedIndex];
  if (clickedPiece.dataset.empty === 'true') return;
  
  const emptyIndex = puzzleConfig.emptyIndex;
  const emptyPiece = puzzleConfig.pieces[emptyIndex];
  
  // Check if clicked piece is adjacent to empty space
  const { rows, cols } = puzzleConfig[puzzleConfig.currentDifficulty];
  const clickedRow = Math.floor(clickedIndex / cols);
  const clickedCol = clickedIndex % cols;
  const emptyRow = Math.floor(emptyIndex / cols);
  const emptyCol = emptyIndex % cols;
  
  const isAdjacent = 
    (Math.abs(clickedRow - emptyRow) === 1 && clickedCol === emptyCol) ||
    (Math.abs(clickedCol - emptyCol) === 1 && clickedRow === emptyRow);
  
  if (isAdjacent) {
    // Swap positions
    swapPieces(clickedIndex, emptyIndex);
    puzzleConfig.emptyIndex = clickedIndex;
    
    // Check if puzzle is solved
    if (checkPuzzleSolved()) {
      puzzleComplete();
    }
  }
}

// Swap two puzzle pieces
function swapPieces(index1, index2) {
  const piece1 = puzzleConfig.pieces[index1];
  const piece2 = puzzleConfig.pieces[index2];
  
  // Swap data attributes
  const tempIndex = piece1.dataset.index;
  piece1.dataset.index = piece2.dataset.index;
  piece2.dataset.index = tempIndex;
  
  // Swap empty attribute if needed
  if (piece1.dataset.empty === 'true') {
    piece1.dataset.empty = 'false';
    piece2.dataset.empty = 'true';
  } else if (piece2.dataset.empty === 'true') {
    piece2.dataset.empty = 'false';
    piece1.dataset.empty = 'true';
  }
  
  // Swap classes
  piece1.classList.toggle('empty');
  piece2.classList.toggle('empty');
  
  // Swap background if needed
  if (piece1.style.backgroundImage) {
    piece2.style.backgroundImage = piece1.style.backgroundImage;
    piece2.style.backgroundPosition = piece1.style.backgroundPosition;
    piece1.style.backgroundImage = '';
    piece1.style.backgroundPosition = '';
  } else if (piece2.style.backgroundImage) {
    piece1.style.backgroundImage = piece2.style.backgroundImage;
    piece1.style.backgroundPosition = piece2.style.backgroundPosition;
    piece2.style.backgroundImage = '';
    piece2.style.backgroundPosition = '';
  }
}

// Check if puzzle is solved
function checkPuzzleSolved() {
  for (let i = 0; i < puzzleConfig.pieces.length; i++) {
    const piece = puzzleConfig.pieces[i];
    if (piece.dataset.empty === 'true') continue;
    
    if (parseInt(piece.dataset.index) !== parseInt(piece.dataset.correctIndex)) {
      return false;
    }
  }
  return true;
}

// Handle puzzle completion
function puzzleComplete() {
  puzzleConfig.isPlaying = false;
  clearInterval(puzzleConfig.timerInterval);
  
  // Update best time
  if (puzzleConfig.timer < puzzleConfig.bestTime) {
    puzzleConfig.bestTime = puzzleConfig.timer;
    elements.bestTimeDisplay.textContent = `Best: ${formatTime(puzzleConfig.bestTime)}`;
  }
  
  // Update fastest time (stored in localStorage)
  if (puzzleConfig.timer < puzzleConfig.fastestTime) {
    puzzleConfig.fastestTime = puzzleConfig.timer;
    elements.fastestTimeDisplay.textContent = `Fastest: ${formatTime(puzzleConfig.fastestTime)}`;
    try {
      localStorage.setItem('puzzleFastestTime', puzzleConfig.fastestTime);
    } catch (e) {
      console.log('LocalStorage not available');
    }
  }
  
  // Show win message
  elements.finalTime.textContent = formatTime(puzzleConfig.timer);
  elements.winMessage.style.display = 'block';
}

// Update timer display
function updateTimerDisplay() {
  elements.timerDisplay.textContent = `Time: ${formatTime(puzzleConfig.timer)}`;
}

// Format time as MM:SS
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Load fastest time from localStorage
function loadFastestTime() {
  try {
    const storedTime = localStorage.getItem('puzzleFastestTime');
    if (storedTime) {
      puzzleConfig.fastestTime = parseInt(storedTime);
      elements.fastestTimeDisplay.textContent = `Fastest: ${formatTime(puzzleConfig.fastestTime)}`;
    }
  } catch (e) {
    console.log('LocalStorage not available');
  }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);