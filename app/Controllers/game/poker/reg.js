
let UserInfo = require('../../../Models/UserInfo');
let Helpers  = require('../../../Helpers/Helpers');
let Player   = require('./lib/player');

module.exports = function(client, data){
	if (!!data.room && !!data.balans) {
		let room   = data.room>>0;
		let balans = data.balans>>0;
		let auto   = !!data.auto;

		if (room == 100 ||
			room == 200 ||
			room == 500 ||
			room == 1000 || 
			room == 2000 ||
			room == 5000 ||
			room == 10000 ||
			room == 20000 ||
			room == 50000 ||
			room == 100000 ||
			room == 200000 ||
			room == 500000)
		{
			let min = room*20;
			let max = room*200;
			if (balans < min || balans > max) {
				client.red({notice:{title:'THẤT BẠI', text:'sv_ms_data_incorrect', load: false}});
			}else{
				let inGame = false;
				if (client.redT.users[client.UID]) {
					client.redT.users[client.UID].forEach(function(obj){
						if(!!obj.poker){
							inGame = true;
						}
					});
					if (inGame) {
						client.red({notice:{title:'CẢNH BÁO', text:'sv_ms_session_notify', load: false}});
						min  = null;
						room = null;
						balans = null;
						auto = null;
						client = null;
					}else{						
						UserInfo.findOne({id: client.UID}, 'red name', function(err, user){
							//vuld
							// user.red = 100000;
							if (!user || user.red < min) {
								client.red({notice:{title:'THẤT BẠI', text:'sv_ms_min_coin_need_error', load: false}});
							}else{
								if (user.red < balans) {
									let minMang = user.red;
									if (min < 1000000){
										minMang = (((minMang/room)*2)>>0)*(room/2);
									}else{
										minMang = (((minMang/min)*2)>>0)*(min/2);
									}
									client.red({notice:{title:'THẤT BẠI', text:'sv_ms_min_coin_max_error', load: false}});
								}else{
									user.red -= balans;
									user.save();
									client.poker = new Player(client, room, balans, auto);
									client.red({toGame:'Poker'});
									//client.red({notice:{title:'BẢO TRÌ', text:'Game đang bảo trì...', load: false}});
								}
								min  = null;
								room = null;
								balans = null;
								auto = null;
								client = null;
							}
						});
					}
				}
			}
		}else{
			client.red({notice:{title:'THẤT BẠI', text:'sv_ms_data_incorrect', load: false}});
			room = null;
			balans = null;
			auto = null;
			client = null;
		}
	}
};
