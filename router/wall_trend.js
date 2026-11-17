/*
 * ترند الحائط (يومي / أسبوعي / شهري)
 * جدول wall_trend: صف لكل (عضو، يوم، نوع)  — النوع: post (منشور) / chat (تعليق/دردشة على الحائط) / like (إعجاب حصل عليه)
 * الجدول بيتعمل تلقائي أول تشغيل ومفيش حاجة لازم تتعمل يدوي.
 */
const WT_TZ = 'Africa/Cairo';      // المنطقة الزمنية اللي بيتحسب بيها "اليوم"
const WT_WEEK_START_DAY = 6;       // أول يوم في الأسبوع: 0=الأحد ... 6=السبت
const WT_LIMIT = 3;                // عدد الأعضاء في كل قسم
const WT_KEEP_DAYS = 100;
const KINDS = ['post', 'chat', 'like'];

function pad(n) { return (n < 10 ? '0' : '') + n; }
function todayStr() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: WT_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
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
        const back = (dow - WT_WEEK_START_DAY + 7) % 7;
        return { from: addDays(today, -back), to: today };
    }
    if (period === 'month') return { from: today.slice(0, 8) + '01', to: today };
    return { from: today, to: today };
}

class WallTrend {
    constructor(dao) { this.dao = dao; }

    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS wall_trend (
      uid VARCHAR(64) NOT NULL,
      d DATE NOT NULL,
      k VARCHAR(8) NOT NULL,
      cnt INT NOT NULL DEFAULT 0,
      PRIMARY KEY (uid, d, k),
      KEY idx_d (d)
    ) DEFAULT CHARSET=utf8mb4`;
        return this.dao.run(sql).then(() => this.purge()).catch((e) => {
            console.log('wall_trend createTable error', e && e.message);
        });
    }

    purge() {
        return this.dao.run('DELETE FROM wall_trend WHERE d < ?', [addDays(todayStr(), -WT_KEEP_DAYS)]).catch(() => { });
    }

    // kind: 'post' | 'chat' | 'like'
    hit(uid, kind) {
        if (!uid || typeof uid !== 'string' || KINDS.indexOf(kind) === -1) return Promise.resolve();
        return this.dao.run(
            'INSERT INTO wall_trend (uid, d, k, cnt) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE cnt = cnt + 1',
            [uid.slice(0, 64), todayStr(), kind]
        ).catch((e) => { console.log('wall_trend hit error', e && e.message); });
    }

    topKind(kind, r) {
        const sql = `
    SELECT u.topic AS topic, u.pic AS pic, u.ifedit AS ifedit, u.uhide AS uhide, t.c AS cnt
    FROM (
      SELECT uid, SUM(cnt) AS c FROM wall_trend
      WHERE k = ? AND d >= ? AND d <= ?
      GROUP BY uid
      ORDER BY c DESC
      LIMIT ${WT_LIMIT * 3}
    ) t
    JOIN users u ON u.uid = t.uid
    ORDER BY t.c DESC, u.idreg ASC
    LIMIT ${WT_LIMIT}`;
        return this.dao.all(sql, [kind, r.from, r.to]);
    }

    // period: 'day' | 'week' | 'month'  →  { post:[], chat:[], like:[] }
    top(period) {
        if (period !== 'week' && period !== 'month') period = 'day';
        const r = rangeFor(period);
        return Promise.all(KINDS.map((k) => this.topKind(k, r))).then((a) => ({ post: a[0], chat: a[1], like: a[2] }));
    }
}

module.exports = WallTrend;
