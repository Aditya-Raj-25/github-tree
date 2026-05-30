# Git Working Tree Visualizer

An interactive desktop application built using **Electron**, **React**, and **D3.js** to visualize local Git repositories and commit trees in real time.

---

##  Technology Stack

This application is built on top of a modern desktop web stack:

*   **Electron**: The shell environment that packages the application for the desktop, enabling cross-platform distribution.
*   **Chromium**: The high-performance rendering engine embedded inside Electron, used to render the application's React-based user interface.
*   **Node.js**: The backend environment embedded in Electron, allowing direct system-level access, file path manipulation, and execution of Git commands via sub-processes (`execFile`).
*   **React (v19)**: The library powering the user interface with reactive components and states.
*   **D3.js (Data-Driven Documents)**: The visualization engine used to layout, structure, and render the interactive Git tree graphs and commit networks.
*   **Vite**: The build tool and bundle manager that serves the application during development with Hot Module Replacement (HMR) and packages the frontend for release.

---

##  Project Architecture & Documents

Here is a breakdown of the key files and documents in this workspace and how they fit together:

### Configuration Files
*   [`package.json`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/package.json): Defines the metadata (name, version, scripts) and installs dependencies. It also specifies `src/main.js` as the Electron entry point and includes build targets for `electron-builder`.
*   [`vite.config.js`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/vite.config.js): Customizes Vite parameters, integrates the React plugin, sets the relative asset path (`./`), and forces the dev server to run on port `3000`.
*   [`eslint.config.js`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/eslint.config.js): Houses the ESLint rules to keep code style consistent and clean.

###  Electron (Main Process)
*   [`src/main.js`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/src/main.js): Runs inside Node.js. It manages the app lifecycle, opens the Chromium desktop window, and runs system-level operations (like calling the shell's `git` CLI) through secure Inter-Process Communication (IPC) handlers.
*   [`src/preload.js`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/src/preload.js): Acts as a secure gateway (`contextBridge`) between Node.js and Chromium. It exposes a safe API to the React frontend, allowing it to request Git history and select folders without opening the app to security risks.

### Frontend (Renderer Process)
*   [`index.html`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/index.html): The root document loaded by the Chromium window, containing the container (`#root`) where React is mounted.
*   [`src/main.jsx`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/src/main.jsx): The JavaScript entry point that boots up React in strict mode and mounts the app structure.
*   [`src/App.jsx`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/src/App.jsx): The main component layout where you build the dashboard and wire up the interactive commit graphs.
*   [`src/index.css` & `src/App.css`](file:///Users/adityarajsrivastava/github-tree/git-visualizer/src/App.css): House the typography, colors, and layout styles for the UI.

---

##  Getting Started

### 1. Install Dependencies
Run the following command at the root of the project to set up the workspace:
```bash
npm install
```

### 2. Start in Development Mode
Launch Vite's dev server and boot Electron concurrently:
```bash
npm run dev
```

### 3. Package the App
To bundle the frontend assets and pack Electron into a standalone desktop executable:
```bash
npm run build
```
its not fully build...