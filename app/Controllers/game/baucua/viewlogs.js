
var BauCua_cuoc  = require('../../../Models/BauCua/BauCua_cuoc');
var BauCua_phien = require('../../../Models/BauCua/BauCua_phien');

module.exports = function(client, data){
	if (!!data && !!data.page) {
		let page = data.page>>0;
		let red  = true;
		if (page < 1) {
			client.red({notice:{text:'sv_ms_data_incorrect', title:'THẤT BẠI'}});
		}else{
			let kmess = 9;
			BauCua_cuoc.countDocuments({uid:client.UID, thanhtoan:true}).exec(function(err, total){
				BauCua_cuoc.find({uid:client.UID, thanhtoan:true}, {}, {sort:{'_id':-1}, skip:(page-1)*kmess, limit:kmess}, function(err, result) {
					if (result.length) {
						Promise.all(result.map(function(obj){
							obj = obj._doc;
							var getPhien = BauCua_phien.findOne({id:obj.phien}).exec();
							return Promise.all([getPhien]).then(values => {
								obj.kq = [values[0].dice1, values[0].dice2, values[0].dice3];
								delete obj.__v;
								delete obj._id;
								delete obj.thanhtoan;
								delete obj.uid;
								delete obj.red;
								return obj;
							});
						}))
						.then(function(arrayOfResults) {
							client.red({mini:{baucua:{viewlogs:{data:arrayOfResults, page:page, kmess:kmess, total:total}}}});
						})
					}else{
						client.red({mini:{baucua:{viewlogs:{data:[], page:page, kmess:kmess, total:0}}}});
					}
				});
			})
		}
	}
};
