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
  tableNumber: '04',
  takeoutPickupTime: 'ASAP · 15m',
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
  spotlightCategory: document.getElementById('spotlightCategory'),
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

  // Order Drawer (Swiggy/Blinkit Grouped Card Stack UX)
  openOrderBtn: document.getElementById('openOrderBtn'),
  orderCountBadge: document.getElementById('orderCountBadge'),
  orderNavSubtotal: document.getElementById('orderNavSubtotal'),
  orderDrawer: document.getElementById('orderDrawer'),
  drawerBackdrop: document.getElementById('drawerBackdrop'),
  drawerCloseBtn: document.getElementById('drawerCloseBtn'),
  drawerCartView: document.getElementById('drawerCartView'),
  drawerReceiptView: document.getElementById('drawerReceiptView'),
  drawerCardStack: document.getElementById('drawerCardStack'),
  cartItemsCard: document.getElementById('cartItemsCard'),
  drawerItemsList: document.getElementById('drawerItemsList'),
  addMoreDivider: document.getElementById('addMoreDivider'),
  addMoreItemsBtn: document.getElementById('addMoreItemsBtn'),
  instructionsDivider: document.getElementById('instructionsDivider'),
  cookingInstructionsRow: document.getElementById('cookingInstructionsRow'),
  kitchenNoteInput: document.getElementById('kitchenNoteInput'),
  serviceCard: document.getElementById('serviceCard'),
  contextDineIn: document.getElementById('contextDineIn'),
  contextTakeout: document.getElementById('contextTakeout'),
  tableNumberInput: document.getElementById('tableNumberInput'),
  pickupPillsGroup: document.getElementById('pickupPillsGroup'),
  takeoutContactInput: document.getElementById('takeoutContactInput'),
  billDetailsCard: document.getElementById('billDetailsCard'),
  billSubtotal: document.getElementById('billSubtotal'),
  billGst: document.getElementById('billGst'),
  billPackagingRow: document.getElementById('billPackagingRow'),
  billPackagingLabel: document.getElementById('billPackagingLabel'),
  billPackagingAmount: document.getElementById('billPackagingAmount'),
  billTotal: document.getElementById('billTotal'),
  drawerFooter: document.getElementById('drawerFooter'),
  footerTotalVal: document.getElementById('footerTotalVal'),
  checkoutBtn: document.getElementById('checkoutBtn'),

  // Digital Receipt View Elements
  receiptTokenId: document.getElementById('receiptTokenId'),
  receiptMetaDetails: document.getElementById('receiptMetaDetails'),
  receiptItemsBreakdown: document.getElementById('receiptItemsBreakdown'),
  receiptNoteCallout: document.getElementById('receiptNoteCallout'),
  receiptBillSubtotal: document.getElementById('receiptBillSubtotal'),
  receiptBillGst: document.getElementById('receiptBillGst'),
  receiptPackagingRow: document.getElementById('receiptPackagingRow'),
  receiptPackagingAmount: document.getElementById('receiptPackagingAmount'),
  receiptBillTotal: document.getElementById('receiptBillTotal'),
  receiptWhatsAppBtn: document.getElementById('receiptWhatsAppBtn'),
  receiptNewOrderBtn: document.getElementById('receiptNewOrderBtn'),

  // Minimal Search Overlay
  openSearchBtn: document.getElementById('openSearchBtn'),
  searchModalBackdrop: document.getElementById('searchModalBackdrop'),
  searchPanel: document.getElementById('searchPanel'),
  searchCloseBtn: document.getElementById('searchCloseBtn'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  searchDietSwitch: document.getElementById('searchDietSwitch'),
  dishSearchInput: document.getElementById('dishSearchInput'),
  searchResultsList: document.getElementById('searchResultsList')
};

// ============================================================================
// Tactile Mobile Haptics Engine (navigator.vibrate) - No Audio
// ============================================================================
const haptics = {
  lastSpinTime: 0,
  lastTapTime: 0,

  // Subtle mechanical ratchet tick when manually spinning dishes
  spinTick(ms = 8) {
    const now = performance.now();
    // 30ms throttle prevents buzz blur and keeps each dish card notched
    if (now - this.lastSpinTime < 30) return;
    this.lastSpinTime = now;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (_) {}
  },

  // Firmer tactile bump for actions (+ Add, - / +, filters, card selection)
  tap(ms = 14) {
    const now = performance.now();
    if (now - this.lastTapTime < 45) return;
    this.lastTapTime = now;
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch (_) {}
  },

  // Celebratory multi-pulse haptic confirmation for placing an order
  success(pattern = [15, 50, 25]) {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
      }
    } catch (_) {}
  }
};

