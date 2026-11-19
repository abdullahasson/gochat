// const sqlite3 = require('sqlite3');
const mysql = require('mysql2');
const Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const Config = require("../config");

/* [FIX-P02] كان الاتصال واحداً (createConnection) يُسلسل كل استعلامات الموقع
   خلف اتصال واحد — عند 200+ متصل تصبح قاعدة البيانات عنق الزجاجة، وأي خطأ
   في الاتصال يرمي النظام كله. الآن: connection pool بعدد اتصالات قابل للضبط
   (Config.DBPool، افتراضياً 10) مع حد أقصى للانتظار وإعادة استخدام آمنة. */
var con = mysql.createPool({
    host: Config.HostDB,
    user: Config.UserDB,
    password: Config.PassDB,
    database: Config.DBDB,
    port: Config.DBPort || 3306,
    charset: 'utf8mb4',
    connectionLimit: Config.DBPool || 10,
    waitForConnections: true,
    queueLimit: 1000,           /* [FIX-P02] حد انتظار بدل انتظار لا نهائي */
    multipleStatements: false,  /* [FIX-S] منع تنفيذ عدة أوامر SQL في استعلام واحد */
});

/* [PERF] لا تترك أخطاء pool/connection تُسقط العملية بصمت */
if (typeof con.on === 'function') {
    con.on('error', function (err) {
        console.error('MySQL pool error:', err && err.code, err && err.message);
    });
}

class AppDataBase {
    constructor() {
    /* [FIX-P02] الـ pool يتصل تلقائياً عند أول استعلام — لا حاجة لـ con.connect()
       الذي كان يرمي استثناء ويوقف السيرفر لو قاعدة البيانات أبطأ في الإقلاع */
    console.log("Database pool ready (" + (Config.DBPool || 10) + " connections)");
    }

DatabaseTable(){
  con.query("CREATE DATABASE IF NOT EXISTS "+Config.DBDB, function (err, result) {
    if (err) throw err;
  });
};

ExportDatabase(data){
        if(data){
    const users = fs.readFileSync(data).toString();
  con.query(users,  (err, result) => {
        if (err){
             throw err;
        }else{
            res.send("Query run successfully");
        }

        });

        };
};


DeleteTable(){
  con.query("DROP DATABASE "+Config.DBDB, function (err, result) {
    if (err) throw err;
  });
};

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
           con.query(sql, params, function (err,result) {
                if (err) {
                    console.log('Error running sql ' + sql);
                    reject(err)
                } else {
                    resolve({id:result.insertId})
                }
            })
        })
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
           con.query(sql, params, (err, result) => {
                if (err) {
                    console.log('Error running sql: ' + sql);
                    reject(err)
                } else {
                    /* [FIX-P02] حذف JSON.parse(JSON.stringify(result)) — نسخ عميقة
                       كاملة لكل صف بكل استعلام. صفوف mysql أصلها كائنات JS عادية
                       وتعمل مباشرة بدون النسخة */
                    resolve(result[0])
                }
            })
        })
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
           con.query(sql, params, (err, rows) => {
                if (err) {
                    console.log('Error running sql: ' + sql);
                    reject(err)
                } else {
                    /* [FIX-P02] نفس الشيء: بدون النسخة العميقة */
                    resolve(rows)
                }
            })
        })
    }
}

module.exports = AppDataBase;
