
var path     = require('path');
var fs       = require('fs');

module.exports = function(client, data) {
	var file = require('../../../../../config/candy.json');
	var chedo = null;
	if (data == '0') {
		chedo = 0;
	}
	if (data == '1') {
		chedo = 1;
	}
	if (data == '2') {
		chedo = 2;
	}
	if (chedo !== null) {
		file.chedo = chedo;
		var txt = JSON.stringify(file);
		fs.writeFile(path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(__dirname))))) + '/config/candy.json', txt, function(err){
			if (!!err) {
				client.red({notice:{title:'THẤT BẠI', text:'sv_ms_change_mode_false'}});
			}
		});
	}else{
		client.red({notice:{title:'THẤT BẠI', text:'sv_ms_change_mode_false'}});
	}
}
