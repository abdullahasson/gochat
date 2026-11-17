/*
 * مبدع الحائط (يومي / أسبوعي / شهري)
 * جدول wall_top: صف واحد لكل عضو في كل يوم  (uid, d, cnt)
 *  - يومي  : مجموع اليوم الحالي
 *  - أسبوعي: من بداية الأسبوع (السبت) لحد النهارده
 *  - شهري  : من أول الشهر الحالي لحد النهارده
 * الجدول بيتعمل تلقائي أول تشغيل ومفيش حاجة لازم تتعمل يدوي.
 */

// المنطقة الزمنية اللي بيتحسب بيها "اليوم" (غيّرها لو عايز توقيت تاني، مثال: 'Asia/Riyadh')
const WALL_TZ = 'Africa/Cairo';
// أول يوم في الأسبوع: 0=الأحد ... 6=السبت
const WEEK_START_DAY = 6;
// عدد الأعضاء اللي بيظهروا في القايمة
const WALL_TOP_LIMIT = 10;
// الأيام اللي بتفضل محفوظة (الشهري محتاج 31 يوم بس، سايبين هامش)
const KEEP_DAYS = 100;

function pad(n) { return (n < 10 ? '0' : '') + n; }

// تاريخ النهارده بتوقيت WALL_TZ على شكل YYYY-MM-DD
function todayStr() {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: WALL_TZ, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    return parts; // en-CA => 2026-10-08
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
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=الأحد
        const back = (dow - WEEK_START_DAY + 7) % 7;
        return { from: addDays(today, -back), to: today };
    }
    if (period === 'month') {
        return { from: today.slice(0, 8) + '01', to: today };
    }
    return { from: today, to: today };
}

class WallTop {
    constructor(dao) {
        this.dao = dao;
    }

    createTable() {
        const sql = `
    CREATE TABLE IF NOT EXISTS wall_top (
      uid VARCHAR(64) NOT NULL,
      d DATE NOT NULL,
      cnt INT NOT NULL DEFAULT 0,
      PRIMARY KEY (uid, d),
      KEY idx_d (d)
    ) DEFAULT CHARSET=utf8mb4`;
        return this.dao.run(sql).then(() => this.purge()).catch((e) => {
            console.log('wall_top createTable error', e && e.message);
        });
    }

    // يمسح الأيام القديمة
    purge() {
        const limit = addDays(todayStr(), -KEEP_DAYS);
        return this.dao.run('DELETE FROM wall_top WHERE d < ?', [limit]).catch(() => { });
    }

    // بيتنادى مع كل منشور على الحائط
    hit(uid) {
        if (!uid || typeof uid !== 'string') return Promise.resolve();
        return this.dao.run(
            'INSERT INTO wall_top (uid, d, cnt) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE cnt = cnt + 1',
            [uid.slice(0, 64), todayStr()]
        ).catch((e) => {
            console.log('wall_top hit error', e && e.message);
        });
    }

    // period: 'day' | 'week' | 'month'
    top(period) {
        if (period !== 'week' && period !== 'month') period = 'day';
        const r = rangeFor(period);
        const sql = `
    SELECT u.topic AS topic, u.pic AS pic, u.ifedit AS ifedit, u.uhide AS uhide, t.c AS cnt
    FROM (
      SELECT uid, SUM(cnt) AS c FROM wall_top
      WHERE d >= ? AND d <= ?
      GROUP BY uid
      ORDER BY c DESC
      LIMIT ${WALL_TOP_LIMIT * 3}
    ) t
    JOIN users u ON u.uid = t.uid
    ORDER BY t.c DESC, u.idreg ASC
    LIMIT ${WALL_TOP_LIMIT}`;
        return this.dao.all(sql, [r.from, r.to]);
    }
}

module.exports = WallTop;
