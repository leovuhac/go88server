
let Daohaitac_red = require('../../../Models/Daohaitac/Daohaitac_red');
module.exports = function(client, data){
	if (!!data && !!data.page) {
		let page = data.page>>0; // trang
		if (page < 1) {
			client.red({notice:{text: 'sv_ms_data_incorrect', title: 'THẤT BẠI'}});
		}else{
			let kmess = 10;
			Daohaitac_red.countDocuments({name: client.profile.name}).exec(function(err, total){
				Daohaitac_red.find({name: client.profile.name}, 'id win bet kq time', {sort:{'_id':-1}, skip: (page-1)*kmess, limit: kmess}, function(err, result) {
					Promise.all(result.map(function(obj){
						obj = obj._doc;
						delete obj._id;
						return obj;
					}))
					.then(resultArr => {
						client.red({daohaitac:{log:{data:resultArr, page:page, kmess:kmess, total:total}}});
					})
				});
			});
		}
	}
};
