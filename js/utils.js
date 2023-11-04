module.exports = {
  sleep: function (delay) {
    let start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }
}
