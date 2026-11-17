class GetBars {
    constructor(dao) {
        this.dao = dao
    }
        
    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS bars (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      bcc TEXT DEFAULT (''),
      likes TEXT DEFAULT (''),
      bg VARCHAR(255),
          copic VARCHAR(255),
          ucol VARCHAR(255),
          mcol VARCHAR(255),
      bid VARCHAR(255),
      owner VARCHAR(255),
      msg VARCHAR(255),
      pic VARCHAR(255),
          data VARCHAR(255),
      topic VARCHAR(255))`;
        return this.dao.run(sql)
    }

    create(data) {
                if(typeof data == 'object'){
        return this.dao.run(
            'INSERT INTO bars (bg,copic,ucol,mcol,bid,owner,msg,pic,topic,data) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [data['bg'],data['copic'],data['ucol'],data['mcol'],data['bid'],data['owner'],data['msg'],data['pic'],data['topic'],data['data']]);
                };
    }

   
        deleted(data) {
                 if(typeof data == 'object'){
                         if(data['state'] == 'deleteByBid'){
                                 return this.dao.run(`DELETE FROM bars WHERE bid = ?`,[data['bid']]);
                     }else if(data['state'] == 'deleteByID'){
                                 return this.dao.run(`DELETE FROM bars WHERE id = ?`,[data['id']]);
                         }else if(data['state'] == 'deleteAll'){
                                 return this.dao.run(`DELETE FROM bars`);
                         };
                };
        };
        
        update(data){
                if(typeof data == 'object'){
                        if(data['state'] == 'updateLike'){
            return this.dao.run(`UPDATE bars SET likes = ? WHERE bid = ?`, [data['likes'],data['bid']]);
                        }else if(data['state'] == 'updateComment'){
            return this.dao.run(`UPDATE bars SET bcc = ? WHERE bid = ?`, [data['bcc'],data['bid']]);
                        };
                };
        };
        
        
        /* [FIX-PERF] أحدث N منشوراً (الأحدث أولاً من قاعدة البيانات) بدون تحميل الجدول كله */
        getLatest(limit){
                const lim = parseInt(limit) > 0 ? parseInt(limit) : 60;
                return this.dao.all(`SELECT bg,copic,ucol,mcol,bid,owner,msg,pic,topic,likes,bcc,data FROM (SELECT id,bg,copic,ucol,mcol,bid,owner,msg,pic,topic,likes,bcc,data FROM bars ORDER BY id DESC LIMIT ?) AS t ORDER BY t.id ASC`, [lim]);
        };
        
getBy(data){
        if(typeof data == 'object'){
                if(data['state'] == 'getByBid'){
        return this.dao.get(`SELECT * FROM bars WHERE bid = ?`, [data['bid']]);
                }else if(data['state'] == 'getLatest'){
        return this.getLatest(data['limit']);
                }else if(data['state'] == 'getAll'){
        return this.dao.all(`SELECT bg,copic,ucol,mcol,bid,owner,msg,pic,topic,likes,bcc,data FROM bars`)
                };
        };
};

}

module.exports = GetBars;