let lastWheelInteractionTime = 0;
let lastNavBtnInteractionTime = 0;
let lastHapticDishStep = 0;

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
      haptics.tap(10);
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
  if (els.spotlightCategory) {
    els.spotlightCategory.textContent = dish.category || 'Curated Offering';
  }
  if (els.spotlightTitle) {
    els.spotlightTitle.textContent = dish.name;
  }
  if (els.spotlightFlavorNote) {
    els.spotlightFlavorNote.textContent = dish.flavorNote || dish.description || '';
  }
  if (els.spotlightPrice) {
    els.spotlightPrice.textContent = `₹${dish.price}`;
  }
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

    // Tactile haptics ONLY during manual user interaction:
    // (dragging/swiping, mouse wheel scroll, or tapping < / > buttons)
    // Never fires during passive background auto-rotation
    const isUserActive = state.isDragging || 
                         (performance.now() - lastWheelInteractionTime < 400) ||
                         (performance.now() - lastNavBtnInteractionTime < 800);

    if (isUserActive) {
      haptics.spinTick(8);
    }
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
  lastHapticDishStep = Math.round((-state.currentAngle) / angleStep);

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

  // Tactile haptics when manually spinning/dragging:
  const currentStep = Math.round((-state.currentAngle) / angleStep);
  if (currentStep !== lastHapticDishStep) {
    lastHapticDishStep = currentStep;
    haptics.spinTick(7);
  }

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

// Desktop Trackpad & Mouse Wheel Horizontal Swipes into Ring Rotation
els.ringViewport.addEventListener('wheel', (e) => {
  let delta = 0;
  if (Math.abs(e.deltaX) >= Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0.5) {
    delta = -e.deltaX;
    e.preventDefault();
  } else if (e.shiftKey && Math.abs(e.deltaY) > 0.5) {
    delta = -e.deltaY;
    e.preventDefault();
  } else if (Math.abs(e.deltaY) > 1.0) {
    delta = -e.deltaY * 0.45;
    e.preventDefault();
  } else {
    return;
  }

  lastWheelInteractionTime = performance.now();

  if (state.isLocked || state.hoveredDish || state.centerpieceActiveDish) {
    unlockAndResume();
  }

  state.currentAngle += delta * 0.15;
  const currentStep = Math.round((-state.currentAngle) / angleStep);
  if (currentStep !== lastHapticDishStep) {
    lastHapticDishStep = currentStep;
    haptics.spinTick(7);
  }
}, { passive: false });

// ============================================================================
// Showcase Controls
// ============================================================================
els.btnPauseRotation.addEventListener('click', () => {
  haptics.tap(10);
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
  lastNavBtnInteractionTime = performance.now();
  haptics.spinTick(12);
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

  // 2. Tactile haptic feedback
  haptics.tap(12);

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
// Smart Dine-In / Takeout Context & Mode Switcher
// ============================================================================
function initOrderContext() {
  // Read ?table=X from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const tableParam = urlParams.get('table');
  if (tableParam) {
    const cleanTable = tableParam.trim();
    if (cleanTable) {
      state.tableNumber = cleanTable;
      if (els.tableNumberInput) {
        els.tableNumberInput.value = cleanTable;
      }
    }
  } else if (els.tableNumberInput) {
    state.tableNumber = els.tableNumberInput.value.trim() || '04';
  }

  if (els.tableNumberInput) {
    els.tableNumberInput.addEventListener('input', (e) => {
      state.tableNumber = e.target.value.trim() || '04';
      if (state.orderMode === 'dine-in' && els.drawerActiveModeLabel) {
        els.drawerActiveModeLabel.textContent = `Dine-In (Table ${state.tableNumber})`;
      }
    });
  }

  if (els.pickupPillsGroup) {
    const pills = els.pickupPillsGroup.querySelectorAll('.pickup-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        haptics.tap(10);
        pills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-checked', 'false');
        });
        pill.classList.add('active');
        pill.setAttribute('aria-checked', 'true');
        state.takeoutPickupTime = pill.dataset.time || 'ASAP · 15m';
        if (state.orderMode === 'takeout' && els.drawerActiveModeLabel) {
          els.drawerActiveModeLabel.textContent = `Takeout (${state.takeoutPickupTime})`;
        }
      });
    });
  }
}

