class GetAtar {
    constructor(dao) {
        this.dao = dao;
    }

createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS atars (
      id INTEGER PRIMARY KEY AUTO_INCREMENT,
      path VARCHAR(255))`;
        return this.dao.run(sql);
};

create(data) {
	if (typeof data == 'object') {
		return this.dao.run("INSERT INTO atars (path) VALUES (?)", [data['path']]);
	};
};

deleted(data) {
	if(data){
		return this.dao.run(`DELETE FROM atars WHERE path = ?`, [data]);
	};
};

getAll() {
	return this.dao.all(`SELECT path FROM atars`);
};

}

module.exports = GetAtar;
