module.exports = {
  sleep: function (delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }
}