function setOrderMode(mode) {
  state.orderMode = mode;
  if (els.modePill) els.modePill.dataset.mode = mode;

  if (mode === 'dine-in') {
    if (els.btnDineIn) {
      els.btnDineIn.classList.add('active');
      els.btnDineIn.setAttribute('aria-checked', 'true');
    }
    if (els.btnTakeout) {
      els.btnTakeout.classList.remove('active');
      els.btnTakeout.setAttribute('aria-checked', 'false');
    }
    const tableStr = state.tableNumber ? `Table ${state.tableNumber}` : 'Table 04';
    if (els.drawerActiveModeLabel) els.drawerActiveModeLabel.textContent = `Dine-In (${tableStr})`;
    if (els.contextDineIn) els.contextDineIn.style.display = 'flex';
    if (els.contextTakeout) els.contextTakeout.style.display = 'none';
    if (els.billPackagingRow) els.billPackagingRow.style.display = 'none';
    if (els.billPackagingLabel) els.billPackagingLabel.textContent = 'Table Service';
    if (els.billPackagingAmount) els.billPackagingAmount.textContent = '₹0';
  } else {
    if (els.btnTakeout) {
      els.btnTakeout.classList.add('active');
      els.btnTakeout.setAttribute('aria-checked', 'true');
    }
    if (els.btnDineIn) {
      els.btnDineIn.classList.remove('active');
      els.btnDineIn.setAttribute('aria-checked', 'false');
    }
    const pickupStr = state.takeoutPickupTime || 'ASAP · 15m';
    if (els.drawerActiveModeLabel) els.drawerActiveModeLabel.textContent = `Takeout (${pickupStr})`;
    if (els.contextDineIn) els.contextDineIn.style.display = 'none';
    if (els.contextTakeout) els.contextTakeout.style.display = 'flex';
    if (els.billPackagingRow) els.billPackagingRow.style.display = 'flex';
    if (els.billPackagingLabel) els.billPackagingLabel.textContent = 'Eco Packaging';
    if (els.billPackagingAmount) els.billPackagingAmount.textContent = '₹30';
  }

  updateHeroSpotlight(currentDishes[state.currentFrontIndex] || currentDishes[0]);
  renderOrderDrawer();
}

els.btnDineIn.addEventListener('click', () => {
  haptics.tap(10);
  setOrderMode('dine-in');
});
els.btnTakeout.addEventListener('click', () => {
  haptics.tap(10);
  setOrderMode('takeout');
});

// ============================================================================
// Order Drawer (Cart Management)
// ============================================================================
function addToOrder(dish, qty = 1) {
  haptics.tap(14);

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

  haptics.tap(10);

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
  haptics.tap(12);
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
  syncSearchRowSteppers();
}

