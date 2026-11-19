/* إضافة فهارس MySQL الناقصة (آمن للتشغيل أكثر من مرة).
   التشغيل:
     node scripts/ensure-indexes.js
   يستخدم نفس متغيرات GOCHAT_DB_* أو القيم الافتراضية في config.js. */
"use strict";

const mysql = require("mysql2/promise");
const Config = require("../config");

/* [table, column, indexName, prefixLength?] */
const INDEXES = [
    ["users", "username", "idx_users_username", 100],
    ["users", "token", "idx_users_token"],
    ["users", "lid", "idx_users_lid"],
    ["users", "uid", "idx_users_uid"],
    ["users", "device", "idx_users_device"],
    ["users", "ip", "idx_users_ip"],
    ["users", "topic", "idx_users_topic", 100],
    ["users", "evaluation", "idx_users_evaluation"],
    ["users", "joinuser", "idx_users_joinuser"],

    ["settings", "hostname", "idx_settings_hostname"],

    ["band", "device", "idx_band_device"],
    ["band", "ip", "idx_band_ip"],
    ["band", "username", "idx_band_username"],
    ["band", "country", "idx_band_country"],

    ["story", "date", "idx_story_date"],
    ["story", "owner", "idx_story_owner"],

    ["logs", "date", "idx_logs_date"],
    ["logs", "ip", "idx_logs_ip"],
    ["logs", "username", "idx_logs_username"],

    ["bars", "bid", "idx_bars_bid"],
    ["bars", "owner", "idx_bars_owner"],

    ["sub", "username", "idx_sub_username"],
    ["rooms", "topic", "idx_rooms_topic", 100],
];

async function main() {
    const conn = await mysql.createConnection({
        host: Config.HostDB,
        user: Config.UserDB,
        password: Config.PassDB,
        database: Config.DBDB,
        port: Config.DBPort || 3306,
        charset: "utf8mb4",
    });

    let added = 0;
    let skipped = 0;

    for (const item of INDEXES) {
        const table = item[0];
        const column = item[1];
        const name = item[2];
        const prefix = item[3];

        try {
            const [rows] = await conn.query("SHOW INDEX FROM `" + table + "`");
            const exists = rows.some(function (r) {
                return String(r.Column_name).toLowerCase() === column.toLowerCase();
            });
            if (exists) {
                skipped++;
                console.log("skip   " + table + "." + column + " (index already exists)");
                continue;
            }

            const columnSql = "`" + column + "`" + (prefix ? "(" + prefix + ")" : "");
            await conn.query(
                "ALTER TABLE `" + table + "` ADD INDEX `" + name + "` (" + columnSql + ")"
            );
            added++;
            console.log("add    " + table + "." + column + " -> " + name);
        } catch (e) {
            console.error(
                "error  " + table + "." + column + ":",
                e && e.code ? e.code : "",
                e && e.message ? e.message : e
            );
        }
    }

    await conn.end();
    console.log("\nDone. added=" + added + " skipped=" + skipped);
}

main().catch(function (e) {
    console.error("fatal:", e && e.message ? e.message : e);
    process.exit(1);
});
