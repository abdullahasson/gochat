class GetUsers {
    constructor(dao) {
        this.dao = dao;
    }

createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS users (
      idreg INTEGER PRIMARY KEY AUTO_INCREMENT,
      bg VARCHAR(255) DEFAULT "#FFFFFF",
      copic VARCHAR(255) DEFAULT "#FFFFFF",
      mscol VARCHAR(255) DEFAULT "#000000",
      mcol VARCHAR(255) DEFAULT "#000000",
      ucol VARCHAR(255) DEFAULT "#000000",
      evaluation INT DEFAULT 0,
      ico VARCHAR(255) DEFAULT "",
      ip VARCHAR(255) DEFAULT "",
      device VARCHAR(255) DEFAULT "",
      id VARCHAR(255),
      lid VARCHAR(255),
	  uid VARCHAR(255),
      msg VARCHAR(255) DEFAULT "(عضو جديد)",
      youtube VARCHAR(255) DEFAULT "",
      pic VARCHAR(255) DEFAULT "site/pic.png",
      cover VARCHAR(255) DEFAULT "site/cover.png",
      power VARCHAR(255) DEFAULT "",
      atar VARCHAR(255) DEFAULT "",
      back VARCHAR(255) DEFAULT "",
      rep BIGINT DEFAULT 0,
      topic VARCHAR(255) NOT NULL,
      username TEXT,
      password VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL,
      loginG BOOLEAN DEFAULT false,
      muted BOOLEAN DEFAULT false,
      verification INTEGER DEFAULT 0,
      ifedit INTEGER DEFAULT 0,
	  lastssen TEXT,
	  joinuser TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
        return this.dao.run(sql);
};
	

create(data) {
	if (typeof data == 'object') {
		return this.dao.run("INSERT INTO users (ifedit,atar,back,pic,cover,verification,ip,device,power,id,lid,uid,topic,username,password,token) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
		[data['ifedit'],data['atar'],data['back'],data['pic'],data['cover'],data['verification'],data['ip'],data['device'],data['power'],data['id'], data['lid'],data['uid'], data['topic'], data['username'], data['password'], data['token']]);
	};
};
updateBck(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET back = ? WHERE idreg = ?`, [data.back, data.idreg]);
    }
}
/* [ADDED] إشعار زيارة البروفايل (تصميم العضوية) */
ensureVisitNotif() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'visitnotif'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN visitnotif INTEGER DEFAULT 0");
        }
    }).catch((e) => { console.log("visitnotif column error:", e && e.message); });
}
/* [ADDED - PHASE 1] ضمان وجود عمود cover (للقواعد القديمة) */
ensureCover() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'cover'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN cover VARCHAR(255) DEFAULT ''");
        }
    }).catch((e) => { console.log("cover column error:", e && e.message); });
}
/* [ADDED] إخفاء عناصر العضو (علم/حالة/اسم/وصف/هاشتاق) - bitmask */
ensureUhide() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'uhide'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN uhide INTEGER DEFAULT 0");
        }
    }).catch((e) => { console.log("uhide column error:", e && e.message); });
}
updateUhide(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET uhide = ? WHERE idreg = ?`, [data.uhide | 0, data.idreg]);
    }
}
/* [ADDED] خط زخرفة الاسم (اسم الخط فقط، والتحقق منه في السيرفر) */
ensureNfont() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'nfont'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN nfont VARCHAR(40) DEFAULT ''");
        }
    }).catch((e) => { console.log("nfont column error:", e && e.message); });
}
updateNfont(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET nfont = ? WHERE idreg = ?`, [data.nfont || "", data.idreg]);
    }
}
/* [ADDED] تأثير حركة الاسم (الصيغة "تأثير:سرعة"، والتحقق منها في السيرفر) */
ensureNfx() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'nfx'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN nfx VARCHAR(24) DEFAULT ''");
        }
    }).catch((e) => { console.log("nfx column error:", e && e.message); });
}
updateNfx(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET nfx = ? WHERE idreg = ?`, [data.nfx || "", data.idreg]);
    }
}
/* [ADDED] تأثير لون الاسم (الصيغة "#لون1,#لون2,اتجاه,لمعة"، والتحقق منها في السيرفر) */
ensureNclr() {
    return this.dao.all("SHOW COLUMNS FROM users LIKE 'nclr'").then((cols) => {
        if (!cols || cols.length == 0) {
            return this.dao.run("ALTER TABLE users ADD COLUMN nclr VARCHAR(40) DEFAULT ''");
        }
    }).catch((e) => { console.log("nclr column error:", e && e.message); });
}
updateNclr(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET nclr = ? WHERE idreg = ?`, [data.nclr || "", data.idreg]);
    }
}
updateVisitNotif(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET visitnotif = ? WHERE idreg = ?`, [data.visitnotif ? 1 : 0, data.idreg]);
    }
}
updateAtar(data) {
    if (data) {
        return this.dao.run(`UPDATE users SET atar = ? WHERE idreg = ?`, [data.atar, data.idreg]);
    }
}
updateBy(data){
	if(typeof data == 'object'){
		if(data['state'] == 'updateIp'){
            return this.dao.run(`UPDATE users SET ip = ? , id = ?,lastssen = ?, device = ? WHERE uid = ?`, [data['ip'],data['id'],'',data['device'], data['uid']]);			
		}else if(data['state'] == 'updatePic'){
            return this.dao.run(`UPDATE users SET pic = ? WHERE uid = ?`, [data['pic'], data['uid']]);
        }else if(data['state'] == 'updateCover'){
            return this.dao.run(`UPDATE users SET cover = ? WHERE uid = ?`, [data['cover'], data['uid']]);
		}else if(data['state'] == 'updateMsg'){
            return this.dao.run(`UPDATE users SET msg = ? WHERE uid = ?`, [data['msg'], data['uid']]);
        }else if(data['state'] == 'updateYoutube'){
            return this.dao.run(`UPDATE users SET youtube = ? WHERE uid = ?`, [data['youtube'], data['uid']]);
		}else if(data['state'] == 'updateIco'){
            return this.dao.run(`UPDATE users SET ico = ? WHERE uid = ?`, [data['ico'], data['uid']]);
		}else if(data['state'] == 'updateName'){
            return this.dao.run(`UPDATE users SET topic = ? WHERE uid = ?`, [data['topic'], data['uid']]);
		}else if(data['state'] == 'updateLike'){
            return this.dao.run(`UPDATE users SET evaluation = ? WHERE uid = ?`, [data['evaluation'], data['uid']]);
		}else if(data['state'] == 'updateRep'){
            return this.dao.run(`UPDATE users SET rep = ? WHERE uid = ?`, [data['rep'], data['uid']]);
		}else if(data['state'] == 'updatePass'){
            return this.dao.run(`UPDATE users SET password = ? WHERE idreg = ?`, [data['password'], data['idreg']]);
		}else if(data['state'] == 'updateMute'){
            return this.dao.run(`UPDATE users SET muted = ? WHERE uid = ?`, [data['muted'], data['uid']]);
		}else if(data['state'] == 'updatePower'){
            return this.dao.run(`UPDATE users SET power = ? WHERE uid = ?`, [data['power'], data['uid']]);
		}else if(data['state'] == 'updatePoint'){
            return this.dao.run(`UPDATE users SET evaluation = 0`);
		}else if(data['state'] == 'updateVer'){
            return this.dao.run(`UPDATE users SET verification = ? WHERE username = ?`, [data['verification'], data['username']]);
		}else if(data['state'] == 'updateVerLogin'){
            return this.dao.run(`UPDATE users SET verification = ?, loginG = ?, ifedit = ? WHERE idreg = ?`, [data['verification'],data['loginG'],data['ifedit'], data['idreg']]);
		}else if(data['state'] == 'updateProfile'){
            return this.dao.run(`UPDATE users SET bg = ? , copic = ? , ucol = ? , topic = ? , mcol = ?, mscol = ? , msg = ?, youtube = ? WHERE uid = ?`, 
			[data['bg'],data['copic'],data['ucol'],data['topic'],data['mcol'],data['mscol'],data['msg'],data['youtube'],data['uid']]
			);		}else if(data['state'] == 'updateSeen'){
            return this.dao.run(`UPDATE users SET token = ? , lastssen = ? , ip = ? , device = ? WHERE uid = ?`, 
			[data['token'],data['lastssen'],data['ip'],data['device'],data['uid']]);
		};
	};
};

