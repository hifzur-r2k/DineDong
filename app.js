/**
 * DINEDONG - Minimal Modern Restaurant Web Application
 * Ultra-Clean 3D Circular Food Ring with Hollow-Center Centerpiece Card
 */

import { DISHES, FALLBACK_IMAGE_URL, getThumbnailUrl, getHighResUrl } from './dishes.js';

// ============================================================================
// State Management
// ============================================================================
const state = {
  orderMode: 'dine-in', // 'dine-in' | 'takeout'
  dietFilter: 'all',    // 'all' | 'veg' | 'non-veg'
  cart: new Map(),      // dishId -> { dish, quantity }
  currentAngle: 0,      // in degrees
  rotationSpeed: 0.065, // degrees per frame (base anti-clockwise speed)
  currentSpeed: 0.065,  // dynamically damped angular velocity (350ms deceleration)
  isPaused: false,
  isManualPaused: false,
  isDragging: false,
  dragStartX: 0,
  dragStartAngle: 0,
  dragVelocity: 0,
  dragDistance: 0,
  isPinnedByClick: false,
  isLocked: false,
  lockedDish: null,
  hoveredDish: null,
  isCenterpieceHovered: false,
  lastDragX: 0,
  lastDragTime: 0,
  currentFrontIndex: 0,
  centerpieceActiveDish: null,
  soundEnabled: false,
  audioCtx: null,
  isTargetAnimating: false,
  targetAngle: 0,
};

function getFilteredDishes() {
  if (state.dietFilter === 'veg') return DISHES.filter(d => d.veg);
  if (state.dietFilter === 'non-veg') return DISHES.filter(d => !d.veg);
  return DISHES;
}

let currentDishes = DISHES;
let totalCards = currentDishes.length;
let angleStep = 360 / totalCards;

// ============================================================================
// DOM Elements
// ============================================================================
const els = {
  ringViewport: document.getElementById('ringViewport'),
  ringStage: document.getElementById('ringStage'),
  ringRotator: document.getElementById('ringRotator'),
  
  // Decluttered Hero Spotlight
  heroSpotlight: document.getElementById('heroSpotlight'),
  spotlightTitle: document.getElementById('spotlightTitle'),
  spotlightFlavorNote: document.getElementById('spotlightFlavorNote'),
  spotlightPrice: document.getElementById('spotlightPrice'),
  spotlightAddBtn: document.getElementById('spotlightAddBtn'),

  // Mode Toggle
  modePill: document.getElementById('modePill'),
  btnDineIn: document.getElementById('btnDineIn'),
  btnTakeout: document.getElementById('btnTakeout'),

  // Sleek Tall Centerpiece Dish Showcase
  centerpieceCard: document.getElementById('centerpieceCard'),
  centerpieceDietBadge: document.getElementById('centerpieceDietBadge'),
  centerpieceImgA: document.getElementById('centerpieceImgA'),
  centerpieceImgB: document.getElementById('centerpieceImgB'),
  centerpieceImg: document.getElementById('centerpieceImg'),
  centerpiecePrice: document.getElementById('centerpiecePrice'),
  centerpieceAddBtn: document.getElementById('centerpieceAddBtn'),
  centerpieceStepper: document.getElementById('centerpieceStepper'),
  centerpieceMinusBtn: document.getElementById('centerpieceMinusBtn'),
  centerpiecePlusBtn: document.getElementById('centerpiecePlusBtn'),
  centerpieceQtyVal: document.getElementById('centerpieceQtyVal'),
  centerpieceCloseBtn: document.getElementById('centerpieceCloseBtn'),

  // Compact Floating Blinkit-Style "View Cart" Pill
  floatingCartPill: document.getElementById('floatingCartPill'),
  cartPillThumbs: document.getElementById('cartPillThumbs'),
  cartPillSub: document.getElementById('cartPillSub'),

  // Controls Bar & Curated Diet Pill
  dietFilterPill: document.getElementById('dietFilterPill'),
  dietFilterBtns: document.querySelectorAll('.diet-filter-btn'),
  btnPauseRotation: document.getElementById('btnPauseRotation'),
  pauseIcon: document.getElementById('pauseIcon'),
  playIcon: document.getElementById('playIcon'),
  pauseBtnLabel: document.getElementById('pauseBtnLabel'),
  btnPrevDish: document.getElementById('btnPrevDish'),
  btnNextDish: document.getElementById('btnNextDish'),

  // Order Drawer (Cart)
  openOrderBtn: document.getElementById('openOrderBtn'),
  orderCountBadge: document.getElementById('orderCountBadge'),
  orderNavSubtotal: document.getElementById('orderNavSubtotal'),
  orderDrawer: document.getElementById('orderDrawer'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  drawerCloseBtn: document.getElementById('drawerCloseBtn'),
  drawerItemCountSubtitle: document.getElementById('drawerItemCountSubtitle'),
  drawerActiveModeLabel: document.getElementById('drawerActiveModeLabel'),
  drawerEstTime: document.getElementById('drawerEstTime'),
  drawerItemsList: document.getElementById('drawerItemsList'),
  billSubtotal: document.getElementById('billSubtotal'),
  billGst: document.getElementById('billGst'),
  billPackagingRow: document.getElementById('billPackagingRow'),
  billPackagingLabel: document.getElementById('billPackagingLabel'),
  billPackagingAmount: document.getElementById('billPackagingAmount'),
  billTotal: document.getElementById('billTotal'),
  checkoutBtn: document.getElementById('checkoutBtn'),

  // Receipt Modal
  receiptModalBackdrop: document.getElementById('receiptModalBackdrop'),
  receiptOrderId: document.getElementById('receiptOrderId'),
  receiptCloseBtn: document.getElementById('receiptCloseBtn'),

  // Search Modal (Desktop)
  openSearchBtn: document.getElementById('openSearchBtn'),
  searchModalBackdrop: document.getElementById('searchModalBackdrop'),
  searchCloseBtn: document.getElementById('searchCloseBtn'),
  dishSearchInput: document.getElementById('dishSearchInput'),
  searchResultsList: document.getElementById('searchResultsList'),

  // Sound Toggle
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  soundOnIcon: document.getElementById('soundOnIcon'),
  soundOffIcon: document.getElementById('soundOffIcon')
};

// ============================================================================
// Sound FX (Web Audio API Synthesizers)
// ============================================================================
function initAudio() {
  if (!state.audioCtx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) state.audioCtx = new AudioCtx();
  }
}