function renderOrderDrawer() {
  const items = Array.from(state.cart.values());

  if (items.length === 0) {
    els.drawerItemsList.innerHTML = `
      <div class="cart-empty-state">
        <div class="empty-cart-circle">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </div>
        <h3 class="empty-cart-title">Your order is empty</h3>
        <p class="empty-cart-subtitle">Explore dishes from the ring or search menu to curate your order.</p>
      </div>
    `;

    if (els.addMoreDivider) els.addMoreDivider.style.display = 'none';
    if (els.addMoreItemsBtn) els.addMoreItemsBtn.style.display = 'none';
    if (els.instructionsDivider) els.instructionsDivider.style.display = 'none';
    if (els.cookingInstructionsRow) els.cookingInstructionsRow.style.display = 'none';
    if (els.serviceCard) els.serviceCard.style.display = 'none';
    if (els.billDetailsCard) els.billDetailsCard.style.display = 'none';

    if (els.billSubtotal) els.billSubtotal.textContent = '₹0';
    if (els.billGst) els.billGst.textContent = '₹0';
    if (els.billPackagingRow) els.billPackagingRow.style.display = 'none';
    if (els.billTotal) els.billTotal.textContent = '₹0';
    if (els.footerTotalVal) els.footerTotalVal.textContent = '₹0';
    if (els.checkoutBtn) els.checkoutBtn.disabled = true;
    return;
  }

  if (els.addMoreDivider) els.addMoreDivider.style.display = 'block';
  if (els.addMoreItemsBtn) els.addMoreItemsBtn.style.display = 'flex';
  if (els.instructionsDivider) els.instructionsDivider.style.display = 'block';
  if (els.cookingInstructionsRow) els.cookingInstructionsRow.style.display = 'flex';
  if (els.serviceCard) els.serviceCard.style.display = 'block';
  if (els.billDetailsCard) els.billDetailsCard.style.display = 'flex';

  els.drawerItemsList.innerHTML = '';
  let subtotal = 0;

  items.forEach(({ dish, quantity }) => {
    const itemTotal = dish.price * quantity;
    subtotal += itemTotal;

    const isVeg = dish.veg === true;
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.dataset.dishId = dish.id;
    row.innerHTML = `
      <span class="diet-icon ${isVeg ? 'veg' : 'non-veg'}" title="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}" aria-label="${isVeg ? 'Vegetarian' : 'Non-Vegetarian'}">
        <span class="diet-symbol"></span>
      </span>
      <div class="cart-item-details">
        <span class="cart-item-name">${dish.name}</span>
        <span class="cart-item-unit-price num-tabular">₹${dish.price}</span>
      </div>
      <div class="cart-item-stepper">
        <button type="button" class="cart-stepper-btn btn-item-minus" aria-label="Decrease quantity">&minus;</button>
        <span class="cart-stepper-val num-tabular">${quantity}</span>
        <button type="button" class="cart-stepper-btn btn-item-plus" aria-label="Increase quantity">&plus;</button>
      </div>
      <span class="cart-item-total num-tabular">₹${itemTotal}</span>
    `;

    row.querySelector('.btn-item-minus').addEventListener('click', () => updateItemQuantity(dish.id, -1));
    row.querySelector('.btn-item-plus').addEventListener('click', () => updateItemQuantity(dish.id, 1));

    els.drawerItemsList.appendChild(row);
  });

  const gst = Math.round(subtotal * 0.05);
  const packagingFee = state.orderMode === 'takeout' ? 30 : 0;
  const grandTotal = subtotal + gst + packagingFee;

  if (els.billSubtotal) els.billSubtotal.textContent = `₹${subtotal}`;
  if (els.billGst) els.billGst.textContent = `₹${gst}`;
  if (els.billPackagingRow) els.billPackagingRow.style.display = packagingFee > 0 ? 'flex' : 'none';
  if (els.billPackagingAmount) els.billPackagingAmount.textContent = `₹${packagingFee}`;
  if (els.billTotal) els.billTotal.textContent = `₹${grandTotal}`;
  if (els.footerTotalVal) els.footerTotalVal.textContent = `₹${grandTotal}`;
  if (els.checkoutBtn) els.checkoutBtn.disabled = false;
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
  haptics.tap(12);
  // If user opens drawer with an active cart, ensure cart view is displayed
  if (els.drawerReceiptView && els.drawerReceiptView.style.display !== 'none' && state.cart.size > 0) {
    els.drawerReceiptView.style.display = 'none';
    if (els.drawerCartView) els.drawerCartView.style.display = 'flex';
  }
  els.orderDrawer.classList.add('open');
  els.drawerBackdrop.classList.add('open');
  els.orderDrawer.setAttribute('aria-hidden', 'false');
  state.isPaused = true;
}

function closeDrawer() {
  haptics.tap(10);
  els.orderDrawer.classList.remove('open');
  els.drawerBackdrop.classList.remove('open');
  els.orderDrawer.setAttribute('aria-hidden', 'true');
  if (!state.isManualPaused && !state.isLocked && !state.isPinnedByClick && !state.isCenterpieceHovered) {
    state.isPaused = false;
  }

  // If closed after confirming an order, reset to cart view for subsequent order
  setTimeout(() => {
    if (els.drawerReceiptView && els.drawerReceiptView.style.display !== 'none') {
      els.drawerReceiptView.style.display = 'none';
      if (els.drawerCartView) els.drawerCartView.style.display = 'flex';
      if (els.kitchenNoteInput) els.kitchenNoteInput.value = '';
      renderOrderDrawer();
    }
  }, 350);
}

