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
    gateway: 'd.orbis.easytrader.ir',
    url: 'https://d.orbis.easytrader.ir/',
    orderUrl: 'https://api-mts.orbis.easytrader.ir/core/api/order',
  },
  FindInstrument: function (driver, name) {
    const { symbols: instruments } = JSON.parse(driver.localStorage.symbols);
    for (const instrument of instruments) {
      if (
        instrument.searchOptimizeTitle?.includes(name) ||
        instrument.symbolName?.includes(name) ||
        instrument.title?.includes(name)
      ) {
        return instrument;
      }
    }
  },
  buyCall: function (event, data, driver, instrument) {
    const jalaliDate = new Date(Date.now() + 3.5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, -1);

    const payload = {
      order: {
        symbolIsin: instrument.symbolIsin,
        price: parseInt(data.count),
        quantity: parseInt(data.price),
        side: 0,
        validityType: 0,
        validityDate: jalaliDate,
        orderFrom: 34,
      },
    };

    const accessToken = JSON.parse(
      driver.sessionStorage['oidc.user:https://account.emofid.com:easy_pkce'],
    ).access_token;

    axios
      .post(this.info.orderUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
      })
      .then(({ data }) => {
        if (data.isSuccessful) {
          event.reply('fromShotgun', { status: 200 });
        } else {
          event.reply('fromShotgun', {
            status: -1,
            message: data.message,
          });
        }
      })
      .catch((err) => console.error(err.message));
  },
  saleCall: function (event, data, driver, instrument) {
    const jalaliDate = new Date(Date.now() + 3.5 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, -1);

    const payload = {
      order: {
        symbolIsin: instrument.symbolIsin,
        price: parseInt(data.count),
        quantity: parseInt(data.price),
        side: 1,
        validityType: 0,
        validityDate: jalaliDate,
        orderFrom: 34,
      },
    };

    const accessToken = JSON.parse(
      driver.sessionStorage['oidc.user:https://account.emofid.com:easy_pkce'],
    ).access_token;

    axios
      .post(this.info.orderUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
      })
      .then(({ data }) => {
        if (data.isSuccessful) {
          event.reply('fromShotgun', { status: 200 });
        } else {
          event.reply('fromShotgun', {
            status: -1,
            message: data.message,
          });
        }
      })
      .catch((err) => console.error(err.message));
  },
  login: async function (username, password) {
    try {
      chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
    } catch (error) {
      console.error(error.message);
    }

    const driver = new webdriver.Builder()
      .forBrowser('chrome')
      .withCapabilities(webdriver.Capabilities.chrome())
      .setChromeOptions(new chrome.Options().excludeSwitches(['enable-automation']))
      .setChromeOptions(new chrome.Options().addArguments(['--dns-prefetch-disable']))
      .build();

    await driver.get(this.info.url);

    sleep(1000);
    await driver.wait(until.urlContains('Login'), 120000);

    sleep(250);
    await driver
      .findElement(webdriver.By.xpath('//*[@id="Username"]'))
      .sendKeys(username);
    sleep(250);
    await driver
      .findElement(webdriver.By.xpath('//*[@id="Password"]'))
      .sendKeys(password);

    sleep(1000);
    await driver.wait(
      until.elementLocated(
        webdriver.By.xpath(
          '//*[@id="market-data-span-2" and not(contains(text(), "..."))]',
        ),
      ),
      120000,
    );

    sleep(5000);
    const cookies = await driver.manage().getCookies();
    const localStorage = await driver.executeScript('return window.localStorage');
    const sessionStorage = await driver.executeScript('return window.sessionStorage');

    await driver.close();

    return { cookies, localStorage, sessionStorage };
  },
};
