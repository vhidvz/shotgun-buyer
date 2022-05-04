// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
let trigger;
let sendTimeout;

const configs = {
  timeInterval: 1000,
  updateNtpDateInterval: 10,
  shotgunTriggerInterval: 15,
  updateDateTimeInterval: 90000,
  updatePingTimeInterval: 180000,
  logsAnimateInterval: 500,
  pingTimeDefaultValue: 5,
}

const brokers = {
  exirbroker: 'اقتصاد بیدار',
  mofidonline: 'مفید (آنلاین پلاس)',
  easytrader: 'مفید (ایزی تریدر)',
}

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-start',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  onOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

const store = new Vuex.Store({
  state: {
    time: '',
    ntpDate: null,
    schedule: null,
    pingTime: null,
    brokerData: {},
    instrumentData: {},
    setting: {
      dateTime: '',
      broker: '',
      delay: '',
      accelerate: '',
      duration: '',
      type: '',
    },
    account: {
      username: '',
      password: '',
    },
    stock: {
      count: '',
      price: '',
      symbol: '',
    },
    logs: []
  },
})

// Normal functions
function updateNtpDate() {
  if (store.state.ntpDate) {
    store.state.ntpDate = new Date(store.state.ntpDate.getTime() + configs.updateNtpDateInterval);
  }
}
setInterval(updateNtpDate, configs.updateNtpDateInterval);

function updateDateTime() {
  api.send('toMain', { fcn: 'DateTime' })
}
setInterval(updateDateTime, configs.updateDateTimeInterval)

function updatePingTime() {
  if (store.state.setting.broker != '') {
    api.send('toMain', { fcn: 'PingTime', broker: store.state.setting.broker })
  }
}
setInterval(updatePingTime, configs.updatePingTimeInterval)

// Nav application
const appNav = new Vue({
  el: "#sideNav",
  data: {
    store: store
  },
  mounted: function () {
    updateDateTime()
  }
})

// Container application
const appContainer = new Vue({
  el: "#app-container",
  data: {
    store: store
  },
  components: {
    DatePicker: VuePersianDatetimePicker
  },
  mounted: function () {
    this.getTime()
  },
  created() {
    setInterval(this.getTime, configs.timeInterval);
  },
  watch: {
    'store.state.setting.dateTime': function (value) {
      if (value != '') {
        this.store.state.schedule = moment(value, 'jYYYY/jM/jD HH:mm').toDate()
      } else {
        this.store.state.schedule = null
      }
    },
    'store.state.logs': function () {
      $("#logs").animate({
        scrollTop: $("#logs")[0].scrollHeight
      }, configs.logsAnimateInterval)
    },
  },
  computed: {
    isValidSetting: function () {
      const setting = this.store.state.setting
      return setting.dateTime != '' && setting.broker != '' && setting.delay != '' && setting.accelerate != '' && setting.duration != '' && setting.type != ''
    },
    isValidAccount: function () {
      const account = this.store.state.account
      return this.store.state.setting.broker != '' && account.username != '' && account.password != ''
    },
    isValidStock: function () {
      const stock = this.store.state.stock
      return this.isAccountLoggedIn && /^\d+$/.test(stock.count) && /^\d+$/.test(stock.price) && stock.symbol != ''
    },
    isValidInstrument: function () {
      const stock = this.store.state.stock
      return Object.keys(this.store.state.instrumentData).length != 0 && this.isValidStock
    },
    isAccountLoggedIn: function () {
      return Object.keys(this.store.state.brokerData).length != 0
    }
  },
  methods: {
    getTime: function () {
      const now = this.store.state.ntpDate || new Date()
      const time = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');
      this.store.state.time = time;
    },
    onBrokerChange: function () {
      updatePingTime()
      this.store.state.brokerData = {}
      this.store.state.instrumentData = {}
    },
    openExternalLink: function (link) {
      shell.openExternal(link)
    },
    onCreateSession() {
      api.send('toMain', {
        fcn: 'Login',
        broker: this.store.state.setting.broker,
        username: this.store.state.account.username,
        password: this.store.state.account.password
      })
    },
    onFindInstrument() {
      api.send('toMain', {
        fcn: 'FindInstrument',
        broker: this.store.state.setting.broker,
        symbol: this.store.state.stock.symbol,
      })
    }
  }
})