els.openOrderBtn.addEventListener('click', openDrawer);
els.drawerCloseBtn.addEventListener('click', closeDrawer);
els.drawerBackdrop.addEventListener('click', closeDrawer);
if (els.addMoreItemsBtn) {
  els.addMoreItemsBtn.addEventListener('click', () => {
    haptics.tap(10);
    closeDrawer();
  });
}

// Morph Cart Drawer into Digital Receipt with Token & WhatsApp Share
els.checkoutBtn.addEventListener('click', () => {
  if (state.cart.size === 0) return;
  haptics.success([15, 50, 25]);

  // Generate 3-digit order token e.g. #DD-104
  const randomNum = Math.floor(100 + Math.random() * 900);
  const orderToken = `#DD-${randomNum}`;

  // Take snapshot of items before clearing cart
  const itemsSnapshot = Array.from(state.cart.values()).map(({ dish, quantity }) => ({
    name: dish.name,
    price: dish.price,
    quantity,
    total: dish.price * quantity
  }));

  const subtotal = itemsSnapshot.reduce((sum, it) => sum + it.total, 0);
  const gst = Math.round(subtotal * 0.05);
  const packagingFee = state.orderMode === 'takeout' ? 30 : 0;
  const grandTotal = subtotal + gst + packagingFee;

  const kitchenNote = els.kitchenNoteInput ? els.kitchenNoteInput.value.trim() : '';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let modeSummary = '';
  let metaContext = '';
  if (state.orderMode === 'dine-in') {
    const tableStr = state.tableNumber ? `Table ${state.tableNumber}` : 'Table 04';
    modeSummary = `Dine-In (${tableStr})`;
    metaContext = `Dine-In • ${tableStr}`;
  } else {
    const pickupTime = state.takeoutPickupTime || 'ASAP · 15m';
    const contact = els.takeoutContactInput && els.takeoutContactInput.value.trim()
      ? els.takeoutContactInput.value.trim()
      : 'Counter Pickup';
    modeSummary = `Takeout (${pickupTime}) — ${contact}`;
    metaContext = `Takeout (${pickupTime}) • ${contact}`;
  }

  // Populate Digital Receipt Elements
  if (els.receiptTokenId) els.receiptTokenId.textContent = orderToken;
  if (els.receiptMetaDetails) els.receiptMetaDetails.textContent = `${metaContext} • Today, ${timeStr}`;

  if (els.receiptItemsBreakdown) {
    els.receiptItemsBreakdown.innerHTML = itemsSnapshot.map(it => `
      <div class="receipt-breakdown-row">
        <span class="receipt-breakdown-name">
          ${it.name}
          <span class="receipt-breakdown-qty">&times;${it.quantity}</span>
        </span>
        <span class="receipt-breakdown-price num-tabular">₹${it.total}</span>
      </div>
    `).join('');
  }

  if (els.receiptNoteCallout) {
    if (kitchenNote) {
      els.receiptNoteCallout.textContent = `Kitchen Note: "${kitchenNote}"`;
      els.receiptNoteCallout.style.display = 'block';
    } else {
      els.receiptNoteCallout.style.display = 'none';
    }
  }

  if (els.receiptBillSubtotal) els.receiptBillSubtotal.textContent = `₹${subtotal}`;
  if (els.receiptBillGst) els.receiptBillGst.textContent = `₹${gst}`;
  if (els.receiptPackagingRow) els.receiptPackagingRow.style.display = packagingFee > 0 ? 'flex' : 'none';
  if (els.receiptPackagingAmount) els.receiptPackagingAmount.textContent = `₹${packagingFee}`;
  if (els.receiptBillTotal) els.receiptBillTotal.textContent = `₹${grandTotal}`;

  // Build WhatsApp order message
  let waMsg = `🍽️ *New Order: ${orderToken}*\n`;
  waMsg += `📍 *Service:* ${modeSummary}\n`;
  waMsg += `⏰ *Time:* ${timeStr}\n\n`;
  waMsg += `*Ordered Items:*\n`;
  itemsSnapshot.forEach(it => {
    waMsg += `• ${it.name} × ${it.quantity} — ₹${it.total}\n`;
  });
  if (kitchenNote) {
    waMsg += `\n📝 *Kitchen Note:* ${kitchenNote}\n`;
  }
  waMsg += `\nSubtotal: ₹${subtotal}\n`;
  waMsg += `GST (5%): ₹${gst}\n`;
  if (packagingFee > 0) {
    waMsg += `Packaging: ₹${packagingFee}\n`;
  }
  waMsg += `*Grand Total: ₹${grandTotal}*\n\n`;
  waMsg += `_Sent via Dinedong Mobile App_`;

  if (els.receiptWhatsAppBtn) {
    els.receiptWhatsAppBtn.href = `https://wa.me/?text=${encodeURIComponent(waMsg)}`;
  }

  // Morph drawer into receipt view
  if (els.drawerCartView) els.drawerCartView.style.display = 'none';
  if (els.drawerReceiptView) {
    els.drawerReceiptView.style.display = 'flex';
    els.drawerReceiptView.scrollTop = 0;
  }

  // Clear cart and sync all indicators
  state.cart.clear();
  updateOrderBadge();

  const currentDish = state.lockedDish || state.hoveredDish || state.centerpieceActiveDish || currentDishes[state.currentFrontIndex] || currentDishes[0];
  if (currentDish) {
    updateCenterpieceAddButton(currentDish);
  }
});

