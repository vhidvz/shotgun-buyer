const until = require('selenium-webdriver/lib/until');
const chrome = require('selenium-webdriver/chrome');
const webdriver = require('selenium-webdriver');
const chromedriver = require('chromedriver');
const { sleep } = require('../js/utils');
const axios = require('axios');

const information = {
  broker: 'mofidonline',
  alias: 'مفید (آنلاین پلاس)',
  gateway: 'api2.mofidonline.com',
  url: 'https://onlineplus.mofidonline.com/',
  orderUrl: 'https://api2.mofidonline.com/Web/V1/Order/Post',
  instrumentUrl: 'https://api2.mofidonline.com/Web/V1/Symbol/GetSymbol',
}

module.exports.default = {
  info: information,
  FindInstrument: async (driver, name) => {
    const result = await axios.get(encodeURI(information.instrumentUrl + '?term=' + name), {
      headers: {
        "Authorization": "BasicAuthentication " + driver.localStorage["api-token"],
      }
    })
    return result.data[0].isin
  },
  buyCall: function (event, data, driver, instrument) {
    const payload = {
      IsSymbolCautionAgreement: false,
      CautionAgreementSelected: false,
      IsSymbolSepahAgreement: false,
      SepahAgreementSelected: false,
      orderCount: parseInt(data.count),
      orderPrice: parseInt(data.price),
      FinancialProviderId: 1,
      minimumQuantity: 0,
      maxShow: 0,
      orderId: 0,
      isin: instrument,
      orderSide: 65,
      orderValidity: 74,
      orderValiditydate: null,
      shortSellIsEnabled: false,
      shortSellIncentivePercent: 0
    }

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "BasicAuthentication " + driver.localStorage["api-token"],
      }
    })
      .then((res) => {
        if (res.data.IsSuccessfull) {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.MessageDesc })
        }
      })
      .catch(err => console.error(err.message));
  },
  saleCall: function (event, data, driver, instrument) {
    const payload = {
      IsSymbolCautionAgreement: false,
      CautionAgreementSelected: false,
      IsSymbolSepahAgreement: false,
      SepahAgreementSelected: false,
      orderCount: parseInt(data.count),
      orderPrice: parseInt(data.price),
      FinancialProviderId: 1,
      minimumQuantity: 0,
      maxShow: 0,
      orderId: 0,
      isin: instrument,
      orderSide: "86",
      orderValidity: 74,
      orderValiditydate: null,
      shortSellIsEnabled: false,
      shortSellIncentivePercent: 0
    }

    axios.post(this.info.orderUrl, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "BasicAuthentication " + driver.localStorage["api-token"],
      }
    })
      .then((res) => {
        if (res.data.IsSuccessfull) {
          event.reply('fromShotgun', { status: 200 })
        } else {
          event.reply('fromShotgun', { status: -1, message: res.data.MessageDesc })
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
    await driver.findElement(webdriver.By.xpath('//*[@id="txtusername"]')).sendKeys(username)
    sleep(250)
    await driver.findElement(webdriver.By.xpath('//*[@id="txtpassword"]')).sendKeys(password)
    sleep(250)
    await driver.findElement(webdriver.By.xpath('//input[@name="capcha"]')).click()

    sleep(1000)
    await driver.wait(until.urlContains('Home/Default'), 120000)

    sleep(1000)
    await driver.wait(until.elementLocated(webdriver.By.xpath('//*[@id="marketIndex_ChangeValue"]')), 120000)

    sleep(1000)
    await driver.wait(until.elementIsVisible(await driver.findElement(webdriver.By.xpath('//*[@id="lsConecctionStatus" and contains(@class, "connected")]'))), 120000)

    sleep(1000)
    const cookies = await driver.manage().getCookies();
    const localStorage = await driver.executeScript('return window.localStorage');

    await driver.close()

    return { cookies, localStorage }
  }
}