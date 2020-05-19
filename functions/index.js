"use-strict"
const functions = require('firebase-functions');
// initialise DB connection
const admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: ''
});
const http = require('http');
const axios = require('axios');
const uuid = require('uuid');
const sessionId = uuid.v4();
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion, Payload } = require('dialogflow-fulfillment');
process.env.DEBUG = 'dialogflow:*'; // It enables lib debugging statements
var apiai = require('apiai');
let apiaiOptions = {
  language: "zh-tw",
  requestSource: "line"
};
var app = apiai("",apiaiOptions);
const linebot = require('linebot');
const bot = linebot({
  channelId: '',
  channelSecret: '',
  channelAccessToken: ''
});
let cropValue = '';
// Bot所監聽的webhook路徑與port
bot.listen('/linewebhook', 3000, function () {
  console.log('[BOT已準備就緒]');
});
bot.on('message', function (event) {
  console.log(event);
  return new Promise((resolve, reject) => {
    // if line message === hello or hi ==> send hello to dialogflow , and callback a greeting with user name and ask some question about crop
    if (event.message.text == "hello" || event.message.text == "hi") {
      var request = app.textRequest( "hello", {
        sessionId: sessionId
      });
      request.on('response', function (response) {
        console.log(response.result.fulfillment.messages);
        event.reply(response.result.fulfillment.messages[0]['speech'] + '\n' + response.result.fulfillment.messages[1]['speech']).then(function (data) {
          // success
          console.log(data);
          resolve(data)
        }).catch(function (error) {
          // error
        });
      });
      request.on('error', function (error) {
        console.log(error);
      });
      request.end();
    }
    else if (event.message.text !== undefined && event.message.text !== 'hello' && event.message.text !== 'hi' && event.message.text !== '分' && event.message.text !== '甲') {
      var request = app.textRequest(event.message.text, {
        sessionId: sessionId
      });
      request.on('response', function (response) {
        console.log(response.result.fulfillment.messages);
        let crop = admin.database().ref("crop");
        crop.once("value").then(function (snapshot, recArray) {
          let cropName = event.message.text;
          console.log(snapshot.toJSON()[cropName]);
          if (snapshot.val()[cropName] === undefined) {
            if( response.result.fulfillment.messages[0]['speech'].match('種植溫度') !== null ){
              let tempButton = {
                "type": "text", // ①
                "text": "您可以查詢關於此作物溫度的相關問題",
                "quickReply": { // ②
                  "items": [
                    {
                      "type": "action",
                      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVCYvmZORH7dKgnittvcLGTl02iWr4nQhsp90RTlOPjVypZkht",
                      "action": {
                        "type": "message",
                        "label": response.result.fulfillment.messages[0]['speech'].substr(3,2) + "正常溫度",
                        "text":  response.result.fulfillment.messages[0]['speech'].substr(3,2) + "正常溫度"
                      }
                    },
                    {
                      "type": "action", // ③
                      "imageUrl": "https://media.istockphoto.com/vectors/thermometers-icon-high-temperature-vector-icon-on-white-background-vector-id935702020",
                      "action": {
                        "type": "message",
                        "label":  response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最高溫度",
                        "text": response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最高溫度"
                      }
                    },
                    {
                      "type": "action",
                      "imageUrl": "https://st2.depositphotos.com/3921439/7538/v/950/depositphotos_75380133-stock-illustration-the-thermometer-icon-low-temperature.jpg",
                      "action": {
                        "type": "message",
                        "label": response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最低溫度",
                        "text":  response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最低溫度"
                      }
                    }
                  ]
                }
              }
            event.reply([response.result.fulfillment.messages[0]['speech'],tempButton]).then(function (data) {
              console.log(data);
              resolve(data)
            }).catch(function (error) {
            });
          }
          else if (response.result.fulfillment.messages[0]['speech'].match('PH') !== null){
            let tempButton = {
              "type": "text", // ①
              "text": "您可以查詢關於此作物PH的相關問題",
              "quickReply": { // ②
                "items": [
                  {
                    "type": "action",
                    "imageUrl": "https://www.acid-base.com/iconslarge/learnph1.png",
                    "action": {
                      "type": "message",
                      "label": response.result.fulfillment.messages[0]['speech'].substr(3,2) + "適合PH值",
                      "text":  response.result.fulfillment.messages[0]['speech'].substr(3,2) + "適合PH值"
                    }
                  },
                  {
                    "type": "action", // ③
                    "imageUrl": "https://www.acid-base.com/iconslarge/learnph1.png",
                    "action": {
                      "type": "message",
                      "label":  response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最低PH值",
                      "text": response.result.fulfillment.messages[0]['speech'].substr(3,2) + "最低PH值"
                    }
                  }
                ]
              }
            }
            event.reply([response.result.fulfillment.messages[0]['speech'],tempButton]).then(function (data) {
              console.log(data);
              resolve(data)
            }).catch(function (error) {
            });
          }
          else{
            event.reply(response.result.fulfillment.messages[0]['speech']).then(function (data) {
              console.log(data);
              resolve(data)
            }).catch(function (error) {
            });
          }

          }
          else {
            let location = {
              "type": "template",
              "altText": "this is a buttons template",
              "template": {
                "type": "buttons",
                "thumbnailImageUrl": "https://gss3.bdstatic.com/-Po3dSag_xI4khGkpoWK1HF6hhy/baike/s%3D220/sign=d0327c81f41986184547e8867aec2e69/6c224f4a20a446236ade5c829422720e0cf3d73e.jpg",
                "title": "請選擇您的種植地點",
                "text": "Please select ",
                "actions": [
                  {
                    "type": "location",
                    "label": "按我開啟地圖"
                  }
                ]
              }
            }
            event.reply([response.result.fulfillment.messages[0]['speech'] + "\n" + response.result.fulfillment.messages[1]['speech'], location]).then(function (data) {
              // success
              console.log(data);
              resolve(data)
            }).catch(function (error) {
              // error
            });
          }
        });
      });
      request.on('error', function (error) {
        console.log(error);
      });
      request.end();
    }
    else if( event.message.text === "分" || event.message.text === "甲"){
      let push_cache = admin.database().ref("farmer_info/" + event.source.userId + "/cache");
      push_cache.update({ cache:  event.message.text})
      event.reply("請問幾" + event.message.text + "?").then(function (data) {
        resolve(data)
      }).catch(function (error) {
        // error
      });
      }
    else {
    const confirm = {
      type: 'template',
  altText: 'this is a confirm template',
  template: {
    type: 'confirm',
    text: 'Are you sure?',
    actions: [{
      type: 'message',
      label: '分',
      text: '分'
    }, {
      type: 'message',
      label: '甲',
      text: '甲'
    }]
  }
    }
      event.reply(["您輸入的地址為 "+ event.message.address + "\n請問您種植土地面積單位為?",confirm]).then(function (data) {
        let push_cropaddress = admin.database().ref("farmer_info/" + event.source.userId);
        push_cropaddress.update({ address: event.message.address ,latitude: event.message.latitude,longitude:event.message.longitude})
        console.log(data);
        resolve(data)
      }).catch(function (error) {
        // error
      });
    }
  });
  // 透過event.reply(要回傳的訊息)方法將訊息回傳給使用者
});
exports.dialogtest = functions.https.onRequest((request, response) => {
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));
  const agent = new WebhookClient({ request, response });
  async function greeting(agent) {
    //let userId = request.body.originalDetectIntentRequest.payload.data.source.userId;
    //console.log(userId);
    return new Promise((resolve, reject) => {
      axios.get('https://api.line.me/v2/bot/profile/U7df9e7c26a78823be8e1fb89e6f17de5', {
        headers: {
          Authorization: "Bearer y6IdDBqKMAIB92i8AbXDwk9VIi3szDYwry/7r++qoqPz4hqFHxBt/Kn6ClEkniUODGTcDBlS+iShmO1G6IwS5IkMiCFbQWu3qVFulvSYZa2RcNS8HFaXQUtbdmv0tQs+Kxw0cf5TQ8WfuA4/10gfIQdB04t89/1O/w1cDnyilFU="
        }
      })
        .then(function (response) {
          console.log(response.data.displayName);
          let push_username = admin.database().ref("farmer_info/" + response.data.userId);
          push_username.update({ name: response.data.displayName, userid: response.data.userId })
          agent.add("安安你好啊農友: " + response.data.displayName);
          agent.add("請問您主要種植的作物是什麼？");
          resolve(response.data.displayName)
        })
        .catch(function (error) {
          console.log(error);
          reject();
        });
    });
  }
  function fallback(agent) {
    return new Promise((resolve, reject) => {
      let crop = admin.database().ref("crop");
      axios.get('https://api.line.me/v2/bot/profile/U7df9e7c26a78823be8e1fb89e6f17de5', {
        headers: {
          Authorization: "Bearer y6IdDBqKMAIB92i8AbXDwk9VIi3szDYwry/7r++qoqPz4hqFHxBt/Kn6ClEkniUODGTcDBlS+iShmO1G6IwS5IkMiCFbQWu3qVFulvSYZa2RcNS8HFaXQUtbdmv0tQs+Kxw0cf5TQ8WfuA4/10gfIQdB04t89/1O/w1cDnyilFU="
        }
      })
        .then(function (response) {
          crop.once("value").then(function (snapshot, recArray) {
            console.log(request.body.queryResult.queryText);
            // write crop info to firebase realtimedatabase
            /*
            let push_cropinfo = admin.database().ref("crop/玉米");
            push_cropinfo.set({ 適合種植地區: "世界產地主要分布在30°~50°的緯度之間",適合天氣: "溫暖氣候", 玉米品種: "https://book.tndais.gov.tw/Brochure/pub2-4.htm" ,種植季節:"台灣 春作 : 2月下旬至3月上旬 ; 秋作 9月上旬至11月上旬 ; 備註 : 不同品種有不同的種植季節", 濕度_過低: "50%(需灌溉)",溫度_適宜: "21-27",溫度_過高:"48(停止生長)", 溫度_過低:"4(停止生長)",土壤_不適合:"砂土及黏土",土壤PH值_適宜:"pH值5.0 ~ 8.0(pH值6.0 ~7.0最佳)",土壤PH值_過低: "ph值5.0(補充石灰)",鉀肥_每公頃:"50-80(kg)",氮肥_每公頃:"120-160(kg)",磷肥_每公頃:"60-90(kg)"})
            */
            let cropName = request.body.queryResult.queryText;
            console.log(snapshot.toJSON()[cropName]);
            if (snapshot.val()[cropName] === undefined) {
              agent.add("不好意思您輸入的作物目前還未有資料，請重新輸入其他作物，謝謝！");
              resolve(snapshot.val())
            }
            else {
              agent.add("找到了 " + request.body.queryResult.queryText + "(" + snapshot.val()[cropName] + ")");
              agent.add("請問您的種植地區在哪呢？");
              let push_cropname = admin.database().ref("farmer_info/" + response.data.userId);
              push_cropname.update({ crop: request.body.queryResult.queryText })
              resolve(snapshot.val())
            }
          });
        })
        .catch(function (error) {
          console.log(error);
          reject();
        });
    });
  }
  function getCropAddress(agent) {
    let push_cropaddress = admin.database().ref("farmer_info/" + request.body.originalDetectIntentRequest.payload.data.source.userId);
    push_cropaddress.update({ address: request.body.queryResult.queryText })
    response.json({
      "fulfillmentMessages": [
        {
          "quickReplies": {
            "title": "請輸入您的土地面積,請在下方選擇您想提供的土地面積單位",
            "quickReplies": [
              "甲",
              "分"
            ]
          },
          "platform": "LINE"
        }
      ]
    });
  }

  function getUnit(agent) {
    agent.add("請問幾" + request.body.queryResult.queryText + "呢？");
    let push_cache = admin.database().ref("farmer_info/" + request.body.originalDetectIntentRequest.payload.data.source.userId + "/cache");
    push_cache.update({ cache: request.body.queryResult.queryText })
  }

  function getUnitAmount(agent) {
    return new Promise((resolve, reject) => {
      axios.get('https://api.line.me/v2/bot/profile/U7df9e7c26a78823be8e1fb89e6f17de5', {
        headers: {
          Authorization: "Bearer y6IdDBqKMAIB92i8AbXDwk9VIi3szDYwry/7r++qoqPz4hqFHxBt/Kn6ClEkniUODGTcDBlS+iShmO1G6IwS5IkMiCFbQWu3qVFulvSYZa2RcNS8HFaXQUtbdmv0tQs+Kxw0cf5TQ8WfuA4/10gfIQdB04t89/1O/w1cDnyilFU="
        }
      })
        .then(function (response) {
          const findCache = admin.database().ref("farmer_info/" + response.data.userId + "/cache");
          findCache.once('value', (snapshot) => {
            let unit = snapshot.val().cache;
            console.log(unit);
            const summary = admin.database().ref("farmer_info/" + response.data.userId);
            summary.once('value', (snapshot) => {
              agent.add("您輸入的土地面積為 : " + request.body.queryResult.queryText + unit  + "\n" + "以下是您的相關資訊 : \n" +"ID : " + snapshot.val().userid + "\n" +  "名稱 : " +  snapshot.val().name +"\n" + "種植作物 : " + snapshot.val().crop + "\n" + "種植地點 : " + snapshot.val().address + "\n" + "經緯度 : " + snapshot.val().longitude + " , " + snapshot.val().latitude + "\n" + "種植面積 : " + snapshot.val().land + "\n感謝提供的資訊，有任何問題都可以詢問我喔！");
              resolve(snapshot.val().userid)
            });
            let push_landAmount = admin.database().ref("farmer_info/" + response.data.userId);
            push_landAmount.update({ land: request.body.queryResult.queryText + unit })
            //resolve(unit)
          });
        })
        .catch(function (error) {
          console.log(error);
          reject();
        });
    });
  }
  function askCropDistribution(agent) {
    return new Promise((resolve, reject) => {
    const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
    searchDistribution.once('value', (snapshot) => {
      if(snapshot.val().適合種植地區 !== NaN && snapshot.val().適合種植地區 !== undefined ){
      agent.add("你要問 " + request.body.queryResult.parameters.crop + " 的全球分佈嗎?\n" + request.body.queryResult.parameters.crop + "的"+snapshot.val().適合種植地區);
      resolve(snapshot.val())
      }
      else{
        agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
        resolve(request.body.queryResult.parameters.crop)
      }
    });
});
  }

  function getCropName(agent) {
    return new Promise((resolve, reject) => {
      let crop = admin.database().ref("crop");
      axios.get('https://api.line.me/v2/bot/profile/U7df9e7c26a78823be8e1fb89e6f17de5', {
        headers: {
          Authorization: "Bearer y6IdDBqKMAIB92i8AbXDwk9VIi3szDYwry/7r++qoqPz4hqFHxBt/Kn6ClEkniUODGTcDBlS+iShmO1G6IwS5IkMiCFbQWu3qVFulvSYZa2RcNS8HFaXQUtbdmv0tQs+Kxw0cf5TQ8WfuA4/10gfIQdB04t89/1O/w1cDnyilFU="
        }
      })
        .then(function (response) {
          crop.once("value").then(function (snapshot, recArray) {
            console.log(request.body.queryResult.queryText);
            // write crop info to firebase realtimedatabase
            /*
            let push_cropinfo = admin.database().ref("crop/玉米");
            push_cropinfo.set({ 適合種植地區: "世界產地主要分布在30°~50°的緯度之間",適合天氣: "溫暖氣候", 玉米品種: "https://book.tndais.gov.tw/Brochure/pub2-4.htm" ,種植季節:"台灣 春作 : 2月下旬至3月上旬 ; 秋作 9月上旬至11月上旬 ; 備註 : 不同品種有不同的種植季節", 濕度_過低: "50%(需灌溉)",溫度_適宜: "21-27",溫度_過高:"48(停止生長)", 溫度_過低:"4(停止生長)",土壤_不適合:"砂土及黏土",土壤PH值_適宜:"pH值5.0 ~ 8.0(pH值6.0 ~7.0最佳)",土壤PH值_過低: "ph值5.0(補充石灰)",鉀肥_每公頃:"50-80(kg)",氮肥_每公頃:"120-160(kg)",磷肥_每公頃:"60-90(kg)"})
            */
            let cropName = request.body.queryResult.parameters.crop;
            console.log(snapshot.toJSON()[cropName]);
            if (snapshot.val()[cropName] === undefined) {
              agent.add("不好意思您輸入的作物目前還未有資料，請重新輸入其他作物，謝謝！");
              resolve(snapshot.val())
            }
            else {
              agent.add("找到了 " + request.body.queryResult.parameters.crop);
              agent.add("請問您的種植地區在哪呢？");
              let push_cropname = admin.database().ref("farmer_info/" + response.data.userId);
              push_cropname.update({ crop: request.body.queryResult.parameters.crop })
              resolve(snapshot.val())
            }
          });
        })
        .catch(function (error) {
          console.log(error);
          reject();
        });
    });
  }


  function askCropWeather(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().適合天氣 !== NaN && snapshot.val().適合天氣 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 適合天氣嗎?\n" + request.body.queryResult.parameters.crop + "適合生長在: "+snapshot.val().適合天氣);
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }

  function askCropVariety(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().玉米品種 !== NaN && snapshot.val().玉米品種 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 的品種嗎?\n" + request.body.queryResult.parameters.crop + "的品種請參考網址: \n" +snapshot.val().玉米品種);
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropSeason(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().種植季節 !== NaN && snapshot.val().種植季節 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 的種植季節嗎?\n" + request.body.queryResult.parameters.crop + "適合種植的季節在: \n" +snapshot.val().種植季節);
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropSoil(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().土壤_不適合 !== NaN && snapshot.val().土壤_不適合 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 適合種植的土壤嗎?\n" + request.body.queryResult.parameters.crop +" 適合種植在大部分的土壤，唯獨不適合種在 " +snapshot.val().土壤_不適合 + " 當中！");
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropK(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().鉀肥_每公頃 !== NaN && snapshot.val().鉀肥_每公頃 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 適合用多少鉀肥嗎？\n" + request.body.queryResult.parameters.crop +" 適合用的鉀肥量大約在: " +snapshot.val().鉀肥_每公頃 + " 當中！");
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropN(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().氮肥_每公頃 !== NaN && snapshot.val().氮肥_每公頃 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 適合用多少氮肥嗎？\n" + request.body.queryResult.parameters.crop +" 適合用的氮肥量大約在: " +snapshot.val().氮肥_每公頃 + " 當中！");
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropP(agent) {
    return new Promise((resolve, reject) => {
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().磷肥_每公頃 !== NaN && snapshot.val().磷肥_每公頃 !== undefined ){
        agent.add("你要問 " + request.body.queryResult.parameters.crop + " 適合用多少磷肥嗎？\n" + request.body.queryResult.parameters.crop +" 適合用的磷肥量大約在: " +snapshot.val().磷肥_每公頃 + " 當中！");
        resolve(snapshot.val())
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropTemp(agent) {
    return new Promise((resolve, reject) => {
      cropValue = request.body.queryResult.parameters.crop
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().溫度_適宜 !== NaN && snapshot.val().溫度_適宜 !== undefined ){
          if( request.body.queryResult.queryText.match("最高") !== null || request.body.queryResult.queryText.match("超過") !== null ){
            agent.add("你要問" + request.body.queryResult.parameters.crop + "最高溫度嗎？\n" + request.body.queryResult.parameters.crop +" 的種植溫度不可以超過 " +snapshot.val().溫度_過高);
            resolve(snapshot.val())
          }
          else if( request.body.queryResult.queryText.match("最低") !== null || request.body.queryResult.queryText.match("低於") !== null ){
            agent.add("你要問" + request.body.queryResult.parameters.crop + "最低溫度嗎？\n" + request.body.queryResult.parameters.crop +" 的種植溫度不可以低於 " +snapshot.val().溫度_過低);
            resolve(snapshot.val())
          }
          else{
        agent.add("你要問" + request.body.queryResult.parameters.crop + "適合種植溫度嗎？\n" + request.body.queryResult.parameters.crop +" 適合的種植溫度大約在: " +snapshot.val().溫度_適宜);
        resolve(snapshot.val())
          }
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }
  function askCropPH(agent) {
    return new Promise((resolve, reject) => {
      cropValue = request.body.queryResult.parameters.crop
      const searchDistribution = admin.database().ref("crop/" + request.body.queryResult.parameters.crop);
      searchDistribution.once('value', (snapshot) => {
        if(snapshot.val().土壤PH值_適宜 !== NaN && snapshot.val().土壤PH值_適宜 !== undefined ){
           if( request.body.queryResult.queryText.match("最低") !== null || request.body.queryResult.queryText.match("低於") !== null ){
            agent.add("你要問" + request.body.queryResult.parameters.crop + "最低PH值嗎？\n" + request.body.queryResult.parameters.crop +" 的種植PH值不可以低於 " +snapshot.val().土壤PH值_過低);
            resolve(snapshot.val())
          }
          else{
        agent.add("你要問" + request.body.queryResult.parameters.crop + "適合種植PH值嗎？\n" + request.body.queryResult.parameters.crop +" 適合的種植PH大約在: " +snapshot.val().土壤PH值_適宜);
        resolve(snapshot.val())
          }
        }
        else{
          agent.add("很抱歉,尚無 " + request.body.queryResult.parameters.crop + " 相關資料可查詢喔");
          resolve(request.body.queryResult.parameters.crop)
        }
      });
  });
  }


  let intentMap = new Map();
  intentMap.set('greeting', greeting);
  intentMap.set('getCropAddress', getCropAddress);
  intentMap.set('getUnit', getUnit);
  intentMap.set('getUnitAmount', getUnitAmount);
  intentMap.set('askCropDistribution', askCropDistribution);
  intentMap.set('getCropName', getCropName);
  intentMap.set('askCropWeather', askCropWeather);
  intentMap.set('askCropVariety', askCropVariety);
  intentMap.set('askCropSeason', askCropSeason);
  intentMap.set('askCropSoil', askCropSoil);
  intentMap.set('askCropK', askCropK);
  intentMap.set('askCropN', askCropN);
  intentMap.set('askCropP', askCropP);
  intentMap.set('askCropTemp', askCropTemp);
  intentMap.set('askCropPH', askCropPH);






  intentMap.set('Default Fallback Intent', fallback);
  agent.handleRequest(intentMap);
});



/* 暫存的參考 code
var callRoadApi = (roadName) => {
    return new Promise((resolve, reject) => {
        // let path = "http://data.tycg.gov.tw/api/v1/rest/datastore/27d2edc9-890e-4a42-bcae-6ba78dd3c331?format=json";
        http.get({ host: "data.tycg.gov.tw", path: "/api/v1/rest/datastore/27d2edc9-890e-4a42-bcae-6ba78dd3c331?format=json" }, (res) => {
            // http.get(path, res => {
            let body = ''; // var to store the response chunks
            res.on('data', (d) => { body += d; }); // store each response chunk
            res.on('end', () => {
                let response = JSON.parse(body);
                let records = response.result.records;
                let r = records.filter((n) => {
                    if (n.rd_name.indexOf(roadName) > -1) {
                        return n
                    }
                })
                if (r.length > 0) {
                    resolve(r)
                } else {
                    console.log("fail it")
                    reject()
                }
            });
            res.on('error', (error) => {
                console.log(`Error calling the weather API: ${error}`)
                reject();
            });
        })
    })
}
*/



