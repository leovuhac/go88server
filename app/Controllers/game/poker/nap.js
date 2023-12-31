
let UserInfo = require('../../../Models/UserInfo');
let Helpers  = require('../../../Helpers/Helpers');

module.exports = function(client, data){
	if (!!data.balans) {
		let balans = data.balans>>0;
		let auto   = !!data.auto;
		let room   = client.poker.game;
		let min = room*20;
		let max = room*200;
		if (balans < min || balans > max) {
			client.red({notice:{title:'THẤT BẠI', text:'sv_ms_data_incorrect', load:false}});
		}else{

			let totall = client.poker.balans+balans;
			if(totall > max){
				client.red({notice:{title:'THẤT BẠI', text:'sv_ms_min_coin_max_error', load:false}});
			}else{
				UserInfo.findOne({id:client.UID}, 'red', function(err, user){
					//vuld
					// user.red = 100000;
					if (!user || user.red < min) {
						client.red({notice:{title:'THẤT BẠI', text:'sv_ms_min_coin_need_error', load:false}});
					}else{
						if (user.red < balans) {
							client.red({notice:{title:'THẤT BẠI', text:'sv_ms_min_coin_not_enough_error', load:false}});
						}else{
							user.red -= balans;
							user.save();
							client.poker.balans += balans;
							client.poker.autoNap = auto;
							client.poker.room.sendToAll({game:{player:{ghe:client.poker.map, data:{balans:client.poker.balans}, info:{nap:balans}}}}, client.poker);
							client.red({load:false, nap:false, game:{player:{ghe:client.poker.map, data:{balans:client.poker.balans}, info:{nap:balans}}}});
						}
					}
				});
			}
		}
	}
};
