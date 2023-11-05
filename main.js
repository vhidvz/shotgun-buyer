// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');
const ntpClient = require('ntp-client');
const path = require('path');
const ping = require('ping');

const configs = {
  ntpPool: 'ir.pool.ntp.org',
  pingMinReply: 10,
  brokers: {
    easytrader: require('./brokers/easytrader').default,
  },
  drivers: {
    easytrader: {},
  },
};

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.removeMenu();

  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.on('toMain', async (event, data) => {
  switch (data.fcn) {
    case 'DateTime':
      ntpClient.getNetworkTime(configs.ntpPool, 123, (err, date) => {
        if (err) {
          console.error(err);
          event.reply('fromMain', {
            fcn: 'DateTime',
            status: 500,
            message: 'در حال حاظر امکان دریافت تاریخ و زمان وجود ندارد.',
          });
          return;
        }

        event.reply('fromMain', { fcn: 'DateTime', status: 200, data: date });
      });
      break;
    case 'PingTime':
      ping.promise
        .probe(configs.brokers[data.broker].info.gateway, {
          min_reply: configs.pingMinReply,
        })
        .then((res) => {
          if (!res.alive) return;

          event.reply('fromMain', {
            fcn: 'PingTime',
            status: 200,
            data: parseFloat(res.avg),
          });
        })
        .catch((err) => console.error(err));
      break;
    case 'Login':
      configs.brokers[data.broker]
        .login(data.username, data.password)
        .then((res) => {
          configs.drivers[data.broker] = res;
          const { driver, ...response } = res;
          event.reply('fromMain', {
            fcn: 'Login',
            status: 200,
            data: response,
          });
        })
        .catch((err) => console.error(err));
      break;
    case 'FindInstrument':
      const instrument = await configs.brokers[data.broker].FindInstrument(
        configs.drivers[data.broker],
        data.symbol,
      );
      if (!instrument) {
        event.reply('fromMain', {
          fcn: 'FindInstrument',
          status: 500,
          message: 'مشکلی در دریافت اطلاعات نماد به وجود آمده، لطفا دوباره سعی کنید!',
        });
      } else {
        event.reply('fromMain', {
          fcn: 'FindInstrument',
          status: 200,
          data: instrument,
        });
      }
  }
});

// Shotgun ipc handler
ipcMain.on('toShotgun', (event, data) => {
  switch (data.type) {
    case 'buy':
      configs.brokers[data.broker].buyCall(
        event,
        data.stock,
        configs.drivers[data.broker],
        data.instrument,
      );
      break;
    case 'sale':
      configs.brokers[data.broker].saleCall(
        event,
        data.stock,
        configs.drivers[data.broker],
        data.instrument,
      );
      break;
  }
});