function playTickSound() {
  if (!state.soundEnabled || !state.audioCtx) return;
  try {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, state.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, state.audioCtx.currentTime + 0.02);
    gain.gain.setValueAtTime(0.03, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.02);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.02);
  } catch (err) {}
}

function playChimeSound() {
  if (!state.soundEnabled || !state.audioCtx) return;
  try {
    const osc = state.audioCtx.createOscillator();
    const gain = state.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, state.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(720, state.audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.07, state.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, state.audioCtx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(state.audioCtx.destination);
    osc.start();
    osc.stop(state.audioCtx.currentTime + 0.16);
  } catch (err) {}
}

// ============================================================================
// Responsive Proportioned Ring Radius (No PC or Mobile Clipping)
// ============================================================================
function getRingRadius() {
  const w = window.innerWidth;
  if (w < 380) return 225;
  if (w < 500) return 250;
  if (w < 768) return 280;
  if (w < 1024) return 320;
  if (w < 1440) return 360;
  return 390;
}

// ============================================================================
// 3D Ring Generation (Pure Photos with Double-Sided Orientation)
// ============================================================================
const cardElements = [];

function buildFoodRing() {
  els.ringRotator.innerHTML = '';
  cardElements.length = 0;
  const radius = getRingRadius();

  currentDishes.forEach((dish, idx) => {
    const baseAngle = idx * angleStep; // degrees around circle
    
    const card = document.createElement('div');
    card.className = 'food-card';
    card.id = `food-card-${dish.id}`;
    card.dataset.index = idx;
    card.dataset.dishId = dish.id;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${dish.name}, ₹${dish.price}`);

    card.style.transform = `rotateY(${baseAngle}deg) translateZ(${radius}px)`;

    const thumbUrl = getThumbnailUrl(dish.imageId);

    // Pure borderless photo with double-sided orientation and rock-solid fallback
    card.innerHTML = `
      <div class="food-card-inner">
        <div class="card-face card-front">
          <img src="${thumbUrl}" alt="${dish.name}" class="card-img" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE_URL}'" />
          <span class="card-cart-badge" style="display:none;"></span>
        </div>
        <div class="card-face card-back">
          <img src="${thumbUrl}" alt="${dish.name}" class="card-img" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE_URL}'" />
          <span class="card-cart-badge" style="display:none;"></span>
        </div>
      </div>
    `;

    // Hover (Desktop)
    card.addEventListener('mouseenter', () => {
      if (window.innerWidth >= 640 && !state.isPinnedByClick) {
        lockOnDish(dish, false);
      }
    });

    card.addEventListener('mouseleave', () => {
      if (window.innerWidth >= 640 && !state.isPinnedByClick) {
        checkDismissHover();
      }
    });

    // Tap / Click (Mobile & Desktop) - clean tap locks onto card
    card.addEventListener('click', (e) => {
      if (state.dragDistance > 6) return;
      e.stopPropagation();
      lockOnDish(dish, true);
    });

    els.ringRotator.appendChild(card);
    cardElements.push(card);
  });

  els.ringStage.style.transform = `rotateX(-18deg)`;
  updatePlatedCenterpiece(currentDishes[state.currentFrontIndex] || currentDishes[0]);
  updateActiveCardHighlight();
  updateRingCartBadges();
}

function updateRingCartBadges() {
  cardElements.forEach(card => {
    const dishId = card.dataset.dishId;
    const cartItem = state.cart.get(dishId);
    const badges = card.querySelectorAll('.card-cart-badge');
    badges.forEach(b => {
      if (cartItem && cartItem.quantity > 0) {
        b.textContent = cartItem.quantity;
        b.style.display = 'flex';
      } else {
        b.style.display = 'none';
      }
    });
  });
}

// Window resize handler: update ring radius
window.addEventListener('resize', () => {
  const radius = getRingRadius();
  cardElements.forEach((card, idx) => {
    const baseAngle = idx * angleStep;
    card.style.transform = `rotateY(${baseAngle}deg) translateZ(${radius}px)`;
  });
});

// ============================================================================
// Hero Spotlight Sync (Clean, Instant In-Place Text Updates)
// ============================================================================
function updateHeroSpotlight(dish) {
  if (!dish) return;
  els.spotlightTitle.textContent = dish.name;
  els.spotlightFlavorNote.textContent = dish.flavorNote;
  els.spotlightPrice.textContent = `₹${dish.price}`;
}

// ============================================================================
// Single Enlarged Card Rule (Front OR Clicked, Never Both)
// ============================================================================
function updateActiveCardHighlight() {
  let activeHighlightIndex = -1;
  const activeDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish;
  if (activeDish) {
    activeHighlightIndex = currentDishes.findIndex(d => d.id === activeDish.id);
  } else {
    activeHighlightIndex = state.currentFrontIndex;
  }

  cardElements.forEach((card, idx) => {
    if (idx === activeHighlightIndex) {
      card.classList.add('is-active-enlarged');
    } else {
      card.classList.remove('is-active-enlarged');
    }
    card.classList.remove('is-hovered', 'is-front-center');
  });
}

function highlightFrontCard(frontIndex) {
  updateActiveCardHighlight();
}

// ============================================================================
// Continuous Anti-Clockwise Animation Loop
// ============================================================================
let lastFrameTime = performance.now();

function animationLoop(timestamp) {
  const dt = Math.min((timestamp - lastFrameTime) / 16.667, 2.5);
  lastFrameTime = timestamp;

  if (state.isTargetAnimating) {
    const diff = state.targetAngle - state.currentAngle;
    if (Math.abs(diff) < 0.2) {
      state.currentAngle = state.targetAngle;
      state.isTargetAnimating = false;
      if (!state.isManualPaused && !state.isLocked && !state.isPinnedByClick && !state.isCenterpieceHovered) {
        state.isPaused = false;
      }
    } else {
      state.currentAngle += diff * 0.08 * dt;
    }
  } else if (!state.isDragging) {
    // Ring Deceleration: Smooth and immediate (~150ms deceleration)
    const shouldRotate = !state.isPaused && !state.isManualPaused && !state.isLocked && !state.hoveredDish && !state.isCenterpieceHovered;
    const targetSpeed = shouldRotate ? state.rotationSpeed : 0;

    if (targetSpeed === 0) {
      // Snappy deceleration over ~150ms
      state.currentSpeed += (0 - state.currentSpeed) * Math.min(0.35 * dt, 1);
      if (Math.abs(state.currentSpeed) < 0.001) state.currentSpeed = 0;
    } else {
      // Responsive re-acceleration
      state.currentSpeed += (targetSpeed - state.currentSpeed) * Math.min(0.25 * dt, 1);
    }

    if (state.currentSpeed > 0.0001) {
      state.currentAngle -= state.currentSpeed * dt;
    }

    if (Math.abs(state.dragVelocity) > 0.01) {
      state.currentAngle += state.dragVelocity * dt;
      state.dragVelocity *= Math.pow(0.92, dt);
    } else {
      state.dragVelocity = 0;
    }
  }

  els.ringRotator.style.transform = `rotateY(${state.currentAngle}deg)`;

  // Front-Card Angle Tracking
  let normalized = (-state.currentAngle) % 360;
  if (normalized < 0) normalized += 360;
  const frontIdx = Math.round(normalized / angleStep) % totalCards;

  if (frontIdx !== state.currentFrontIndex) {
    state.currentFrontIndex = frontIdx;
    if (!state.isLocked && !state.hoveredDish && !state.isCenterpieceHovered) {
      const frontDish = currentDishes[frontIdx] || currentDishes[0];
      updateHeroSpotlight(frontDish);
      updatePlatedCenterpiece(frontDish);
    }
    updateActiveCardHighlight();
    playTickSound();
  }

  requestAnimationFrame(animationLoop);
}

// ============================================================================
// Tall Centerpiece Dish Showcase (with Single Veg/Non-Veg Icon, Price & Add Button)
// ============================================================================
let currentPlateImg = 'a';
let currentPlateDishId = null;
let hoverDismissTimer = null;

// Dynamic Add Button & Stepper state synced with Order Cart
function updateCenterpieceAddButton(dish) {
  if (!dish) return;
  const inCart = state.cart.get(dish.id);
  const qty = inCart ? inCart.quantity : 0;

  if (qty > 0) {
    if (els.centerpieceAddBtn) {
      els.centerpieceAddBtn.style.display = 'none';
    }
    if (els.centerpieceStepper) {
      els.centerpieceStepper.style.display = 'inline-flex';
      if (els.centerpieceQtyVal) {
        els.centerpieceQtyVal.textContent = qty;
      }
      els.centerpieceStepper.setAttribute('aria-label', `${dish.name}: ${qty} in order. Adjust quantity`);
    }
  } else {
    if (els.centerpieceStepper) {
      els.centerpieceStepper.style.display = 'none';
    }
    if (els.centerpieceAddBtn) {
      els.centerpieceAddBtn.style.display = 'inline-flex';
      els.centerpieceAddBtn.innerHTML = `<span>+ Add</span>`;
      els.centerpieceAddBtn.classList.remove('has-items');
      els.centerpieceAddBtn.setAttribute('aria-label', `Add ${dish.name} to Order`);
    }
  }
}

function updatePlatedCenterpiece(dish) {
  if (!dish) return;
  state.centerpieceActiveDish = dish;
  
  // Update single Veg / Non-Veg Icon Badge
  if (els.centerpieceDietBadge) {
    if (dish.veg) {
      els.centerpieceDietBadge.className = 'centerpiece-diet-badge veg';
      els.centerpieceDietBadge.setAttribute('title', 'Vegetarian');
      els.centerpieceDietBadge.setAttribute('aria-label', 'Vegetarian');
    } else {
      els.centerpieceDietBadge.className = 'centerpiece-diet-badge non-veg';
      els.centerpieceDietBadge.setAttribute('title', 'Non-Vegetarian');
      els.centerpieceDietBadge.setAttribute('aria-label', 'Non-Vegetarian');
    }
  }

  // Update Price directly on the image
  if (els.centerpiecePrice) {
    els.centerpiecePrice.textContent = `₹${dish.price}`;
  }

  // Update Add Button label & quantity indicator
  updateCenterpieceAddButton(dish);

  if (dish.id === currentPlateDishId) return;
  currentPlateDishId = dish.id;

  const nextImg = currentPlateImg === 'a' ? els.centerpieceImgB : els.centerpieceImgA;
  const prevImg = currentPlateImg === 'a' ? els.centerpieceImgA : els.centerpieceImgB;

  const imgUrl = getHighResUrl(dish.imageId);
  if (nextImg && prevImg) {
    nextImg.src = imgUrl;
    nextImg.alt = dish.name;
    nextImg.classList.add('active');
    prevImg.classList.remove('active');
    currentPlateImg = currentPlateImg === 'a' ? 'b' : 'a';
  } else if (els.centerpieceImg) {
    els.centerpieceImg.src = imgUrl;
    els.centerpieceImg.alt = dish.name;
  }
}

function lockOnDish(dish, isClick = false) {
  clearTimeout(hoverDismissTimer);
  state.isPaused = true;
  state.currentSpeed = 0; // Immediately stop residual momentum
  if (isClick) {
    state.isPinnedByClick = true;
    state.isLocked = true;
    state.lockedDish = dish;
    state.hoveredDish = null;
  } else {
    state.hoveredDish = dish;
  }
  state.centerpieceActiveDish = dish;

  updateHeroSpotlight(dish);
  updatePlatedCenterpiece(dish);
  updateActiveCardHighlight();
}

function unlockAndResume() {
  clearTimeout(hoverDismissTimer);
  state.isPinnedByClick = false;
  state.isLocked = false;
  state.lockedDish = null;
  state.hoveredDish = null;
  state.centerpieceActiveDish = null;
  state.isCenterpieceHovered = false;

  if (!state.isManualPaused) {
    state.isPaused = false;
  }

  // Restore Hero Spotlight and Plated Showcase to current front-center card
  const frontDish = currentDishes[state.currentFrontIndex] || currentDishes[0];
  updateHeroSpotlight(frontDish);
  updatePlatedCenterpiece(frontDish);
  updateActiveCardHighlight();
}

function checkDismissHover() {
  if (state.isPinnedByClick || state.isLocked) return;
  clearTimeout(hoverDismissTimer);
  hoverDismissTimer = setTimeout(() => {
    if (state.isPinnedByClick || state.isLocked) return;
    const hasCardHover = !!els.ringViewport.querySelector('.food-card:hover');
    const hasCenterpieceHover = !!els.centerpieceCard && (els.centerpieceCard.matches(':hover') || state.isCenterpieceHovered);
    if (!hasCardHover && !hasCenterpieceHover) {
      unlockAndResume();
    }
  }, 220);
}

// Centerpiece Card Desktop Hover & Interaction:
// When cursor enters the big image, rotation freezes immediately so the user can easily click "+ Add"
if (els.centerpieceCard) {
  els.centerpieceCard.addEventListener('mouseenter', () => {
    clearTimeout(hoverDismissTimer);
    state.isCenterpieceHovered = true;
    state.isPaused = true;
    state.currentSpeed = 0;
    const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
    if (currentDish) {
      state.centerpieceActiveDish = currentDish;
      updateHeroSpotlight(currentDish);
      updatePlatedCenterpiece(currentDish);
      updateActiveCardHighlight();
    }
  });

  els.centerpieceCard.addEventListener('mouseleave', () => {
    state.isCenterpieceHovered = false;
    if (!state.isPinnedByClick && !state.isLocked) {
      checkDismissHover();
    }
  });

  // Click on centerpiece card image to toggle lock or unlock
  els.centerpieceCard.addEventListener('click', (e) => {
    // If clicking on Add Button, Stepper, or inside bottom bar, don't toggle lock
    if (e.target.closest('#centerpieceAddBtn') || e.target.closest('#centerpieceStepper') || e.target.closest('.centerpiece-bottom-bar')) return;
    e.stopPropagation();
    if (state.isLocked || state.hoveredDish) {
      unlockAndResume();
    } else {
      const targetDish = state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
      lockOnDish(targetDish, true);
    }
  });
}

// Centerpiece Add Button: adds active/featured dish directly to order
if (els.centerpieceAddBtn) {
  els.centerpieceAddBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
    if (!currentDish) return;

    // Pin and lock firmly onto this dish so ring stays strictly paused
    state.isPinnedByClick = true;
    state.isLocked = true;
    state.isPaused = true;
    state.currentSpeed = 0;
    state.lockedDish = currentDish;
    state.centerpieceActiveDish = currentDish;

    // Add 1 of this dish to the order
    addToOrder(currentDish, 1);

    // Keep active card highlight firmly on this dish
    updateActiveCardHighlight();

    // Tactile button bounce feedback
    els.centerpieceAddBtn.classList.remove('tap-bump');
    void els.centerpieceAddBtn.offsetWidth;
    els.centerpieceAddBtn.classList.add('tap-bump');
  });
}

// Centerpiece Stepper Plus Button (+): increments quantity directly on centerpiece
if (els.centerpiecePlusBtn) {
  els.centerpiecePlusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
    if (!currentDish) return;

    state.isPinnedByClick = true;
    state.isLocked = true;
    state.isPaused = true;
    state.currentSpeed = 0;
    state.lockedDish = currentDish;
    state.centerpieceActiveDish = currentDish;

    addToOrder(currentDish, 1);
    updateActiveCardHighlight();

    if (els.centerpieceStepper) {
      els.centerpieceStepper.classList.remove('tap-bump');
      void els.centerpieceStepper.offsetWidth;
      els.centerpieceStepper.classList.add('tap-bump');
    }
  });
}

// Centerpiece Stepper Minus Button (−): decrements quantity or removes directly from centerpiece
if (els.centerpieceMinusBtn) {
  els.centerpieceMinusBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
    if (!currentDish) return;

    state.isPinnedByClick = true;
    state.isLocked = true;
    state.isPaused = true;
    state.currentSpeed = 0;
    state.lockedDish = currentDish;
    state.centerpieceActiveDish = currentDish;

    updateItemQuantity(currentDish.id, -1);
    updateActiveCardHighlight();

    if (els.centerpieceStepper) {
      els.centerpieceStepper.classList.remove('tap-bump');
      void els.centerpieceStepper.offsetWidth;
      els.centerpieceStepper.classList.add('tap-bump');
    }
  });
}

// Optional Close button if present in DOM
if (els.centerpieceCloseBtn) {
  els.centerpieceCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAndResume();
  });
}

// Dismiss / unlock when clicking anywhere outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#centerpieceCard') && 
      !e.target.closest('.food-card') && 
      !e.target.closest('.ctrl-circle-btn') && 
      !e.target.closest('.order-drawer') && 
      !e.target.closest('.cart-nav-btn') &&
      !e.target.closest('#floatingCartPill')) {
    if (state.isLocked || state.hoveredDish || state.isPinnedByClick) {
      unlockAndResume();
    }
  }
});

// Spotlight Hero Add Button (fallback if triggered)
if (els.spotlightAddBtn) {
  els.spotlightAddBtn.addEventListener('click', () => {
    const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
    if (currentDish) {
      state.isPinnedByClick = true;
      state.isLocked = true;
      state.isPaused = true;
      state.currentSpeed = 0;
      state.lockedDish = currentDish;
      state.centerpieceActiveDish = currentDish;
      addToOrder(currentDish, 1);
      updateActiveCardHighlight();
    }
  });
}

// ============================================================================
// Drag & Swipe Interaction
// ============================================================================
els.ringViewport.addEventListener('pointerdown', (e) => {
  if (e.target.closest('#centerpieceCard') || e.target.closest('.ctrl-btn') || e.target.closest('.ctrl-circle-btn')) return;

  state.isDragging = true;
  state.isPaused = true;
  state.currentSpeed = 0;
  state.dragStartX = e.clientX;
  state.dragStartAngle = state.currentAngle;
  state.lastDragX = e.clientX;
  state.lastDragTime = performance.now();
  state.dragVelocity = 0;
  state.dragDistance = 0;

  els.ringViewport.classList.add('is-dragging');
});

window.addEventListener('pointermove', (e) => {
  if (!state.isDragging) return;

  const now = performance.now();
  const dt = now - state.lastDragTime;
  const deltaX = e.clientX - state.dragStartX;
  state.dragDistance = Math.abs(deltaX);
  
  const sensitivity = 0.18;
  state.currentAngle = state.dragStartAngle + (deltaX * sensitivity);

  if (dt > 10) {
    const stepDx = e.clientX - state.lastDragX;
    state.dragVelocity = (stepDx / dt) * 3.5;
    state.lastDragX = e.clientX;
    state.lastDragTime = now;
  }
});

window.addEventListener('pointerup', () => {
  if (!state.isDragging) return;
  state.isDragging = false;
  els.ringViewport.classList.remove('is-dragging');

  if (state.isManualPaused || state.isLocked || state.hoveredDish) {
    state.isPaused = true;
  } else {
    state.isPaused = false;
  }
});

window.addEventListener('pointercancel', () => {
  state.isDragging = false;
  els.ringViewport.classList.remove('is-dragging');
  if (!state.isManualPaused && !state.isLocked && !state.hoveredDish) {
    state.isPaused = false;
  }
});

// ============================================================================
// Showcase Controls
// ============================================================================
els.btnPauseRotation.addEventListener('click', () => {
  state.isManualPaused = !state.isManualPaused;
  state.isPaused = state.isManualPaused;

  if (state.isManualPaused) {
    els.pauseIcon.style.display = 'none';
    els.playIcon.style.display = 'block';
    if (els.pauseBtnLabel) els.pauseBtnLabel.textContent = 'Play';
    els.btnPauseRotation.classList.add('active');
    els.btnPauseRotation.setAttribute('title', 'Resume Rotation');
    els.btnPauseRotation.setAttribute('aria-label', 'Resume Rotation');
  } else {
    els.pauseIcon.style.display = 'block';
    els.playIcon.style.display = 'none';
    if (els.pauseBtnLabel) els.pauseBtnLabel.textContent = 'Pause';
    els.btnPauseRotation.classList.remove('active');
    els.btnPauseRotation.setAttribute('title', 'Pause Rotation');
    els.btnPauseRotation.setAttribute('aria-label', 'Pause Rotation');
  }
});

function stepDish(direction) {
  if (state.isLocked || state.hoveredDish || state.centerpieceActiveDish) {
    unlockAndResume();
  }
  const targetIndex = (state.currentFrontIndex + direction + totalCards) % totalCards;
  rotateToDishIndex(targetIndex);
}

els.btnPrevDish.addEventListener('click', () => stepDish(-1));
els.btnNextDish.addEventListener('click', () => stepDish(1));

function rotateToDishIndex(targetIdx) {
  let desired = -(targetIdx * angleStep);
  const cycle = Math.round((state.currentAngle - desired) / 360);
  desired += cycle * 360;

  state.targetAngle = desired;
  state.isTargetAnimating = true;
  state.isPaused = true;
}

// ============================================================================
// Curated Diet Filter System (All / Veg / Non-Veg)
// ============================================================================
function setDietFilter(filter) {
  if (state.dietFilter === filter && filter !== 'all') {
    // Tapping the active filter toggles back to 'all'
    filter = 'all';
  }
  if (state.dietFilter === filter) return;

  state.dietFilter = filter;
  const newDishes = getFilteredDishes();
  const newTotal = newDishes.length;
  if (newTotal === 0) return;
  const newAngleStep = 360 / newTotal;

  // 1. Instantly update button UI state
  if (els.dietFilterBtns) {
    els.dietFilterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === filter;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // 2. Audio feedback
  initAudio();
  playChimeSound();

  // 3. Determine target front dish safely:
  // Check if current active/locked dish is present in the newly filtered list
  const currentActive = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish;
  let targetIndex = -1;
  if (currentActive) {
    targetIndex = newDishes.findIndex(d => d.id === currentActive.id);
  }

  if (targetIndex !== -1) {
    // Current dish exists in new filter: preserve it in front with shortest angular shift
    const targetAngle = -(targetIndex * newAngleStep);
    const diff = ((state.currentAngle - targetAngle) % 360 + 540) % 360 - 180;
    state.currentAngle = state.currentAngle - diff;
  } else {
    // Current dish does not belong to new filter: safely reset to first item
    targetIndex = 0;
    state.isLocked = false;
    state.isPinnedByClick = false;
    state.lockedDish = null;
    state.hoveredDish = null;
    state.currentAngle = 0;
  }

  // 4. Update data state
  currentDishes = newDishes;
  totalCards = newTotal;
  angleStep = newAngleStep;
  state.currentFrontIndex = targetIndex;
  state.targetAngle = state.currentAngle;
  state.isTargetAnimating = false;

  // 5. Rebuild 3D ring cards with preserved 3D circular geometry & radius
  buildFoodRing();

  // 6. Safely re-index hero spotlight & centerpiece showcase
  const frontDish = newDishes[targetIndex] || newDishes[0];
  state.centerpieceActiveDish = frontDish;
  if (state.isLocked) {
    state.lockedDish = frontDish;
  }
  updateHeroSpotlight(frontDish);
  updatePlatedCenterpiece(frontDish);
  updateActiveCardHighlight();
}

// Attach Diet Filter Listeners
if (els.dietFilterBtns) {
  els.dietFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setDietFilter(btn.dataset.filter);
    });
  });
}

// ============================================================================
// Dine-In / Takeout Mode Switcher
// ============================================================================
function setOrderMode(mode) {
  state.orderMode = mode;
  els.modePill.dataset.mode = mode;

  if (mode === 'dine-in') {
    els.btnDineIn.classList.add('active');
    els.btnTakeout.classList.remove('active');
    els.btnDineIn.setAttribute('aria-checked', 'true');
    els.btnTakeout.setAttribute('aria-checked', 'false');
    els.drawerActiveModeLabel.textContent = 'Dine-In (Table 04)';
    els.drawerEstTime.textContent = 'Est. 20-25 mins';
    els.billPackagingLabel.textContent = 'Table Service';
    els.billPackagingAmount.textContent = '₹0';
  } else {
    els.btnTakeout.classList.add('active');
    els.btnDineIn.classList.remove('active');
    els.btnTakeout.setAttribute('aria-checked', 'true');
    els.btnDineIn.setAttribute('aria-checked', 'false');
    els.drawerActiveModeLabel.textContent = 'Express Takeout (Pickup)';
    els.drawerEstTime.textContent = 'Est. 15-20 mins';
    els.billPackagingLabel.textContent = 'Packaging';
    els.billPackagingAmount.textContent = '₹30';
  }

  updateHeroSpotlight(currentDishes[state.currentFrontIndex] || currentDishes[0]);
  renderOrderDrawer();
}

els.btnDineIn.addEventListener('click', () => setOrderMode('dine-in'));
els.btnTakeout.addEventListener('click', () => setOrderMode('takeout'));

// ============================================================================
// Order Drawer (Cart Management)
// ============================================================================
function addToOrder(dish, qty = 1) {
  initAudio();
  playChimeSound();

  const existing = state.cart.get(dish.id);
  let totalForDish = qty;
  if (existing) {
    existing.quantity += qty;
    totalForDish = existing.quantity;
  } else {
    state.cart.set(dish.id, { dish, quantity: qty });
  }

  updateOrderBadge(true);
  renderOrderDrawer();
  updateCenterpieceAddButton(dish);
}

function updateItemQuantity(dishId, delta) {
  const item = state.cart.get(dishId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart.delete(dishId);
  }

  updateOrderBadge(delta > 0);
  renderOrderDrawer();

  const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
  if (currentDish && currentDish.id === dishId) {
    updateCenterpieceAddButton(currentDish);
  }
}

function removeItemFromOrder(dishId) {
  state.cart.delete(dishId);
  updateOrderBadge(false);
  renderOrderDrawer();

  const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
  if (currentDish && currentDish.id === dishId) {
    updateCenterpieceAddButton(currentDish);
  }
}

function updateOrderBadge(hasNewItemAdded = false) {
  let totalCount = 0;
  let subtotal = 0;

  state.cart.forEach(item => {
    totalCount += item.quantity;
    subtotal += item.dish.price * item.quantity;
  });

  els.orderCountBadge.textContent = totalCount;
  els.orderNavSubtotal.textContent = `₹${subtotal}`;

  els.orderCountBadge.classList.remove('bump');
  void els.orderCountBadge.offsetWidth;
  els.orderCountBadge.classList.add('bump');

  // Keep floating Blinkit-style cart pill and 3D ring badges in sync
  renderFloatingCartPill(hasNewItemAdded);
  updateRingCartBadges();
}

function renderOrderDrawer() {
  const items = Array.from(state.cart.values());
  const totalCount = items.reduce((sum, it) => sum + it.quantity, 0);

  els.drawerItemCountSubtitle.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'} selected`;

  if (items.length === 0) {
    els.drawerItemsList.innerHTML = `
      <div class="drawer-empty-state">
        <p style="font-weight: 500; color: var(--text-primary);">Your order is empty</p>
        <p style="font-size: 12px;">Tap any photo on the ring to curate your order.</p>
      </div>
    `;

    els.billSubtotal.textContent = '₹0';
    els.billGst.textContent = '₹0';
    els.billTotal.textContent = '₹0';
    els.checkoutBtn.disabled = true;
    return;
  }

  els.drawerItemsList.innerHTML = '';
  let subtotal = 0;

  items.forEach(({ dish, quantity }) => {
    const itemTotal = dish.price * quantity;
    subtotal += itemTotal;

    const row = document.createElement('div');
    row.className = 'drawer-item';
    row.innerHTML = `
      <img src="${getThumbnailUrl(dish.imageId)}" alt="${dish.name}" class="drawer-item-img" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE_URL}'" />
      <div class="drawer-item-info">
        <h4 class="drawer-item-title">${dish.name}</h4>
        <span class="drawer-item-price">₹${dish.price} &times; ${quantity}</span>
      </div>
      <div class="drawer-item-actions">
        <div class="item-qty-stepper">
          <button type="button" class="btn-item-minus" aria-label="Decrease">&minus;</button>
          <span>${quantity}</span>
          <button type="button" class="btn-item-plus" aria-label="Increase">&plus;</button>
        </div>
        <button type="button" class="item-delete-btn" title="Remove" aria-label="Remove Item">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    row.querySelector('.btn-item-minus').addEventListener('click', () => updateItemQuantity(dish.id, -1));
    row.querySelector('.btn-item-plus').addEventListener('click', () => updateItemQuantity(dish.id, 1));
    row.querySelector('.item-delete-btn').addEventListener('click', () => removeItemFromOrder(dish.id));

    els.drawerItemsList.appendChild(row);
  });

  const gst = Math.round(subtotal * 0.05);
  const packagingFee = state.orderMode === 'takeout' ? 30 : 0;
  const grandTotal = subtotal + gst + packagingFee;

  els.billSubtotal.textContent = `₹${subtotal}`;
  els.billGst.textContent = `₹${gst}`;
  els.billTotal.textContent = `₹${grandTotal}`;
  els.checkoutBtn.disabled = false;
}

// ============================================================================
// Compact Floating Blinkit-Style "View Cart" Pill
// ============================================================================
function renderFloatingCartPill(hasNewItemAdded = false) {
  if (!els.floatingCartPill) return;
  const items = Array.from(state.cart.values());

  if (items.length === 0) {
    els.floatingCartPill.style.display = 'none';
    els.floatingCartPill.classList.remove('is-visible', 'anim-enter', 'anim-pulse');
    if (els.cartPillThumbs) els.cartPillThumbs.innerHTML = '';
    return;
  }

  const wasHidden = els.floatingCartPill.style.display === 'none' || !els.floatingCartPill.classList.contains('is-visible');
  els.floatingCartPill.style.display = 'inline-flex';

  const totalItems = items.reduce((sum, it) => sum + it.quantity, 0);
  const totalPrice = items.reduce((sum, it) => sum + it.dish.price * it.quantity, 0);

  if (els.cartPillSub) {
    els.cartPillSub.textContent = `${totalItems} ${totalItems === 1 ? 'item' : 'items'} • ₹${totalPrice}`;
  }

  // Up to 3 overlapping circular thumbnails showing latest dishes added
  if (els.cartPillThumbs) {
    els.cartPillThumbs.innerHTML = '';
    const latestItems = items.slice().reverse().slice(0, 3);
    latestItems.forEach(it => {
      const img = document.createElement('img');
      img.src = getThumbnailUrl(it.dish.imageId);
      img.alt = it.dish.name;
      img.className = 'cart-pill-thumb';
      img.onerror = () => { img.src = FALLBACK_IMAGE_URL; };
      els.cartPillThumbs.appendChild(img);
    });
  }

  if (wasHidden) {
    els.floatingCartPill.classList.add('is-visible');
    els.floatingCartPill.classList.remove('anim-pulse');
    els.floatingCartPill.classList.remove('anim-enter');
    void els.floatingCartPill.offsetWidth;
    els.floatingCartPill.classList.add('anim-enter');
  } else if (hasNewItemAdded) {
    els.floatingCartPill.classList.remove('anim-pulse');
    void els.floatingCartPill.offsetWidth;
    els.floatingCartPill.classList.add('anim-pulse');
  }
}

if (els.floatingCartPill) {
  els.floatingCartPill.addEventListener('click', (e) => {
    e.stopPropagation();
    openDrawer();
  });
  els.floatingCartPill.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDrawer();
    }
  });
}

function openDrawer() {
  els.orderDrawer.classList.add('open');
  els.drawerBackdrop.classList.add('open');
  els.orderDrawer.setAttribute('aria-hidden', 'false');
  state.isPaused = true;
}

function closeDrawer() {
  els.orderDrawer.classList.remove('open');
  els.drawerBackdrop.classList.remove('open');
  els.orderDrawer.setAttribute('aria-hidden', 'true');
  if (!state.isManualPaused && !state.isLocked && !state.isPinnedByClick && !state.isCenterpieceHovered) {
    state.isPaused = false;
  }
}

els.openOrderBtn.addEventListener('click', openDrawer);
els.drawerCloseBtn.addEventListener('click', closeDrawer);
els.drawerBackdrop.addEventListener('click', closeDrawer);

els.checkoutBtn.addEventListener('click', () => {
  if (state.cart.size === 0) return;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  els.receiptOrderId.textContent = `ORDER #DD-${randomNum}`;

  closeDrawer();
  els.receiptModalBackdrop.classList.add('open');

  state.cart.clear();
  updateOrderBadge();
  renderOrderDrawer();

  const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
  if (currentDish) {
    updateCenterpieceAddButton(currentDish);
  }
});

els.receiptCloseBtn.addEventListener('click', () => {
  els.receiptModalBackdrop.classList.remove('open');
});

// ============================================================================
// Search Modal (Desktop)
// ============================================================================
function openSearch() {
  if (!els.searchModalBackdrop) return;
  els.searchModalBackdrop.classList.add('open');
  els.dishSearchInput.value = '';
  renderSearchResults('');
  els.dishSearchInput.focus();
  state.isPaused = true;
}

function closeSearch() {
  if (!els.searchModalBackdrop) return;
  els.searchModalBackdrop.classList.remove('open');
  if (!state.isManualPaused && !state.isLocked && !state.isPinnedByClick && !state.isCenterpieceHovered) {
    state.isPaused = false;
  }
}

function renderSearchResults(query) {
  const q = query.trim().toLowerCase();
  const filtered = DISHES.filter(d => 
    d.name.toLowerCase().includes(q) ||
    d.category.toLowerCase().includes(q) ||
    d.flavorNote.toLowerCase().includes(q)
  );

  els.searchResultsList.innerHTML = '';
  if (filtered.length === 0) {
    els.searchResultsList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No dishes found matching "${query}".
      </div>
    `;
    return;
  }

  filtered.forEach(dish => {
    const item = document.createElement('div');
    item.className = 'search-item';
    item.innerHTML = `
      <img src="${getThumbnailUrl(dish.imageId)}" alt="${dish.name}" class="search-item-img" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE_URL}'" />
      <div>
        <div class="search-item-title">${dish.name}</div>
        <div class="search-item-cat">${dish.category}</div>
      </div>
      <div class="search-item-price">₹${dish.price}</div>
    `;

    item.addEventListener('click', () => {
      closeSearch();
      // If dish is not in current diet filter, switch to 'all' so card is on ring
      if (!currentDishes.some(d => d.id === dish.id)) {
        setDietFilter('all');
      }
      setTimeout(() => {
        const dishIndex = currentDishes.findIndex(d => d.id === dish.id);
        if (dishIndex !== -1) {
          rotateToDishIndex(dishIndex);
          setTimeout(() => {
            lockOnDish(dish, true);
          }, 450);
        }
      }, 50);
    });

    els.searchResultsList.appendChild(item);
  });
}

if (els.openSearchBtn) els.openSearchBtn.addEventListener('click', openSearch);
if (els.searchCloseBtn) els.searchCloseBtn.addEventListener('click', closeSearch);
if (els.searchModalBackdrop) {
  els.searchModalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.searchModalBackdrop) closeSearch();
  });
}
if (els.dishSearchInput) {
  els.dishSearchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });
}

window.addEventListener('keydown', (e) => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    closeDrawer();
    unlockAndResume();
    els.receiptModalBackdrop.classList.remove('open');
  }
});

// ============================================================================
// Sound Chime Toggle
// ============================================================================
if (els.soundToggleBtn) {
  els.soundToggleBtn.addEventListener('click', () => {
    initAudio();
    state.soundEnabled = !state.soundEnabled;

    if (state.soundEnabled) {
      els.soundOnIcon.style.display = 'block';
      els.soundOffIcon.style.display = 'none';
      playChimeSound();
    } else {
      els.soundOnIcon.style.display = 'none';
      els.soundOffIcon.style.display = 'block';
    }
  });
}

// Message popup toast removed per user request
function showToast() {}

document.getElementById('brandHome').addEventListener('click', (e) => {
  e.preventDefault();
  setDietFilter('all');
  rotateToDishIndex(0);
});

// ============================================================================
// Global Error Image Fallback Handler
// ============================================================================
window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE_URL;
  }
}, true);

// ============================================================================
// Application Initialization
// ============================================================================
function init() {
  buildFoodRing();
  updateHeroSpotlight(DISHES[0]);
  highlightFrontCard(0);
  renderOrderDrawer();

  requestAnimationFrame(animationLoop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