// "New Order" Button: Reset Drawer back to Cart View
if (els.receiptNewOrderBtn) {
  els.receiptNewOrderBtn.addEventListener('click', () => {
    haptics.tap(12);
    if (els.kitchenNoteInput) els.kitchenNoteInput.value = '';
    if (els.drawerReceiptView) els.drawerReceiptView.style.display = 'none';
    if (els.drawerCartView) els.drawerCartView.style.display = 'flex';
    renderOrderDrawer();
  });
}

// ============================================================================
// Minimalist Instant Search (Decluttered & Keyboard-Safe)
// ============================================================================
const searchFilterState = {
  diet: 'all', // 'all' | 'veg' | 'non-veg'
  query: ''
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function highlightMatch(text, query) {
  if (!query || !query.trim()) return escapeHtml(text);
  const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${q})`, 'gi');
  return escapeHtml(text).replace(regex, '<mark class="search-highlight">$1</mark>');
}

// Adjust search height on mobile when software keyboard opens/closes
function adjustSearchForVisualViewport() {
  if (!els.searchModalBackdrop || !els.searchModalBackdrop.classList.contains('open')) return;
  if (window.innerWidth > 640) {
    if (els.searchPanel) {
      els.searchPanel.style.height = '';
      els.searchPanel.style.top = '';
    }
    return;
  }
  if (window.visualViewport && els.searchPanel) {
    els.searchPanel.style.height = `${window.visualViewport.height}px`;
    els.searchPanel.style.top = `${window.visualViewport.offsetTop}px`;
  }
}

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', adjustSearchForVisualViewport);
  window.visualViewport.addEventListener('scroll', adjustSearchForVisualViewport);
}
window.addEventListener('resize', adjustSearchForVisualViewport);

function openSearch() {
  if (!els.searchModalBackdrop) return;
  haptics.tap(10);
  els.searchModalBackdrop.classList.add('open');
  els.searchModalBackdrop.setAttribute('aria-hidden', 'false');

  // Prevent background page from scrolling behind the search overlay
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';

  if (els.dishSearchInput) {
    if (els.searchClearBtn) {
      els.searchClearBtn.style.display = els.dishSearchInput.value.trim().length > 0 ? 'flex' : 'none';
    }
    renderSearchResults(els.dishSearchInput.value);
    setTimeout(() => {
      els.dishSearchInput.focus();
      adjustSearchForVisualViewport();
    }, 40);
  } else {
    renderSearchResults('');
  }

  state.isPaused = true;
  adjustSearchForVisualViewport();
}

function closeSearch() {
  if (!els.searchModalBackdrop) return;
  haptics.tap(8);
  els.searchModalBackdrop.classList.remove('open');
  els.searchModalBackdrop.setAttribute('aria-hidden', 'true');

  // Restore scroll
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';

  if (els.searchPanel) {
    els.searchPanel.style.height = '';
    els.searchPanel.style.top = '';
  }

  if (els.dishSearchInput) {
    els.dishSearchInput.blur();
  }

  if (!state.isManualPaused && !state.isLocked && !state.isPinnedByClick && !state.isCenterpieceHovered) {
    state.isPaused = false;
  }
}

function renderRowActionButton(dishId, qty) {
  if (qty > 0) {
    return `
      <div class="search-stepper" data-dish-id="${dishId}">
        <button type="button" class="search-stepper-btn search-step-minus" data-dish-id="${dishId}" aria-label="Decrease quantity">−</button>
        <span class="search-stepper-qty">${qty}</span>
        <button type="button" class="search-stepper-btn search-step-plus" data-dish-id="${dishId}" aria-label="Increase quantity">+</button>
      </div>
    `;
  }
  return `
    <button type="button" class="search-add-btn" data-dish-id="${dishId}">
      <span>+ Add</span>
    </button>
  `;
}

function attachSearchActionHandlers(container) {
  if (!container) return;

  container.querySelectorAll('.search-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dishId = parseInt(btn.getAttribute('data-dish-id'), 10);
      const dish = DISHES.find(d => d.id === dishId);
      if (dish) {
        addToOrder(dish, 1);
        updateSearchRowStepper(dishId);
      }
    });
  });

  container.querySelectorAll('.search-step-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dishId = parseInt(btn.getAttribute('data-dish-id'), 10);
      updateItemQuantity(dishId, -1);
      updateSearchRowStepper(dishId);
    });
  });

  container.querySelectorAll('.search-step-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dishId = parseInt(btn.getAttribute('data-dish-id'), 10);
      const dish = DISHES.find(d => d.id === dishId);
      if (dish) {
        addToOrder(dish, 1);
        updateSearchRowStepper(dishId);
      }
    });
  });
}

function updateSearchRowStepper(dishId) {
  if (!els.searchResultsList) return;
  const actionContainers = els.searchResultsList.querySelectorAll(`.search-dish-action[data-action-dish="${dishId}"]`);
  actionContainers.forEach(actionContainer => {
    const cartItem = state.cart.get(dishId);
    const qty = cartItem ? cartItem.quantity : 0;
    actionContainer.innerHTML = renderRowActionButton(dishId, qty);
    attachSearchActionHandlers(actionContainer);
  });
}

function syncSearchRowSteppers() {
  if (!els.searchResultsList) return;
  const actionContainers = els.searchResultsList.querySelectorAll('.search-dish-action');
  actionContainers.forEach(container => {
    const dishId = parseInt(container.getAttribute('data-action-dish'), 10);
    const cartItem = state.cart.get(dishId);
    const qty = cartItem ? cartItem.quantity : 0;
    container.innerHTML = renderRowActionButton(dishId, qty);
    attachSearchActionHandlers(container);
  });
}

function renderSearchResults(query = '') {
  searchFilterState.query = query;
  const q = query.trim().toLowerCase();

  const filtered = DISHES.filter(dish => {
    // Diet filter
    if (searchFilterState.diet === 'veg' && !dish.veg) return false;
    if (searchFilterState.diet === 'non-veg' && dish.veg) return false;

    // Text query match
    if (q) {
      const matchName = dish.name.toLowerCase().includes(q);
      const matchCat = dish.category && dish.category.toLowerCase().includes(q);
      const matchDesc = dish.description && dish.description.toLowerCase().includes(q);
      const matchFlavor = dish.flavorNote && dish.flavorNote.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchDesc && !matchFlavor) return false;
    }
    return true;
  });

  els.searchResultsList.innerHTML = '';

  if (filtered.length === 0) {
    els.searchResultsList.innerHTML = `
      <div class="search-empty-state">
        <p>No dishes found</p>
      </div>
    `;
    return;
  }

  // Pre-defined menu order of categories for editorial presentation
  const categoryOrder = [
    'Street Delights',
    'Dosas & Breads',
    'Burgers & Kebabs',
    'Biryani & Curries',
    'Mithai & Desserts',
    'Desi Coolers & Chai'
  ];

  // Group dishes by category
  const groups = new Map();
  categoryOrder.forEach(cat => groups.set(cat, []));

  filtered.forEach(dish => {
    const cat = dish.category || 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(dish);
  });

  groups.forEach((categoryDishes, categoryTitle) => {
    if (categoryDishes.length === 0) return;

    const groupEl = document.createElement('div');
    groupEl.className = 'search-category-group';

    const headerEl = document.createElement('div');
    headerEl.className = 'search-category-header';
    headerEl.textContent = categoryTitle;
    groupEl.appendChild(headerEl);

    const listEl = document.createElement('div');
    listEl.className = 'search-category-dishes';

    categoryDishes.forEach(dish => {
      const row = document.createElement('div');
      row.className = 'search-dish-row';
      row.setAttribute('data-dish-id', dish.id);

      const cartItem = state.cart.get(dish.id);
      const inCartQty = cartItem ? cartItem.quantity : 0;
      const highlightedName = highlightMatch(dish.name, q);
      const descText = dish.flavorNote || dish.description || '';

      row.innerHTML = `
        <img src="${getThumbnailUrl(dish.imageId)}" alt="${dish.name}" class="search-dish-thumb" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE_URL}'" />
        <div class="search-dish-info">
          <div class="search-dish-title-row">
            <span class="diet-dot ${dish.veg ? 'veg' : 'non-veg'}" title="${dish.veg ? 'Vegetarian' : 'Non-Vegetarian'}"></span>
            <span class="search-dish-name">${highlightedName}</span>
            <span class="search-dish-price">₹${dish.price}</span>
          </div>
          <div class="search-dish-desc">${escapeHtml(descText)}</div>
        </div>
        <div class="search-dish-action" data-action-dish="${dish.id}">
          ${renderRowActionButton(dish.id, inCartQty)}
        </div>
      `;

      // Row click: Smoothly spin 3D ring to this dish
      row.addEventListener('click', (e) => {
        if (e.target.closest('.search-dish-action')) return;

        closeSearch();

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

      listEl.appendChild(row);
    });

    groupEl.appendChild(listEl);
    els.searchResultsList.appendChild(groupEl);
  });

  attachSearchActionHandlers(els.searchResultsList);
}

// Event Listeners for Search
if (els.openSearchBtn) els.openSearchBtn.addEventListener('click', openSearch);
if (els.searchCloseBtn) els.searchCloseBtn.addEventListener('click', closeSearch);

if (els.searchModalBackdrop) {
  els.searchModalBackdrop.addEventListener('click', (e) => {
    if (e.target === els.searchModalBackdrop) closeSearch();
  });
}

if (els.dishSearchInput) {
  els.dishSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    if (els.searchClearBtn) {
      els.searchClearBtn.style.display = val.trim().length > 0 ? 'flex' : 'none';
    }
    renderSearchResults(val);
  });
}

if (els.searchClearBtn) {
  els.searchClearBtn.addEventListener('click', () => {
    if (els.dishSearchInput) {
      els.dishSearchInput.value = '';
      els.searchClearBtn.style.display = 'none';
      renderSearchResults('');
      els.dishSearchInput.focus();
    }
  });
}

// Subtle 3-way Diet Switch (All / Veg / Non-Veg)
if (els.searchDietSwitch) {
  els.searchDietSwitch.addEventListener('click', (e) => {
    const btn = e.target.closest('.search-tab-btn, .search-diet-btn');
    if (!btn) return;
    const filter = btn.getAttribute('data-filter');
    searchFilterState.diet = filter;
    els.searchDietSwitch.querySelectorAll('.search-tab-btn, .search-diet-btn').forEach(b => {
      const isActive = b === btn;
      b.classList.toggle('active', isActive);
      b.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
    renderSearchResults(els.dishSearchInput ? els.dishSearchInput.value : '');
  });
}

window.addEventListener('keydown', (e) => {
  // Open search on '/' (unless in input/textarea) or Cmd/Ctrl + K
  const isTyping = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName);
  if ((e.key === '/' && !isTyping) || ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K'))) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
    closeDrawer();
    unlockAndResume();
    if (els.receiptModalBackdrop) els.receiptModalBackdrop.classList.remove('open');
  }
});

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
  initOrderContext();
  setOrderMode('dine-in');
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
