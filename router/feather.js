/*
 * ريشة المبدعين — نسخة ثانية من الحائط (بجانب الحائط الأساسي)
 * جدول feather: منشورات + إعجاب (likes) + عدم إعجاب (dislikes) + تعليقات (bcc)
 * الجدول بيتعمل تلقائي أول تشغيل ومفيش حاجة لازم تتعمل يدوي.
 */
class GetFeather {
    constructor(dao) {
        this.dao = dao;
    }

    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS feather (
      id INT PRIMARY KEY AUTO_INCREMENT,
      bid VARCHAR(32) NOT NULL,
      owner VARCHAR(255),
      topic VARCHAR(255),
      pic VARCHAR(255),
      bg VARCHAR(255),
      copic VARCHAR(255),
      ucol VARCHAR(255),
      mcol VARCHAR(255),
      msg TEXT,
      data VARCHAR(32),
      likes MEDIUMTEXT,
      dislikes MEDIUMTEXT,
      bcc MEDIUMTEXT,
      UNIQUE KEY uq_bid (bid)
    ) DEFAULT CHARSET=utf8mb4`;
        return this.dao.run(sql).catch((e) => {
            console.log('feather createTable error', e && e.message);
        });
    }

    create(d) {
        return this.dao.run(
            'INSERT INTO feather (bid,owner,topic,pic,bg,copic,ucol,mcol,msg,data,likes,dislikes,bcc) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [d.bid, d.owner, d.topic, d.pic, d.bg, d.copic, d.ucol, d.mcol, d.msg, d.data, '[]', '[]', '[]']
        );
    }

    getByBid(bid) {
        return this.dao.get('SELECT * FROM feather WHERE bid = ?', [bid]);
    }

    // آخر N منشور (الأقدم أولاً علشان العميل بيضيف كل واحد فوق اللي قبله)
    getLast(limit) {
        limit = parseInt(limit) || 30;
        return this.dao.all(
            'SELECT bid,owner,topic,pic,bg,copic,ucol,mcol,msg,data,likes,dislikes,bcc FROM (SELECT * FROM feather ORDER BY id DESC LIMIT ' + limit + ') t ORDER BY id ASC'
        );
    }

    setLikes(bid, likes, dislikes) {
        return this.dao.run('UPDATE feather SET likes = ?, dislikes = ? WHERE bid = ?', [likes, dislikes, bid]);
    }

    setComments(bid, bcc) {
        return this.dao.run('UPDATE feather SET bcc = ? WHERE bid = ?', [bcc, bid]);
    }

    deleteByBid(bid) {
        return this.dao.run('DELETE FROM feather WHERE bid = ?', [bid]);
    }

    // بيسيب آخر keep منشور بس ويرجع الـ bid بتوع المحذوف
    trim(keep) {
        keep = parseInt(keep) || 30;
        return this.dao.all('SELECT bid FROM feather ORDER BY id DESC LIMIT 100000 OFFSET ' + keep).then((rows) => {
            if (!rows || !rows.length) return [];
            const ids = rows.map((r) => r.bid);
            return this.dao.run('DELETE FROM feather WHERE bid IN (' + ids.map(() => '?').join(',') + ')', ids).then(() => ids);
        });
    }
}

module.exports = GetFeather;
