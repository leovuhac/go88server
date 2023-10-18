
var Admin     = require('../../Models/Admin');
var validator = require('validator');
var Helper    = require('../../Helpers/Helpers');

function first(client) {
	var data = {
		Authorized: true,
	};
	client.red(data);
}

function changePassword(client, data){
	if (!!data && !!data.password && !!data.newPassword && !!data.newPassword2) {
		if (!validator.isLength(data.password, {min: 6, max: 32})) {
			client.red({notice: {title:'LỖI', text: 'sv_ms_pass_length'}});
		}else if (!validator.isLength(data.newPassword, {min: 6, max: 32})) {
			client.red({notice: {title:'LỖI', text: 'sv_ms_pass_length'}});
		}else if (!validator.isLength(data.newPassword2, {min: 6, max: 32})) {
			client.red({notice: {title:'LỖI', text: 'sv_ms_pass_length'}});
		} else if (data.password == data.newPassword){
			client.red({notice: {title:'LỖI', text: 'Password not same as old password!!'}});
		} else if (data.newPassword != data.newPassword2){
			client.red({notice: {title:'LỖI', text: 'sv_ms_reconfirm_pass_error'}});
		} else {
			Admin.findOne({'_id': client.UID}, function(err, user){
				if (user !== null) {
					if (Helper.validPassword(data.password, user.password)) {
						Admin.updateOne({'_id': client.UID}, {$set:{'password':Helper.generateHash(data.newPassword)}}).exec();
						client.red({notice:{title:'ĐỔI MẬT KHẨU',text:'Success.'}});
					}else{
						client.red({notice:{title:'ĐỔI MẬT KHẨU',text:'Failed.'}});
					}
				}
			});
		}
	}
}

function onData(client, data) {
	if (!!data) {
		if (!!data.doi_pass) {
			changePassword(client, data.doi_pass)
		}
	}
}

module.exports = {
	first: first,
	onData: onData,
}
