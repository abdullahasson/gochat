/*
 * نجم اكس او — عدد مرات الفوز في لعبة XO (يومي / أسبوعي / شهري)
 * جدول xo_top: صف واحد لكل عضو في كل يوم  (uid, d, cnt)
 * الجدول بيتعمل تلقائي أول تشغيل ومفيش حاجة لازم تتعمل يدوي.
 */

const XO_TZ = 'Africa/Cairo';          // المنطقة الزمنية اللي بيتحسب بيها "اليوم"
const XO_WEEK_START_DAY = 6;           // أول يوم في الأسبوع: 0=الأحد ... 6=السبت
const XO_TOP_LIMIT = 10;               // عدد الأعضاء في القايمة
const XO_KEEP_DAYS = 100;              // الأيام اللي بتفضل محفوظة

function pad(n) { return (n < 10 ? '0' : '') + n; }

function todayStr() {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: XO_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
}

function addDays(dateStr, delta) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + delta));
    return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
}

function rangeFor(period) {
    const today = todayStr();
    if (period === 'week') {
        const [y, m, d] = today.split('-').map(Number);
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        const back = (dow - XO_WEEK_START_DAY + 7) % 7;
        return { from: addDays(today, -back), to: today };
    }
    if (period === 'month') return { from: today.slice(0, 8) + '01', to: today };
    return { from: today, to: today };
}

class XoTop {
    constructor(dao) {
        this.dao = dao;
    }

    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS xo_top (
      uid VARCHAR(64) NOT NULL,
      d DATE NOT NULL,
      cnt INT NOT NULL DEFAULT 0,
      PRIMARY KEY (uid, d),
      KEY idx_d (d)
    ) DEFAULT CHARSET=utf8mb4`;
        return this.dao.run(sql).then(() => this.purge()).catch((e) => {
            console.log('xo_top createTable error', e && e.message);
        });
    }

    purge() {
        const limit = addDays(todayStr(), -XO_KEEP_DAYS);
        return this.dao.run('DELETE FROM xo_top WHERE d < ?', [limit]).catch(() => { });
    }

    // بيتنادى مع كل فوز في لعبة XO
    win(uid) {
        if (!uid || typeof uid !== 'string') return Promise.resolve();
        return this.dao.run(
            'INSERT INTO xo_top (uid, d, cnt) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE cnt = cnt + 1',
            [uid.slice(0, 64), todayStr()]
        ).catch((e) => {
            console.log('xo_top win error', e && e.message);
        });
    }

    // period: 'day' | 'week' | 'month'
    top(period) {
        if (period !== 'week' && period !== 'month') period = 'day';
        const r = rangeFor(period);
        const sql = `
    SELECT u.topic AS topic, u.pic AS pic, u.ifedit AS ifedit, u.uhide AS uhide, t.c AS cnt
    FROM (
      SELECT uid, SUM(cnt) AS c FROM xo_top
      WHERE d >= ? AND d <= ?
      GROUP BY uid
      ORDER BY c DESC
      LIMIT ${XO_TOP_LIMIT * 3}
    ) t
    JOIN users u ON u.uid = t.uid
    ORDER BY t.c DESC, u.idreg ASC
    LIMIT ${XO_TOP_LIMIT}`;
        return this.dao.all(sql, [r.from, r.to]);
    }
}

module.exports = XoTop;
