
let UserInfo  = require('../Models/UserInfo');
let Phone     = require('../Models/Phone');
let GiftCode  = require('../Models/GiftCode');
let validator = require('validator');
let Helpers   = require('../Helpers/Helpers');

module.exports = function(client, data){
	if (!!data.captcha && !!data.code) {
		let code = ''+data.code+'';
		if (!validator.isLength(code, {min: 4, max: 16})) {
			client.red({notice: {title: 'LỖI', text: 'sv_ms_giftcode_not_exits'}});
		} else {
			let checkCaptcha = new RegExp().test(client.captcha);
			if (checkCaptcha) {
				//code = code.toLowerCase();
				UserInfo.findOne({id:client.UID}, 'gitCode gitTime', function(errCheckG, CheckG){
					if (!!CheckG) {
						Phone.findOne({uid:client.UID}, 'gitCode', function(errPhone, dPhone){
							let quyen = false;
							if (CheckG.gitCode === void 0 || CheckG.gitCode === 0 || !!dPhone) {
								quyen = true;
							}
							if (quyen) {
								let timeQuyen = false;
								if (CheckG.gitTime === void 0) {
									timeQuyen = true;
								}else{
									let dateT = new Date();
									dateT.setHours(0,0,0,0);
									let dateH = CheckG.gitTime;
									dateH.setHours(0,0,0,0);
									if (dateT-dateH > 86400000) {
										timeQuyen = true;
									}
								}
								if (timeQuyen) {
									GiftCode.findOne({'code':code}, {}, function(err, check) {
										if (!!check) {
											let d1 = Date.parse(new Date());
											let d2 = Date.parse(check.todate);
											if (d2 > d1) {
												if (void 0 !== check.uid) {
													client.red({notice:{title:'THẤT BẠI',text:'sv_ms_giftcode_used.' + '\n' + ' sv_ms_giftcode_try_another'}});
												}else{
													if (validator.isEmpty(check.type)) {
														check.uid = client.UID;
														check.save();
														UserInfo.findOneAndUpdate({id:client.UID}, {$set:{gitTime:new Date()}, $inc:{red:check.red, xu:check.xu, gitCode:1, gitRed:check.red}}).exec(function(err, user){
															client.red({notice:{title:'THÀNH CÔNG',text:'sv_ms_you_receviced ' + (check.red > 0 ? Helpers.numberWithCommas(check.red) + ' R' : '') + (check.xu > 0 ? (check.red > 0 ? ' và ' : '') + Helpers.numberWithCommas(check.xu) + ' XU' : '')}, user:{red:user.red*1+check.red, xu:user.xu*1+check.xu}});
														});
													}else{
														GiftCode.findOne({'uid':client.UID, 'type':check.type}, 'code', function(err, check2) {
															if (!!check2) {
																client.red({notice:{title:'THẤT BẠI',text:'sv_ms_you_receviced_before'}});
															}else{
																check.uid = client.UID;
																check.save();
																UserInfo.findOneAndUpdate({id:client.UID}, {$set:{gitTime:new Date()}, $inc:{red:check.red, xu:check.xu, gitCode:1, gitRed:check.red}}).exec(function(err, user){
																	client.red({notice:{title:'THÀNH CÔNG',text:'sv_ms_you_receviced ' + (check.red > 0 ? Helpers.numberWithCommas(check.red) + ' RED' : '') + (check.xu > 0 ? (check.red > 0 ? ' và ' : '') + Helpers.numberWithCommas(check.xu) + ' XU' : '')}, user:{red:user.red*1+check.red, xu:user.xu*1+check.xu}});
																});
															}
														})
													}
												}
											}else{
												client.red({notice:{title:'THẤT BẠI',text:'sv_ms_giftcode_expried'}});
											}
										}else{
											client.red({notice:{title:'THẤT BẠI',text:'sv_ms_giftcode_not_exits'}});
										}
									});
								}else{
									client.red({notice:{title:'THÔNG BÁO', text:'sv_ms_giftcode_today_receviced'}});
								}
							}else{
								client.red({notice:{title:'THẤT BẠI', text:'sv_ms_giftcode_only_verified_account', button:{text:'KÍCH HOẠT', type:'reg_otp'}}});
							}
						});
					}
				});
			}else{
				client.red({notice:{title:'THẤT BẠI',text:'sv_ms_capcha_error'}});
			}
		}
	}
	client.c_captcha('giftcode');
}
