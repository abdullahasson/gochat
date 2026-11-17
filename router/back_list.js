class GetBack {
    constructor(dao) {
        this.dao = dao;
    }

createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS back (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      path VARCHAR(255))`;
        return this.dao.run(sql);
};

create(data) {
	if (typeof data == 'object') {
		return this.dao.run("INSERT INTO back (path) VALUES (?)", [data['path']]);
	};
};

deleted(data) {
	if(data){
		return this.dao.run(`DELETE FROM back WHERE path = ?`, [data]);
	};
};

getAll() {
	return this.dao.all(`SELECT path FROM back`);
};

}

module.exports = GetBack;
