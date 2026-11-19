/* PM2 — نسخة واحدة فقط.
   سبب instances: 1 أن الحالة (OnlineUser / UserInfo / RoomsList / XoGames ...)
   داخل ذاكرة العملية؛ تشغيل أكثر من instance يكسر الغرف والألعاب والمتصلين.
   للتشغيل: pm2 start ecosystem.config.js
*/
module.exports = {
    apps: [{
        name: "gochat",
        script: "server.js",
        cwd: __dirname,
        instances: 1,
        exec_mode: "fork",
        watch: false,
        autorestart: true,
        max_memory_restart: "1800M",
        node_args: "--max-old-space-size=4096",
        time: true,
        merge_logs: true,
        out_file: "logs/gochat-out.log",
        error_file: "logs/gochat-error.log",
        kill_timeout: 5000,
        listen_timeout: 15000,
        env: {
            NODE_ENV: "production",
            GOCHAT_PORT: process.env.GOCHAT_PORT || "443",
            GOCHAT_DB_HOST: process.env.GOCHAT_DB_HOST || "127.0.0.1",
            GOCHAT_DB_USER: process.env.GOCHAT_DB_USER || "gochat",
            GOCHAT_DB_PASS: process.env.GOCHAT_DB_PASS || "",
            GOCHAT_DB_NAME: process.env.GOCHAT_DB_NAME || "gochat",
            GOCHAT_DB_PORT: process.env.GOCHAT_DB_PORT || "3306",
            GOCHAT_DB_POOL: process.env.GOCHAT_DB_POOL || "20",
            GOCHAT_ADMIN_USER: process.env.GOCHAT_ADMIN_USER || "",
            GOCHAT_ADMIN_PASS: process.env.GOCHAT_ADMIN_PASS || ""
        }
    }]
};
