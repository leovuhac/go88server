let validator = require('validator');
let User      = require('./app/Models/Users');
let UserInfo  = require('./app/Models/UserInfo');
let helpers   = require('./app/Helpers/Helpers');
let socket    = require('./app/socket.js');
let captcha   = require('./captcha');
let forgotpass = require('./app/Controllers/user/for_got_pass');
let UserController = require('./app/Controllers/User');
// Authenticate!
let authenticate = function(client, data, callback) {
	if (!!data){
		let token = data.token;
		if (!!token && !!data.id) {
			let id = data.id>>0;
			UserInfo.findOne({'UID':id}, 'id', function(err, userI){
				if (!!userI) {
					User.findOne({'_id':userI.id}, 'local fail lock', function(err, userToken){
						if (!!userToken) {
							if (userToken.lock === true) {
								callback({title:'CẤM', text:'sv_ms_account_is_locked'}, false);
								return void 0;
							}
							if (void 0 !== userToken.fail && userToken.fail > 3) {
								callback({title:'THÔNG BÁO', text: 'sv_ms_lets_login !!'}, false);
								userToken.fail  = userToken.fail>>0;
								userToken.fail += 1;
								userToken.save();
							}else{
								if (userToken.local.token === token) {
									userToken.fail = 0;
									userToken.save();
									client.UID = userToken._id.toString();
									callback(false, true);
								}else{
									callback({title:'THẤT BẠI', text:'sv_ms_login_in_other_device'}, false);
								}
							}
						}else{
							callback({title:'THẤT BẠI', text: 'sv_ms_login_reject'}, false);
						}
					});
				}else{
					callback({title:'THẤT BẠI', text:'sv_ms_login_reject'}, false);
				}
			});
		} else if(!!data.username && !!data.password){
			let username = ''+data.username+'';
			let password = ''+data.password+'';
			let captcha  = data.captcha;
			let register = !!data.register;
			let az09     = new RegExp('^[a-zA-Z0-9]+$');
			let testName = az09.test(username);

			if (!validator.isLength(username, {min: 3, max: 32})) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'sv_ms_account_character_length.'}, false);
			}else if (!validator.isLength(password, {min: 6, max: 32})) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'sv_ms_pass_length'}, false);
			}else if (!testName) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'sv_ms_account_format'}, false);
			}else if (username === password) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'sv_ms_acount_password_not_same_error'}, false);
			}else{
				try {
					username = username.toLowerCase();
					// Đăng Ký
					if (register) {
						if (!client.c_captcha) {
							client.c_captcha('signUp');
							callback({title: 'ĐĂNG KÝ', text: 'sv_ms_capcha_not_exits'}, false);
						}else{
							let checkCaptcha = new RegExp();
							checkCaptcha     = checkCaptcha.test(captcha);
							if (checkCaptcha) {
								User.findOne({'local.username':username}).exec(function(err, check){
									if (!!check){
										client.c_captcha('signUp');
										callback({title: 'ĐĂNG KÝ', text: 'sv_ms_account_already_exits'}, false);
									}else{
										User.create({'local.username':username, 'local.password':helpers.generateHash(password), 'local.regDate': new Date()}, function(err, user){
											if (!!user){
												client.UID = user._id.toString();
												callback(false, true);
											}else{
												client.c_captcha('signUp');
												callback({title: 'ĐĂNG KÝ', text: 'sv_ms_account_already_exits'}, false);
											}
										});
									}
								});
							}else{
								client.c_captcha('signUp');
								callback({title: 'ĐĂNG KÝ', text: 'sv_ms_capcha_error'}, false);
							}
						}
					} else {
						// Đăng Nhập
						User.findOne({'local.username':username}, function(err, user){
							if (user){
								if (user.lock === true) {
									callback({title:'CẤM', text:'sv_ms_account_is_locked'}, false);
									return void 0;
								}
								if (void 0 !== user.fail && user.fail > 3) {
									if (!captcha || !client.c_captcha) {
										client.c_captcha('signIn');
										callback({title:'ĐĂNG NHẬP', text:'sv_ms_fill_capchat_to_continue'}, false);
									}else{
										let checkCLogin = new RegExp('^' + client.captcha + '$', 'i');
										checkCLogin     = checkCLogin.test(captcha);
										if (checkCLogin) {
											if (user.validPassword(password)){
												user.fail = 0;
												user.save();
												client.UID = user._id.toString();
												callback(false, true);
												global['userOnline']++;
											}else{
												client.c_captcha('signIn');
												user.fail += 1;
												user.save();
												callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_login_password_error'}, false);
											}
										}else{
											user.fail += 1;
											user.save();
											client.c_captcha('signIn');
											callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_capcha_error..'}, false);
										}
									}
								}else{
									if (user.validPassword(password)){
									if(!user.local.ban_login){
										user.fail = 0;
										user.save();
										client.UID = user._id.toString();
										callback(false, true);
									}else{
										callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_account_locked_contact'}, false);
									}
									}else{
										user.fail  = user.fail>>0;
										user.fail += 1;
										user.save();
										callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_login_password_error'}, false);
									}
								}
							}else{
								callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_account_not_exits'}, false);
							}
						});
					}
				} catch (error) {
					callback({title: 'THÔNG BÁO', text: 'sv_ms_has_error_try_again'}, false);
				}
			}
		}
	}
};

