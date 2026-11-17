class GetRooms {
    constructor(dao) {
        this.dao = dao
    }

createTable() {
	const sql = `
	  CREATE TABLE IF NOT EXISTS rooms (
      idroom INTEGER PRIMARY KEY AUTO_INCREMENT,
      about VARCHAR(255),
      user VARCHAR(255),
      pass VARCHAR(255),
      id VARCHAR(255),
      owner VARCHAR(255),
      topic VARCHAR(255),
      color VARCHAR(255),
	  backroom VARCHAR(255),
	  colorpicroom VARCHAR(255),
	  colormsgroom VARCHAR(255),
	  baccolor VARCHAR(255),
	  pic VARCHAR(255),
	  rmli INTEGER DEFAULT 0,
      welcome VARCHAR(255),
      broadcast BOOLEAN DEFAULT false,
	  nohide BOOLEAN DEFAULT false,
      camera BOOLEAN DEFAULT false,
      deleted BOOLEAN DEFAULT false,
      needpass BOOLEAN DEFAULT false,
	  max INTEGER DEFAULT 0,
	  has INTEGER DEFAULT 1,
	  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
        return this.dao.run(sql)
};

create(data) {
	if(typeof data == 'object'){
		return this.dao.run(
		'INSERT INTO rooms (backroom,about,user,pass,id,owner,topic,color,colorpicroom,colormsgroom,baccolor,pic,rmli,welcome,broadcast,nohide,camera,deleted,needpass,max,has) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
		[data['backroom'],data['about'],data['user'],data['pass'],data['id'],data['owner'],data['topic'],data['color'],data['colorpicroom'],data['colormsgroom'],data['baccolor'],data['pic'],data['rmli'],data['welcome'],data['broadcast'],data['nohide'],
		data['camera'],data['deleted'],data['needpass'],data['max'],data['has']]);
	};
};


getBy(data){
	if(data){
		if(data['state'] == 'getAllWith'){
			return this.dao.all(`SELECT backroom,about,deleted,user,id,max,has,color,colorpicroom,colormsgroom,baccolor,needpass,owner,pic,topic,welcome,broadcast,nohide,camera,rmli,vseats,mseats FROM rooms`).catch(() => {
				/* العمود لسه ما اتضافش (أول تشغيل) -> نفس الاستعلام القديم */
				return this.dao.all(`SELECT backroom,about,deleted,user,id,max,has,color,colorpicroom,colormsgroom,baccolor,needpass,owner,pic,topic,welcome,broadcast,nohide,camera,rmli FROM rooms`);
			});
		}else if(data['state'] == 'getByName'){
			return this.dao.get(`SELECT * FROM rooms WHERE topic = ?`,[data['topic']]);
		}else if(data['state'] == 'getAllLimit'){
			return this.dao.all(`SELECT pic,user,id,owner,topic,needpass FROM rooms ORDER BY id DESC LIMIT 0, ?`,[data['limit']]);
		}else if(data['state'] == 'getAll'){
			return this.dao.all(`SELECT * FROM rooms`);
		}else if(data['state'] == 'getByID'){
			return this.dao.get(`SELECT * FROM rooms WHERE id = ?`,[data['id']]);
		};
	};
};


updateBy(data){
	if(data){
		if(data['state'] == 'updateRoom'){
			return this.dao.run(`UPDATE rooms SET backroom = ? , color = ? , colorpicroom = ? , colormsgroom = ? , baccolor = ? , topic = ? , broadcast = ?, nohide = ?, camera = ?, about = ? , welcome = ? , pass = ? ,  needpass = ? , max = ?, has = ?, rmli = ?, pic = ? WHERE id = ?`, 
			[data['backroom'],data['color'],data['colorpicroom'],data['colormsgroom'],data['baccolor'],data['topic'],data['broadcast'],data['nohide'],data['camera'],data['about'],data['welcome'],data['pass'],data['needpass'],data['max'],data['has'],data['rmli'],data['pic'],data['id']]
			);
		}else if(data['state'] == 'updatePass'){
			return this.dao.run(`UPDATE rooms SET pass = ?,needpass = ? WHERE id = ?`, ['',false,data['id']]);
		}else if(data['state'] == 'updatePic'){
			return this.dao.run(`UPDATE rooms SET pic = ? WHERE id = ?`, [data['pic'],data['id']]);
		};
	};
};

/* [ADDED] مقاعد البث المباشر: عمود نصي بصيغة "2,5" = أرقام المقاعد المحوّلة لبث فيديو */
ensureVseats() {
	var self = this;
	return this.dao.all("SHOW COLUMNS FROM rooms LIKE 'vseats'").then((cols) => {
		if (!cols || cols.length == 0) {
			return self.dao.run("ALTER TABLE rooms ADD COLUMN vseats VARCHAR(32) DEFAULT ''");
		}
	}).then(() => self.dao.all("SHOW COLUMNS FROM rooms LIKE 'mseats'")).then((cols) => {
		/* عدد المقاعد الظاهرة (1-6) */
		if (!cols || cols.length == 0) {
			return self.dao.run("ALTER TABLE rooms ADD COLUMN mseats INTEGER DEFAULT 6");
		}
	}).catch((e) => { console.log("vseats/mseats column error:", e && e.message); });
}
updateVseats(data) {
	if (data && data['id']) {
		return this.dao.run(`UPDATE rooms SET vseats = ?, mseats = ? WHERE id = ?`, [data['vseats'] || '', data['mseats'] || 6, data['id']]);
	}
	return Promise.resolve();
}

deleted(id) {
	if(id){
        return this.dao.run(`DELETE FROM rooms WHERE id = ?`,[id]);
    };
};
	
}

module.exports = GetRooms;