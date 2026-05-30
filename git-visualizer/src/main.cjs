const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { execFile } = require("child_process");

function createWindow(){
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname,"preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile(path.join(__dirname,"index.html"));
}
app.whenReady().then(createWindow);
app.on("window-all-closed",() => {
  if (process.platform !== "darwin"){
    app.quit();
  }
});

app.on("activate",()=>{
  if (BrowserWindow.getAllWindows().length === 0){
    createWindow();
  }
});

function runGitCommand(repoPath, args){
  return new Promise((resolve, reject)=>{
    execFile(
      "git",
      args,
      {
        cwd: repoPath,
        maxBuffer: 10 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr.trim() || error.message));
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}

ipcMain.handle("open-folder-dialog",async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0){
    return null;
  }

  const chosenPath = result.filePaths[0];

  try {
    await runGitCommand(chosenPath, ["rev-parse","--git-dir"]);
    return { path: chosenPath };
  } catch (err) {
    console.warn(`Path is not a git repo: ${chosenPath}`,err.message);
    return { error:"This folder does not appear to be a Git repository."};
  }
});

ipcMain.handle("git:load",async(event,repoPath)=>{
  try {
    const rawLog = await runGitCommand(repoPath,[
      "log",
      "--all",
      "--topo-order",
      "--format=%H|%P|%an|%ae|%ad|%s%x01"
    ]);

    const commits = rawLog
      .split("\x01")
      .map(entry => entry.trim())
      .filter(Boolean)
      .map(entry => {
        const [hash,parentsRaw,authorName,authorEmail,date,message] = entry.split("|");
        return {
          hash,
          parents: parentsRaw ? parentsRaw.split(" ").filter(Boolean) : [],
          authorName,
          authorEmail,
          date,
          message
        };
      });

    const refs ={};
    try {
      const rawRefs = await runGitCommand(repoPath,["show-ref"]);
      rawRefs.split("\n").forEach(line=>{
        const parts = line.trim().split(" ");
        if (parts.length < 2) return;
        const [hash,refName]=parts;
        if (!refs[hash]){
          refs[hash]=[];
        }
        refs[hash].push(refName);
      });
    } catch (refError) {
      console.log("No refs found or empty repository:", refError.message);
    }
    let currentBranch=null;
    try {
      currentBranch = await runGitCommand(repoPath, ["symbolic-ref","--short","HEAD"]);
    } catch {
      try {
        const shortSHA = await runGitCommand(repoPath, ["rev-parse","--short","HEAD"]);
        currentBranch = `Detached HEAD (${shortSHA})`;
      } catch {
        currentBranch = "Unknown";
      }
    }

    const repoName = path.basename(repoPath);

    return{
      commits,
      refs,
      currentBranch,
      repoName
    };
  } catch (err){
    console.error("Failed to load git history:", err);
    return {error:err.message};
  }
});

ipcMain.handle("git:get-changed-files", async (event,repoPath,commitHash)=>{
  try{
    const statOutput = await runGitCommand(repoPath,[
      "show",
      "--stat",
      "--format=",
      commitHash
    ]);

    return {stat:statOutput};
  } catch (err) {
    console.error(`Failed to get diff stat for commit ${commitHash}:`,err);
    return {error:err.message};
  }
});
