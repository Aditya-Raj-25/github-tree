const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { execFile } = require("child_process");

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

function git(repoPath, args) {
    return new Promise((resolve, reject) => {
        execFile(
            "git",
            args,
            {
                cwd: repoPath,
                maxBuffer: 10 * 1024 * 1024
            },
            (err, stdout, stderr) => {
                if (err) {
                    reject(new Error(stderr || err.message));
                } else {
                    resolve(stdout.trim());
                }
            }
        );
    });
}

// Open Repository
ipcMain.handle("open-folder-dialog", async () => {
    const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
    });

    if (result.canceled) return null;

    const chosen = result.filePaths[0];

    try {
        await git(chosen, ["rev-parse", "--git-dir"]);
        return { path: chosen };
    } catch {
        return { error: "This folder is not a git repository" };
    }
});

// Load Git Data
ipcMain.handle("git:load", async (event, repoPath) => {
    try {
        const raw = await git(repoPath, [
            "log",
            "--all",
            "--topo-order",
            "--format=%H|%P|%an|%ae|%ad|%s%x01"
        ]);

        const commits = [];

        for (const record of raw.split("\x01")) {
            const t = record.trim();
            if (!t) continue;

            const [
                commitHash,
                parents,
                authorName,
                authorEmail,
                date,
                message
            ] = t.split("|");

            commits.push({
                hash: commitHash,
                parents: parents
                    ? parents.split(" ").filter(Boolean)
                    : [],
                authorName,
                authorEmail,
                date,
                message
            });
        }

        const refs = {};

        const rawRefs = await git(repoPath, ["show-ref"]).catch(() => "");

        for (const line of rawRefs.split("\n")) {
            const [hash, name] = line.trim().split(" ");

            if (!hash || !name) continue;

            if (!refs[hash]) {
                refs[hash] = [];
            }

            refs[hash].push(name);
        }

        let currentBranch = null;

        try {
            currentBranch = await git(repoPath, [
                "symbolic-ref",
                "--short",
                "HEAD"
            ]);
        } catch {
            currentBranch = null;
        }

        const repoName = path.basename(repoPath);

        return {
            commits,
            refs,
            currentBranch,
            repoName
        };
    } catch (err) {
        return {
            error: err.message
        };
    }
});

// Get Changed Files for a Commit
ipcMain.handle(
    "git:get-changed-files",
    async (event, repoPath, commitHash) => {
        try {
            const stat = await git(repoPath, [
                "show",
                "--stat",
                "--format=",
                commitHash
            ]);

            return { stat };
        } catch (err) {
            return {
                error: err.message
            };
        }
    }
);