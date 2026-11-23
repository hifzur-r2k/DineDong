# DINEDONG — Minimal Artisanal Restaurant Web Application

A luxury editorial, minimalist modern restaurant web application for **DINEDONG** (supporting both **Dine-In** and **Takeout**), featuring an interactive **3D rotating circular food ring** with 44 curated restaurant dishes and a tall centerpiece showcase.

---

## 🎨 Design Philosophy & Aesthetics

- **Color Palette:**
  - **Background:** Warm Gallery Alabaster (`#F6F4EF`) with clean whitespace.
  - **Primary Text:** Deep Charcoal (`#181715`).
  - **Secondary Text:** Warm Slate (`#6E6A63`).
  - **Hairline Borders:** `#E5E1D8`.
  - **Accent Color:** Terracotta Saffron (`#D95D39`) for active highlights, prices, and primary CTAs.
- **Typography:**
  - **Font Family:** [Inter](https://fonts.google.com/specimen/Inter) across the entire application.
  - **Wordmark & Spotlight Title:** Inter Bold (700) with tight letter-spacing (`-0.03em`).
  - **Prices:** Tabular numbers for clean visual alignment.

---

## ✨ Key Features

1. **Fixed Minimalist Top Navigation:**
   - **DINEDONG Wordmark:** Bold editorial logo with pulsing terracotta accent dot.
   - **Mode Pill Toggle:** Instant switch between **Dine-In** (Table Service) and **Takeout** (Express Pickup).
   - **Live Order Drawer Trigger:** Real-time item count badge and subtotal in ₹.
   - **Sound Chimes:** Optional synthesized audio feedback (Web Audio API) for tactile interaction.

2. **Top-Center Hero Spotlight:**
   - Dynamically synchronized in real-time with whichever dish is active.
   - Displays dish title and 1-line flavor note with zero blank frames.

3. **3D Continuous Rotating Food Ring:**
   - Built with pure CSS 3D (`transform-style: preserve-3d; perspective: 1200px; rotateX(-18deg)`).
   - Arranges **44 vertical food cards** with clean spacing and zero overlap on mobile and desktop.
   - Smooth continuous anti-clockwise rotation powered by `requestAnimationFrame`.
   - **Touch & Mouse Drag:** Grab and swipe to spin the ring with smooth inertia decay.

4. **Tall Centerpiece Dish Showcase:**
   - Sits prominently inside the 3D ring with clean breathing room from front and back arcs.
   - **Single Veg / Non-Veg Icon Badge:** Top-left authentic Indian food indicator (green dot for Veg, red triangle for Non-Veg).
   - **Floating Price & "+ Add" Bar:** Directly on the image, featuring the price (₹) and terracotta orange "+ Add" button.
   - **Silky Cross-Fade:** Smoothly dissolves between dishes as the ring rotates or when any card is tapped.

5. **Slide-Over Order Drawer (Cart):**
   - Live item quantity stepper (`-`, count, `+`) and item removal.
   - Dine-In vs Takeout calculations (Table service vs eco-friendly packaging fee).
   - Subtotal, 5% GST, and Grand Total in ₹.
   - Simulated checkout flow with receipt modal and kitchen status tracker.

6. **Showcase Controls:**
   - Previous / Next buttons (`‹`, `›`) to step through dishes.
   - Play / Pause toggle button (`‖ / ›`).

---

## 🚀 Deployment

Zero build step required! This is a self-contained HTML/CSS/JS application that can be deployed instantly:

### Deploy to Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Framework Preset: **Other** (Root directory: `./`).
3. Click **Deploy**.

### Run Locally
```bash
python3 -m http.server 8080
```
Open `http://localhost:8080` in any web browser.
