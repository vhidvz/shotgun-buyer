const until = require('selenium-webdriver/lib/until');
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver');
const chromedriver = require('chromedriver');
const { sleep } = require('../js/utils');
const axios = require('axios');

module.exports.default = {
  info: {
    broker: 'easytrader',
    alias: 'مفید (ایزی تریدر)',
    gateway: 'd.easytrader.emofid.com',
    url: 'https://d.easytrader.emofid.com/',
    orderUrl: 'https://d11.emofid.com/easy/api/OmsOrder',
  },
  FindInstrument: function (driver, name) {
    instrumentList = JSON.parse(driver.localStorage.stocks)
    for (const instrument of instrumentList.stocks) {
      if (instrument.symbol.includes(name)) {
        return instrument
      }
    }
  },
  buyCall: function (event, data, driver, instrument) {
    const jalaliDate = new Date().toLocaleDateString('fa-IR').replace(/([۰-۹])/gi, token => String.fromCharCode(token.charCodeAt(0) - 1728))

    const payload = {
      isin: instrument.isin,
      financeId: 1,
      quantity: parseInt(data.count),
      price: parseInt(data.price),
      side: 0,
      validityType: 74,
      validityDateJalali: jalaliDate,
      easySource: 1,
      referenceKey: instrument.id,
      cautionAgreementSelected: false
    }

    const accessToken = JSON.parse(driver.localStorage.User).access_token

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken,
      }
    })
      .then((res) => {
        if (res.data.IsSuccessfull) {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.omsErrorDescription })
        }
      })
      .catch(err => console.error(err.message));
  },
  saleCall: function (event, data, driver, instrument) {
    const jalaliDate = new Date().toLocaleDateString('fa-IR').replace(/([۰-۹])/gi, token => String.fromCharCode(token.charCodeAt(0) - 1728))

    const payload = {
      isin: instrument.isin,
      financeId: 1,
      quantity: parseInt(data.count),
      price: parseInt(data.price),
      side: 1,
      validityType: 74,
      validityDateJalali: jalaliDate,
      easySource: 1,
      referenceKey: instrument.id,
      cautionAgreementSelected: false
    }

    const accessToken = JSON.parse(driver.localStorage.User).access_token

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + accessToken,
      }
    })
      .then((res) => {
        if (res.data.IsSuccessfull) {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.omsErrorDescription })
        }
      })
      .catch(err => console.error(err.message));
  },
  login: async function (username, password) {
    try {
      chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    } catch (error) {
      console.error(error.message)
    }

    const driver = new webdriver.Builder()
      // The "9515" is the port opened by chrome driver.
      .withCapabilities(webdriver.Capabilities.chrome())
      .setChromeOptions(new chrome.Options().addArguments(['--dns-prefetch-disable']))
      .setChromeOptions(new chrome.Options().excludeSwitches(['enable-automation']))
      .forBrowser('chrome')
      .build()

    await driver.get(this.info.url)

    sleep(1000)
    await driver.wait(until.urlContains('Login'), 120000)

    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="Username"]')).sendKeys(username)
    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="Password"]')).sendKeys(password)

    sleep(1000)
    await driver.wait(until.elementLocated(webdriver.By.xpath('//span[@title="متصل" and contains(@class, "text-success")]')), 120000)

    sleep(1000)
    const cookies = await driver.manage().getCookies();
    const localStorage = await driver.executeScript('return window.localStorage');
    const sessionStorage = await driver.executeScript('return window.sessionStorage');

    await driver.close()

    return { cookies, localStorage, sessionStorage }
  }
}