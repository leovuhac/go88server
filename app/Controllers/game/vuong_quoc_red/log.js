
var VuongQuocRed_red = require('../../../Models/VuongQuocRed/VuongQuocRed_red');
module.exports = function(client, data){
	if (!!data && !!data.page) {
		var page = data.page>>0; // trang
		if (page < 1) {
			client.red({notice:{text: 'sv_ms_data_incorrect', title: 'THẤT BẠI'}});
		}else{
			var kmess = 10;
			VuongQuocRed_red.countDocuments({name:client.profile.name}).exec(function(err, total){
				VuongQuocRed_red.find({name:client.profile.name}, 'id win bet kq time', {sort:{'_id':-1}, skip: (page-1)*kmess, limit: kmess}, function(err, result) {
					Promise.all(result.map(function(obj){
						obj = obj._doc;
						delete obj._id;
						return obj;
					}))
					.then(resultArr => {
						client.red({VuongQuocRed:{log:{data:resultArr, page:page, kmess:kmess, total:total}}});
					})
				});
			});
		}
	}
};
