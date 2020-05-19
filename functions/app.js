const linebot = require('linebot');
const bot = linebot({
  channelId: '',
  channelSecret: '',
  channelAccessToken: ''
});

// 當有人傳送訊息給Bot時
bot.on('message', function (event) {
  // event.message.text是使用者傳給bot的訊息
  // 準備要回傳的內容
  var replyMsg = `Hello你剛才說的是:${event.message.text}`;
  // 透過event.reply(要回傳的訊息)方法將訊息回傳給使用者
  event.reply(replyMsg).then(function (data) {
      // 當訊息成功回傳後的處理
  }).catch(function (error) {
      // 當訊息回傳失敗後的處理
  });
});

// Bot所監聽的webhook路
徑與port
bot.listen('linewebhook',  3000, function () {
    console.log('[BOT已準備就緒]');
});
  bot.on('message', function (event) {
    console.log(event.message.text);
    var replyMsg = `Hello你剛才說的是:${event.message.text}`;
    // event.message.text是使用者傳給bot的訊息
    // 使用event.reply(要回傳的訊息)方法可將訊息回傳給使用者
    console.log(replyMsg);
    event.reply(replyMsg).then(function (data) {
      console.log(data);
    }).catch(function (error) {
      console.log(error);
    });
  });