// Shotgun trigger
api.receive('fromShotgun', (data) => {
  if (data.status == -1) {
    store.state.logs.push('[' + store.state.time + '] ' + data.message)
    return;
  }

  // clearTimeout(sendTimeout)

  if (data.status !== 200) {
    store.state.logs.push('[' + store.state.time + '] ' + data.message)
    Toast.fire({
      icon: 'error',
      title: data.message
    })
    return;
  }

  const now = store.state.ntpDate || new Date()
  const time = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0') + ":" + String(now.getMilliseconds()).padStart(3, '0')

  Toast.fire({
    icon: 'success',
    title: 'ثبت سفارش با موفقیت انجام شد!'
  })
  store.state.logs.push('[' + store.state.time + '] ' + `ثبت سفارش در زمان ${time} با موفقیت انجام شد.`)
  store.state.setting.dateTime = ''
  trigger = setInterval(shotgunTrigger, configs.shotgunTriggerInterval)
})

function sendScheduledRequest(schedule, duration, payload) {
  if ((store.state.ntpDate || new Date()).getTime() - schedule.getTime() > duration) {
    Toast.fire({
      icon: 'warning',
      title: 'پایان یافتن تداوم ارسال درخواست‌ها!'
    })
    store.state.logs.push('[' + store.state.time + '] ' + 'تداوم ارسال درخواست‌ها پایان یافت.')
    store.state.setting.dateTime = ''
    trigger = setInterval(shotgunTrigger, configs.shotgunTriggerInterval)
    return
  };

  api.send('toShotgun', payload)

  sendTimeout = setTimeout(sendScheduledRequest, parseInt(store.state.setting.delay), ...[schedule, duration, payload])
}

function shotgunTrigger() {
  if (appContainer.isValidSetting && appContainer.isValidInstrument && appContainer.isAccountLoggedIn) {
    const schedule = store.state.schedule
    const ntpDate = store.state.ntpDate || new Date()

    if (schedule.getTime() - (parseInt(store.state.setting.accelerate) * parseInt(store.state.setting.delay)) < ntpDate.getTime() + (parseInt(store.state.pingTime || configs.pingTimeDefaultValue))) {
      clearInterval(trigger)

      const payload = {
        type: store.state.setting.type,
        broker: store.state.setting.broker,
        instrument: store.state.instrumentData,
        stock: {
          count: store.state.stock.count,
          price: store.state.stock.price,
          symbol: store.state.stock.symbol,
        }
      }

      sendScheduledRequest(new Date(schedule.getTime()), parseInt(store.state.setting.duration) * 60 * 1000, payload)

      Toast.fire({
        icon: 'info',
        title: 'شروع ارسال درخواست...!'
      })
      store.state.logs.push('[' + store.state.time + '] ' + 'شروع ارسال درخواست‌ها...')
    }
  }
}
trigger = setInterval(shotgunTrigger, configs.shotgunTriggerInterval)

// API ipc definitions
api.receive('fromMain', (data) => {
  // console.log(data)

  if (data.status !== 200) {
    store.state.logs.push('[' + store.state.time + '] ' + data.message)
    Toast.fire({
      icon: 'error',
      title: data.message
    })
    return;
  }

  switch (data.fcn) {
    case 'DateTime':
      store.state.ntpDate = data.data
      store.state.logs.push('[' + store.state.time + '] ' + 'ساعت برنامه هماهنگ سازی شد.')
      break
    case 'PingTime':
      store.state.pingTime = data.data
      store.state.logs.push('[' + store.state.time + '] ' + `پینگ سرور کارگزاری ${brokers[store.state.setting.broker]} ${data.data} میلی ثانیه می‌باشد.`)
      break
    case 'Login':
      store.state.brokerData = data.data
      store.state.logs.push('[' + store.state.time + '] ' + `ورود به حساب کارگزاری ${brokers[store.state.setting.broker]} با موفقیت انجام شد.`)
      Toast.fire({
        icon: 'success',
        title: 'ورود با موفقیت انجام شد!'
      })
      break
    case 'FindInstrument':
      store.state.instrumentData = data.data
      store.state.logs.push('[' + store.state.time + '] ' + `اطلاعات نماد ${store.state.stock.symbol} با موفقیت دریافت شد.`)
      Toast.fire({
        icon: 'success',
        title: 'اطلاعات نماد با موفقیت دریافت شد.'
      })
      break
  }
})
