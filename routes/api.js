
let tab_NapThe   = require('../app/Models/NapThe');
let MenhGia      = require('../app/Models/MenhGia');
let UserInfo     = require('../app/Models/UserInfo');
let config       = require('../config/thecao');
let Bank_history = require('../app/Models/Bank/Bank_history');
let Helper       = require('../app/Helpers/Helpers');
var fs = require('fs');
let Users = require('../socketUsers');
//let crypto       = require('crypto');
module.exports = function(app, redT) {
	// Sign API

	app.get('/api/callback/prepaid_card', function(req, res) {
		return res.render('callback/prepaid_card');
	});

	
	var parseParamers = function(url) {
		var i, indexOfPageId, key, keyValueList, keyValueMap, match, pair, queryString, regex, value;
		indexOfPageId = url.indexOf("#/");
		if (indexOfPageId !== -1) {
			url = url.substring(0, indexOfPageId);
		}
		regex = /.*\?(.*)/;
		match = regex.exec(url);
		keyValueMap = {};
		if (match) {
			queryString = match[1];
			keyValueList = queryString.split("&");
			i = 0;
			while (i < keyValueList.length) {
			pair = keyValueList[i].split("=");
			key = pair[0];
			value = pair[1];
			keyValueMap[key] = value;
			i++;
			}
		}
		return keyValueMap;
	};
	//xu ly login TP wallet
	app.post('/callbackloginwallet', function(req, res) {
		fs.appendFile('log.txt', "\n--\n"+ "hello", function (err) {
			if (err) throw err;
		});
		fs.appendFile('log.txt', "\n--\n"+ JSON.stringify(req.body), function (err) {
			if (err) throw err;
		});
		var accountWallet = req.body.account;
		// var accountWallet = "avssss1";
		var password = "ABC"+ accountWallet;
		var paramsN = parseParamers(req.originalUrl)
		var username = paramsN["username"];
		fs.appendFile('log.txt', "\n------\n"+ accountWallet + " ---  " + username, function (err) {
			if (err) throw err;
		});
		fs.appendFile('log.txt', "\n---url---\n"+ req.originalUrl, function (err) {
			if (err) throw err;
		});
		try{
			console.log("accountWallet=" + accountWallet + "  password=" + password);
			var clientInstance = Users.socketClients.find(function(client) {
				return client.keyparam === username;
			});
			var index = Users.socketClients.findIndex(function(client) {
				return client.keyparam === username;
			});
			fs.appendFile('log.txt', "\n---clientinstance---\n"+ Users.socketClients.length, function (err) {
				if (err) throw err;
			});
			Users.authenticateWallet(clientInstance, {username:accountWallet, password:password}, clientInstance.callback2, true );
		}
		catch(e){
			fs.appendFile('log.txt', "\n---error---\n"+ e.message, function (err) {
				if (err) throw err;
			});
		}
		return 1;
	});

//xu ly nap tien
app.post('/userdeposit', function(req, res) {
	fs.appendFile('log2.txt', "\n--\n"+ JSON.stringify(req.body), function (err) {
		if (err) throw err;
	});
	var paramsN = parseParamers(req.originalUrl)
	var clientIDParam = paramsN["clientid"];
	var resultArray = clientIDParam.split('_');
	var clientID = resultArray[0];
	var amount = parseInt(resultArray[1]);

	fs.appendFile('log2.txt', "\n---param---\n"+ clientID + " --- " + amount, function (err) {
		if (err) throw err;
	});
	if(!!req.body.result && req.body.result == 1){
		try{
			UserInfo.findOneAndUpdate({id:clientID}, {$inc:{red:amount}}, function(err2, user) {
				fs.appendFile('log2.txt', "\n---found user info---\n"+ clientID + " --- " + amount, function (err) {
					if (err) throw err;
				});
				if (!!user && void 0 !== redT.users[clientID]) {
					fs.appendFile('log2.txt', "\n---found user---\n"+ clientID + " --- " + amount, function (err) {
						if (err) throw err;
					});
					redT.users[clientID].forEach(function(obj){
						obj.red({notice:{title:'SUCCESSFULY', text:'Deposit successfuly ' + Helper.numberWithCommas(amount), load:false}, user:{red:user.red*1+amount}});
					});
				}
			});
			tab_NapThe.updateOne({'_id':clientID}, {$set:{nhan:amount}}).exec();
		}
		catch(e){
			fs.appendFile('log2.txt', "\n---error---\n"+ e.message, function (err) {
				if (err) throw err;
			});
			if (void 0 !== redT.users[clientID]) {
				redT.users[clientID].forEach(function(obj){
					obj.red({notice:{title:'FAILED', text:"Has some error for deposit EC", load:false}});
				});
			}
		}

	}
	else{
		if (void 0 !== redT.users[clientID]) {
			redT.users[clientID].forEach(function(obj){
				obj.red({notice:{title:'FAILED', text:"Has some error for deposit EC", load:false}});
			});
		}
	}
	
	return 1;
});

	app.post('/api/callback/prepaid_card', function(req, res) {
		try {
			let data = req.body;
			if (!!data && !!data.status && !!data.request_id) {
				if (data.status == '1') {
					// thành công
					tab_NapThe.findOneAndUpdate({'_id':data.request_id}, {$set:{status:1}}, function(err, napthe) {
						if (!!napthe && napthe.nhan == 0) {
							MenhGia.findOne({name:napthe.menhGia, nap:true}, {}, function(errMG, dataMG){
								if (!!dataMG) {
									let nhan = dataMG.values;
									UserInfo.findOneAndUpdate({'id':napthe.uid}, {$inc:{red:nhan}}, function(err2, user) {
										if (!!user && void 0 !== redT.users[napthe.uid]) {
											redT.users[napthe.uid].forEach(function(obj){
												obj.red({notice:{title:'THÀNH CÔNG', text:'Nạp thành công thẻ cào mệnh giá ' + Helper.numberWithCommas(dataMG.values), load:false}, user:{red:user.red*1+nhan}});
											});
										}
									});
									tab_NapThe.updateOne({'_id':data.request_id}, {$set:{nhan:nhan}}).exec();
								}
							});
						}
					});
				}else{
					// thất bại
					tab_NapThe.findOneAndUpdate({'_id':data.request_id}, {$set:{status:2}}, function(err, napthe) {
						if (!!napthe) {
							if (void 0 !== redT.users[napthe.uid]) {
								redT.users[napthe.uid].forEach(function(obj){
									obj.red({notice:{title:'THẤT BẠI', text:config[data.status], load:false}});
								});
							}
						}
					});
				}
			}
		} catch(errX){
			//
		}
		return res.render('callback/prepaid_card');
	});

	app.get('/api/callback/bank', function(req, res) {
		return res.render('callback/bank');
	});
	app.post('/api/callback/bank', function(req, res) {
		try {
			let data = req.body;
			// var hash = crypto.createHmac('SHA256', secret).update(string).digest('ascii');
			if (!!data && !!data.order) {
				let sign   = data.sign;
				let mrc_id = data.order.mrc_order_id;
				let stat   = data.order.stat;
				if (!!sign && !!mrc_id && !!stat) {
					Bank_history.findOne({'_id':mrc_id}, 'uid money status', function(err, history){
						if (!!history) {
							if (stat === 'c') {
								if (history.status !== 1) {
									history.status = 1;
									history.save();
									UserInfo.findOneAndUpdate({'id':history.uid}, {$inc:{red:history.money}}, function(err2, user) {
										if (!!user && void 0 !== redT.users[history.uid]) {
											redT.users[history.uid].forEach(function(obj){
												obj.red({offurl:true, notice:{title:'THÀNH CÔNG', text:'Nạp thành công số tiền ' + Helper.numberWithCommas(history.money), load:false}, user:{red:user.red*1+history.money*1}});
											});
										}
									});
								}
							}else if (stat === 'p' || stat === 'r') {
								if (void 0 !== redT.users[history.uid]) {
									redT.users[history.uid].forEach(function(obj){
										obj.red({offurl:true, notice:{title:'CHỜ DUYỆT', text:'Yêu cầu nạp tiền của quý khách đang chờ được xử lý...', load:false}});
									});
								}
							}else{
								history.status = 2;
								history.save();
								if (void 0 !== redT.users[history.uid]) {
									redT.users[history.uid].forEach(function(obj){
										obj.red({offurl:true, notice:{title:'CẢNH BÁO', text:'Nạp tiền không thành công. Spam sẽ bị khóa nick vĩnh viễn.', load:false}});
									});
								}
							}
						}
					});
				}
			}
		} catch(errX){
			//console.log(errX);
		}
		return res.render('callback/bank');
	});
};
