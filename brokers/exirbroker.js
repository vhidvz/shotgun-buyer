const until = require('selenium-webdriver/lib/until');
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver');
const chromedriver = require('chromedriver');
const { sleep } = require('../js/utils');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

module.exports.default = {
  info: {
    broker: 'exirbroker',
    alias: 'اقتصاد بیدار',
    gateway: 'ebb.exirbroker.com',
    url: 'https://ebb.exirbroker.com/',
    orderUrl: 'https://ebb.exirbroker.com/api/v1/order',
  },
  FindInstrument: function (driver, name) {
    instrumentList = JSON.parse(driver.localStorage.instrumentList)
    for (const instrument of instrumentList) {
      if (instrument.abbreviation.includes(name)) {
        return instrument
      }
    }
  },
  _makeCookie: function (cookies) {
    let strCookie = ''
    for (const cookie of cookies) {
      strCookie += cookie.name + '=' + cookie.value + '; '
    }
    return strCookie.substr(0, strCookie.length - 2)
  },
  buyCall: function (event, data, driver, instrument) {
    const payload = {
      id: "",
      version: 1,
      hon: "",
      bankAccountId: -1,
      insMaxLcode: instrument.instrumentId,
      abbreviation: "",
      latinAbbreviation: "",
      side: "SIDE_BUY", // SIDE_SALE
      quantity: parseInt(data.count),
      quantityStr: "",
      remainingQuantity: 0,
      price: parseInt(data.price),
      priceStr: "",
      tradedQuantity: 0,
      averageTradedPrice: 0,
      disclosedQuantity: 0,
      orderType: "ORDER_TYPE_LIMIT",
      validityType: "VALIDITY_TYPE_DAY",
      validityDate: "",
      validityDateHidden: "hidden",
      orderStatusId: 0,
      queueIndex: -1,
      searchedWord: "",
      coreType: "c", // instrument.coreType,
      marketType: "",
      hasUnderCautionAgreement: false,
      dividedOrder: false,
      clientUUID: uuidv4()
    }

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": this._makeCookie(driver.cookies),
      }
    })
      .then((res) => {
        if (res.data.type == 'orderSuccess') {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.desc })
        }
      })
      .catch(err => console.error(err.message));
  },
  saleCall: function (event, data, driver, instrument) {
    const payload = {
      id: "",
      version: 1,
      hon: "",
      bankAccountId: -1,
      insMaxLcode: instrument.instrumentId,
      abbreviation: "",
      latinAbbreviation: "",
      side: "SIDE_SALE", // SIDE_BUY
      quantity: parseInt(data.count),
      quantityStr: "",
      remainingQuantity: 0,
      price: parseInt(data.price),
      priceStr: "",
      tradedQuantity: 0,
      averageTradedPrice: 0,
      disclosedQuantity: 0,
      orderType: "ORDER_TYPE_LIMIT",
      validityType: "VALIDITY_TYPE_DAY",
      validityDate: "",
      validityDateHidden: "hidden",
      orderStatusId: 0,
      queueIndex: -1,
      searchedWord: "",
      coreType: "c", // instrument.coreType,
      marketType: "",
      hasUnderCautionAgreement: false,
      dividedOrder: false,
      clientUUID: uuidv4()
    }

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": this._makeCookie(driver.cookies),
      }
    })
      .then((res) => {
        if (res.data.type == 'orderSuccess') {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.desc })
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

    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="username"]')).sendKeys(username)
    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="password"]')).sendKeys(password)
    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="captchaText"]')).click()

    sleep(1000)
    await driver.wait(until.urlContains('mainNew'), 120000)

    sleep(1000)
    await driver.wait(until.elementIsVisible(await driver.findElement(webdriver.By.xpath('//div[@id="mainHeader"]//div[contains(@class, "clock small")][1]'))), 120000)

    sleep(1000)
    await driver.wait(until.elementTextMatches(await driver.findElement(webdriver.By.xpath('//div[@id="mainHeader"]//div[contains(@class, "clock small")][1]')), /(AM|PM)/), 120000)

    sleep(1000)
    const cookies = await driver.manage().getCookies();
    const localStorage = await driver.executeScript('return window.localStorage');

    await driver.close()

    return { cookies, localStorage }
  }
}