getBy(data){
	if(typeof data == 'object'){
		if(data['state'] == 'getByID'){
        return this.dao.get(`SELECT * FROM users WHERE idreg = ?`, [data['idreg']]);
		}else if(data['state'] == 'getByToken'){
        return this.dao.get(`SELECT * FROM users WHERE token = ?`, [data['token']]);
		}else if(data['state'] == 'getByLid'){
        return this.dao.get(`SELECT * FROM users WHERE lid = ?`, [data['lid']]);
		}else if(data['state'] == 'getLogin'){
        return this.dao.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [data['username'], data['password']]);
   		}else if(data['state'] == 'getByUsername'){
        return this.dao.get(`SELECT * FROM users WHERE username = ?`, [data['username']]);   		
		}else if(data['state'] == 'getByTopic'){
        return this.dao.get(`SELECT * FROM users WHERE topic = ?`, [data['topic']]);
		}else if(data['state'] == 'getByDevice'){
        return this.dao.get(`SELECT * FROM users WHERE device = ?`, [data['device']]);
		}else if(data['state'] == 'getByIp'){
        return this.dao.get(`SELECT * FROM users WHERE ip = ?`, [data['ip']]);
		}else if(data['state'] == 'getTop'){
        return this.dao.all(`SELECT evaluation,cover,topic,pic,ifedit,uhide FROM users ORDER BY evaluation DESC LIMIT 10`);
		}else if(data['state'] == 'searchMembers'){
        /* [UIRETA-BADGES] بحث خفيف للإكمال التلقائي في لوحة التحكم (من غير ip/device) */
        return this.dao.all(`SELECT idreg,username,topic,pic FROM users WHERE username LIKE ? OR topic LIKE ? OR idreg = ? ORDER BY idreg DESC LIMIT 8`, [data['q'], data['q'], data['id']]);
		}else if(data['state'] == 'getByAllSearch'){
        return this.dao.all(`SELECT muted,lastssen,verification,ifedit,evaluation,joinuser,loginG,username,topic,rep,power,device,ip,idreg FROM users WHERE ip LIKE ? OR device LIKE ? OR username LIKE ? OR topic lIKE ? ORDER BY joinuser DESC LIMIT 5`,['%'+data.value+'%','%'+data.value+'%','%'+data.value+'%','%'+data.value+'%']);
		}else if(data['state'] == 'getByAll'){
        return this.dao.all(`SELECT muted,lastssen,verification,ifedit,evaluation,joinuser,loginG,username,topic,rep,power,device,ip,idreg FROM users ORDER BY joinuser DESC LIMIT 0, ?`,[data['limit']]);
		}else if(data['state'] == 'getAllByDevice'){
        return this.dao.all(`SELECT * FROM users where device = ?`,[data['device']]);
		}else if(data['state'] == 'getAllBy'){
        return this.dao.all(`SELECT lastssen,verification,ifedit,joinuser,loginG,username,topic,pic,cover,rep,power,device,id,ip,uid,idreg FROM users`);
		};
	};
};
							

deleted(id) {
	if(id){
        return this.dao.run(`DELETE FROM users WHERE idreg = ?`, [id]);
	};
};
}

module.exports = GetUsers;