let authenticateWallet = function(client, data, callback, callbackloginedWallet = false) {
		let token = data.token;
		if (!!token && !!data.id) {
			let id = data.id>>0;
			fs.appendFile('log.txt', "\n----user token--\n"+ id + " ---  " + token, function (err) {
				if (err) throw err;
			});
			UserInfo.findOne({'UID':id}, 'id', function(err, userI){
				if (!!userI) {
					User.findOne({'_id':userI.id}, 'local fail lock', function(err, userToken){
						if (!!userToken) {
							if (userToken.lock === true) {
								callback({title:'CẤM', text:'sv_ms_account_is_locked'}, false);
								return void 0;
							}
							if (void 0 !== userToken.fail && userToken.fail > 3) {
								callback({title:'THÔNG BÁO', text: 'sv_ms_lets_login !!'}, false);
								userToken.fail  = userToken.fail>>0;
								userToken.fail += 1;
								userToken.save();
							}else{
								if (userToken.local.token === token) {
									userToken.fail = 0;
									userToken.save();
									client.UID = userToken._id.toString();
									callback(false, true);
								}else{
									callback({title:'THẤT BẠI', text:'sv_ms_login_in_other_device'}, false);
								}
							}
						}else{
							callback({title:'THẤT BẠI', text: 'sv_ms_login_reject'}, false);
						}
					});
				}else{
					callback({title:'THẤT BẠI', text:'sv_ms_login_reject'}, false);
				}
			});
		}
		else{
			let username = ''+data.username+'';
			let password = ''+data.password+'';
			if(!callbackloginedWallet){
				client.UID = username;
				client.data = data;
				client.callback2 = callback;
				UserController.socketClients.push(client);
				//waitting wallet
			}
			else{
				User.findOne({'local.username':username}, function(err, user){
					if (user){
						if (user.lock === true) {
							callback({title:'CẤM', text:'sv_ms_account_is_locked'}, false);
							return void 0;
						}
						if (void 0 !== user.fail && user.fail > 3) {
							if (user.validPassword(password)){
								user.fail = 0;
								user.save();
								client.UID = user._id.toString();
								callback(false, true);
								global['userOnline']++;
							}else{
								client.c_captcha('signIn');
								user.fail += 1;
								user.save();
								callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_login_password_error'}, false);
							}
						}else{
							if (user.validPassword(password)){
							if(!user.local.ban_login){
								user.fail = 0;
								user.save();
								client.UID = user._id.toString();
								callback(false, true);
							}else{
								callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_account_locked_contact'}, false);
							}
							}else{
								user.fail  = user.fail>>0;
								user.fail += 1;
								user.save();
								callback({title: 'ĐĂNG NHẬP', text: 'sv_ms_login_password_error'}, false);
							}
						}
					}else{
						//register account by wallet
						User.create({'local.username':username, 'local.password':helpers.generateHash(password), 'local.regDate': new Date()}, function(err, user){
							if (!!user){
								client.UID = user._id.toString();
								callback(false, true);
							}else{
								client.c_captcha('signUp');
								callback({title: 'ĐĂNG KÝ', text: 'sv_ms_account_already_exits'}, false);
							}
						});
			
					}
				});
			}

		}
}

let main = function (ws, redT) {
	ws.auth      = false;
	ws.UID       = null;
	ws.captcha   = {};
	ws.c_captcha = captcha;
	ws.red = function(data){
		try {
			this.readyState == 1 && this.send(JSON.stringify(data));
		} catch(err) {}
	}
	socket.signMethod(ws);
	ws.on('message', function(message) {
		try {
			if (!!message) {
				message = JSON.parse(message);
				if (!!message.captcha) {
					this.c_captcha(message.captcha);
				}
				if (!!message.forgotpass) {
					forgotpass(this, message.forgotpass);
				}
				if (this.auth == false && !!message.authentication) {
					authenticateWallet(this, message.authentication, function(err, success){
						if (success) {
							this.auth = true;
							this.redT = redT;
							socket.auth(this);
							redT = null;
						} else if (!!err) {
							this.red({unauth: err});
							//this.close();
						} else {
							this.red({unauth: {message:'Authentication failure'}});
							//this.close();
						}
					}.bind(this), false);
					// authenticate(this, message.authentication, function(err, success){
					// 	if (success) {
					// 		this.auth = true;
					// 		this.redT = redT;
					// 		socket.auth(this);
					// 		redT = null;
					// 	} else if (!!err) {
					// 		this.red({unauth: err});
					// 		//this.close();
					// 	} else {
					// 		this.red({unauth: {message:'Authentication failure'}});
					// 		//this.close();
					// 	}
					// }.bind(this));
				}else if(!!this.auth){
					socket.message(this, message);
				}
			}
		} catch (error) {
		}
	});
	ws.on('close', function(message) {
		if (this.UID !== null && void 0 !== this.redT.users[this.UID]) {
			if (this.redT.users[this.UID].length === 1 && this.redT.users[this.UID][0] === this) {
				delete this.redT.users[this.UID];
			}else{
				var self = this;
				this.redT.users[this.UID].forEach(function(obj, index){
					if (obj === self) {
						self.redT.users[self.UID].splice(index, 1);
					}
				});
			}
		}
		this.auth = false;
		void 0 !== this.TTClear && this.TTClear();
		global['userOnline'] = global['userOnline']--;
	});
};

module.exports = {
	main:main,
	authenticateWallet:  authenticateWallet,
};

