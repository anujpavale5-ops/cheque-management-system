# ChequeTracker - OCR Collection & Tracking System

This is a modern SaaS-style dashboard prototype for managing cheque collections, extracting data via OCR (simulated), and tracking cheque lifecycles.

## Features
- **Vanilla SPA**: Uses pure HTML, CSS, and JS (no frameworks) for high performance and easy integration later.
- **Mock API Layer**: `js/api.js` simulates async backend requests. Data is persisted in `localStorage`.
- **Theming**: Full light/dark mode support using CSS variables.
- **Responsive**: Adapts to desktop and mobile displays (collapsible sidebar).
- **Simulated OCR**: Drag-and-drop file upload with animated processing steps.

## How to Run Locally

Since this prototype uses the JavaScript `fetch()` API to dynamically load page fragments (SPA approach), opening `index.html` directly in your browser (`file://`) may result in CORS security errors. 

**You must serve these files over a local web server.**

### Option 1: Python (Recommended)
If you have Python installed, open your terminal in the `cheque-management` folder and run:

For Python 3:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.

### Option 2: VS Code Live Server
If you use Visual Studio Code, install the **Live Server** extension.
Right-click on `index.html` and select **"Open with Live Server"**.

## Future Integration (FastAPI / PostgreSQL)
The frontend is architected with a separation of concerns:
- **`js/api.js`**: Contains all data interactions. When you build the real backend, simply replace the `db.get()` mock calls in this file with real `fetch()` calls to your FastAPI endpoints. The rest of the frontend will continue to work seamlessly.
