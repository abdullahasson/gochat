class GetBots {
    constructor(dao) {
        this.dao = dao;
    }

	// ALTER TABLE bots ADD COLUMN bg VARCHAR(255) DEFAULT "#000000" AFTER likebot;

    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS bots (
      idreg INTEGER PRIMARY KEY AUTO_INCREMENT,
      msg VARCHAR(255) DEFAULT "(عضو جديد)",
      pic VARCHAR(255) DEFAULT "pic.png",
      power VARCHAR(255) DEFAULT "",
      country VARCHAR(255) DEFAULT "",
      room VARCHAR(255) DEFAULT "",
      ip VARCHAR(255) DEFAULT "",
      id VARCHAR(255) DEFAULT "",
      stat INT DEFAULT 0,
      likebot INT DEFAULT 0,
      timestart INT DEFAULT 0,
      timestop INT DEFAULT 0,
      autostart INTEGER DEFAULT 0,
	  bg VARCHAR(255) DEFAULT "#FFFFFF",
      mcol VARCHAR(255) DEFAULT "#000000",
      ucol VARCHAR(255) DEFAULT "#000000",
      topic VARCHAR(255) DEFAULT "")`;
        return this.dao.run(sql);
    }
	

create(data) {
	if(typeof data == 'object') {
		return this.dao.run("INSERT INTO bots (msg,pic,power,country,room,ip,id,stat,likebot,bg,mcol,ucol,topic,timestart,timestop,autostart) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", 
		[data['msg'],data['pic'],data['power'],data['country'], data['room'],data['ip'],data['id'],data['stat'],data['likebot'],data['bg'],data['mcol'],data['ucol'], data['topic'],data['timestart'],data['timestop'], data['autostart']]);
	};
};

getByauto(autostart) {
    return this.dao.all(`SELECT * FROM bots WHERE autostart = ?`, [autostart]);
}
getall() {
    return this.dao.all(`SELECT * FROM bots`);
}
/* مدة البقاء في الغرفة بالدقائق قبل الانتقال لغرفة عشوائية (0 = بدون تنقل) */
ensureStay() {
	return this.dao.all("SHOW COLUMNS FROM bots LIKE 'stay'").then((cols) => {
		if (!cols || cols.length == 0) {
			return this.dao.run("ALTER TABLE bots ADD COLUMN stay INTEGER DEFAULT 0");
		}
	}).catch((e) => { console.log("bots stay column error:", e && e.message); });
}
setStay(id, stay) {
	return this.dao.run("UPDATE bots SET stay=? WHERE id=?", [stay | 0, id]).catch((e) => { console.log("bots setStay error:", e && e.message); });
}
update(data) {
	if(typeof data == 'object') {
		return this.dao.run("UPDATE bots SET msg=?,pic=?,power=?,country=?,room=?,stat=?,likebot=?,bg=?,mcol=?,ucol=?,topic=?,timestart=?,timestop=?,autostart=? WHERE id=?",
		[data['msg'],data['pic'],data['power'],data['country'],data['room'],data['stat'],data['likebot'],data['bg'],data['mcol'],data['ucol'],data['topic'],data['timestart'],data['timestop'],data['autostart'],data['id']]);
	};
};
deleteByID(id) {
	return this.dao.run(`DELETE FROM bots WHERE id = ?`, [id]);
};

getBy(data) {
	if(typeof data == 'object'){
		if(data['state'] == "getByID"){
			return this.dao.get(`SELECT * FROM bots WHERE id = ?`, [data['id']]);
		}else if(data['state'] == 'getAll'){
			return this.dao.all(`SELECT * FROM bots ORDER BY idreg DESC LIMIT 0, ?`,[data['limit']]);
		};
    };
};
}

module.exports = GetBots;
