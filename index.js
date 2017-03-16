const {app, BrowserWindow, globalShortcut} = require('electron');
const path = require('path');
const url = require('url');
const fs = require('fs');
const got = require('got');
const connectSocket = require('./src/modules/socket');


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;
let socket;

function reg() {
  let a;
  try {
    a = JSON.parse(fs.readFileSync("./config.json").toString());
  } catch (error) {
    return console.error("Could not parse JSON");
  }
  /* Socket */
  socket = null;
  if (a.token) {
    socket = connectSocket(a.token);
  }

  if (a.keys && a.token && a.token !== "") {
    /* Skip Alert */
    if (a.keys.skip_alert) {
      let key = a.keys.skip_alert;
      try {
        globalShortcut.register(key, () => {
          if (socket) {
              console.log("Send: 'Skip Alert'");
              socket.emit('event:skip');
          }
        });
      } catch (error) {
        console.log(`Keybind for 'Skip Alert' failed, '${key}'`);
      }
    }
    /* Skip Song */
    if (a.keys.skip_song) {
      let key = a.keys.skip_song;
      try {
        globalShortcut.register(key, () => {
            got.delete("https://caipirinha.streamelements.com/kappa/v1/songrequest/queue/skip", {
              headers: {
                Authorization: "Bearer " + a.token
              }
            }).then(() => {
              console.log("Send: 'Skip Song'");
            }).catch(err => {
              console.error("Could not skip the current song:", err.message);
            });
        });
      } catch (error) {
        console.log(`Keybind for 'Skip Song' failed, '${key}'`);
      }
    }
    /* Stop/Resume Alerts */
    if (a.keys.SnR_alert) {
      let key = a.keys.SnR_alert;
      try {
        globalShortcut.register(key, () => {
          if (socket) {
            console.log("Send: 'Stop/Resume Alerts'");
            socket.emit('overlay:togglequeue');
          }
        });
      } catch (error) {
        console.log(`Keybind for 'Stop/Resume Alerts' failed, '${key}'`);
      }
    }
    /* Stop/Resume Song */
    // if (a.keys.SnR_song) {
    //   let key = a.keys.skip_song.key;
    //   try {
    //     globalShortcut.register(key, () => {
            
    //     });
    //   } catch (error) {
    //     console.log(`Keybind for 'Stop/Resume Song' failed, '${key}'`);
    //   }
    // }
  }
}

function createWindow () {
  // globalShortcut
  if (fs.existsSync("./config.json")) {
      reg();
  }
  fs.watch(".", (type, filename) => {
    if (fs.existsSync("./config.json") && filename === "config.json") {
      socket = null;
      globalShortcut.unregisterAll();
      reg();
    }
  });


  // Create the browser window.
  win = new BrowserWindow({width: 625, height: 580, resizable: true, icon: path.join(__dirname, 'src/se.ico')});

  // Hide top bar
  win.setMenu(null);

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'src/settings.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Open the DevTools.
  if ((fs.existsSync('./package.json') && /.*[\\/]npm[\\/]node_modules[\\/]electron[\\/]dist[\\/]electron[\.a-z]*/i.test(path.normalize(process.argv[0]))) || (process.argv[2] && process.argv[2] === "secret dev")) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
