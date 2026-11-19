# GoChat — دليل النشر على Cloudflare (VPS + Tunnel)

> **مهم:** هذا المشروع **لا يعمل على Cloudflare Pages**؛ فهو يحتاج Node.js وSocket.IO وMySQL وملفات مرفوعة وحالة داخل الذاكرة.
> الخيار العملي: **VPS + Cloudflare Tunnel** (أو Cloudflare Proxy مع شهادة Origin).

---

## 1) المعمارية

```
المستخدم
   ↓ HTTPS / WSS
Cloudflare (DNS + CDN + WAF + WebSocket)
   ↓ Tunnel (cloudflared)
VPS: Node.js + Express + Socket.IO (نسخة واحدة)
   ↓
MySQL 8 (محلي)  +  uploads/ (محلي)
```

### قيود يجب احترامها
- **نسخة Node واحدة** (`instances: 1`). الحالة داخل الذاكرة (`OnlineUser`, `UserInfo`, `RoomsList`, `XoGames`...).
- لا تفتح المنافذ `3443` أو `3306` للإنترنت. Tunnel يكفي.
- لا تضع Cloudflare Rate Limit على `/socket.io`؛ استخدم Rate Limit داخل التطبيق.
- حد الرفع في Cloudflare Free/Pro هو **100MB**، والمهلة **100 ثانية** للطلبات العادية.

---

## ما تم تجهيزه في الكود

- `trust proxy` + استخدام `CF-Connecting-IP` كـIP حقيقي.
- Rate Limit لكل Socket (20/ثانية) ولكل IP حقيقي (300/ثانية) مع إشعار عند التجاوز بدل الرفض الصامت.
- `pingTimeout` أصبح 120 ثانية بدل ساعة (تقليل المستخدمين الأشباح).
- إصلاح حلقة `MessageDay` (كانت 1ms قبل أول طلب).
- `/cp` أصبح Route مستقلًا يعمل بدون اتصال Socket سابق.
- `/healthz` للفحص من PM2/Cloudflare.
- معالجة أخطاء MySQL/Pool بدون إسقاط العملية.
- قائمة انتظار رسائل العميل + إعادة إرسال تلقائية عند reconnect (بانتظار الاتصال).
- فهارس MySQL عبر `node scripts/ensure-indexes.js`.
- `MaxUpload` = 100MB ليتوافق مع Cloudflare Free/Pro.
- `ecosystem.config.js` لنسخة PM2 واحدة.

---

## 2) تجهيز VPS

يفضّل Ubuntu 22.04/24.04، 2 vCPU / 4GB RAM كحد أدنى، SSD.

```bash
sudo apt update
sudo apt install -y mysql-server curl nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### مستخدم التطبيق
```bash
sudo useradd -m -s /bin/bash gochat
sudo su - gochat
git clone <REPO_URL> app
cd app
npm ci --omit=dev
mkdir -p logs
```

---

## 3) MySQL

```sql
CREATE DATABASE gochat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'gochat'@'127.0.0.1' IDENTIFIED BY 'كلمة-مرور-قوية';
GRANT ALL PRIVILEGES ON gochat.* TO 'gochat'@'127.0.0.1';
FLUSH PRIVILEGES;
```

```bash
mysql -u gochat -p gochat < database/database0.sql
node scripts/ensure-indexes.js
```

> `ensure-indexes.js` آمن للتشغيل أكثر من مرة؛ يضيف فقط الفهارس الناقصة.

تأكد من `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
bind-address = 127.0.0.1
```

---

## 4) متغيرات البيئة

استخدم `ecosystem.config.js` الموجود في المشروع، وعدّل قيم البيئة أو صدّرها قبل `pm2 start`.

```bash
export GOCHAT_PORT=3443
export GOCHAT_DB_HOST=127.0.0.1
export GOCHAT_DB_USER=gochat
export GOCHAT_DB_PASS='...'
export GOCHAT_DB_NAME=gochat
export GOCHAT_DB_PORT=3306
export GOCHAT_DB_POOL=20
export GOCHAT_ADMIN_USER='admin-strong'
export GOCHAT_ADMIN_PASS='password-strong'
```

> **لا تترك** `aymin / 1111` أو بيانات قاعدة البيانات الافتراضية في الإنتاج.

---

## 5) شهادة SSL

### الخيار الموصى به: Cloudflare Origin Certificate
- Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate.
- ضع الشهادة في `pem/cert.pem` والمفتاح في `pem/key.pem`.
- SSL/TLS Mode: **Full (Strict)**.

### عند استخدام Tunnel مع الشهادة الحالية (self-signed)
- استخدم `noTLSVerify: true` في `cloudflared.yml` (كما في المثال).
- SSL/TLS Mode: **Full**.

---

## 6) PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

- `instances: 1` و`exec_mode: fork`.
- `max_memory_restart: 1800M`.
- السجلات: `logs/gochat-out.log` و`logs/gochat-error.log`.
- Healthcheck: `GET /healthz` (يتحقق من MySQL).

> لا تستخدم `pm2 -i max` أو أكثر من instance.

---

## 7) Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create gochat
cloudflared tunnel route dns gochat storyhati.com
```

انسخ ملف الاعتماد:
```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<TUNNEL_UUID>.json /etc/cloudflared/
```

`/etc/cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /etc/cloudflared/<TUNNEL_UUID>.json
ingress:
  - hostname: storyhati.com
    service: https://127.0.0.1:3443
    originRequest:
      noTLSVerify: true
      connectTimeout: 30s
  - hostname: www.storyhati.com
    service: https://127.0.0.1:3443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

```bash
sudo cloudflared service install
sudo systemctl enable --now cloudflared
sudo systemctl status cloudflared
```

### الجدار الناري
```bash
sudo ufw allow 22
sudo ufw enable
```
لا تفتح 3443/3306. Tunnel يتصل خارجيًا.

---

## 8) إعدادات Cloudflare Dashboard

| الإعداد | القيمة |
|---|---|
| SSL/TLS | Full (Strict) مع Origin Cert، أو Full مع noTLSVerify |
| Always Use HTTPS | ON |
| WebSockets | ON (افتراضي) |
| HTTP/3 + Brotli + Early Hints | ON |
| Rocket Loader | **OFF** |
| Email Obfuscation | OFF |
| Bot Fight Mode | OFF مبدئيًا أو استثناء `/socket.io` |
| Always Online | OFF |
| Under Attack | OFF |
| Proxy | Orange Cloud |

### Cache Rules
**Bypass Cache** لـ:
```
/ , /socket.io/* , /cp* , /GET_* , /UQ_BADGES , /uh
/upload* , /uppic* , /uploadstory* , /uploadmusic , /uploadURM
/healthz
```

**Cache** للأصول الثابتة:
```
/x2.js , /jq.js , /room-style.css , /admin-ui.css , /fonts/* , /imgs/* , /site/* , /uploads/*
```
مع Edge TTL مناسب (شهر) واحترام `Cache-Control` من الأصل.

> لا تضع Rate Limit على `/socket.io` من Cloudflare. استخدم WAF Rate Limit على `/upload*` وطلبات `POST` فقط.

---

## 9) حدود Cloudflare

- **100MB** حد الرفع (Free/Pro). المشروع الآن `MaxUpload = 100MB`.
- **100 ثانية** مهلة HTTP. الرفع الكبير قد يفشل → استخدم **R2 Direct Upload** لاحقًا.
- WebSocket مدعوم عبر Tunnel. Socket.IO يستخدم WebSocket افتراضيًا.
- لا تستخدم Cloudflare Pages لهذا المشروع.

---

## 10) Nginx (اختياري)

إذا أردت Nginx بين Tunnel وNode:
```nginx
server {
    listen 3443 ssl;
    server_name storyhati.com;

    ssl_certificate     /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    client_max_body_size 100m;

    location / {
        proxy_pass https://127.0.0.1:3443;
        proxy_ssl_verify off;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header CF-Connecting-IP $http_cf_connecting_ip;

        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
        proxy_buffering off;
    }
}
```
> الأفضل عدم تعقيد الأمر: Tunnel → Node HTTPS مباشرة.

---

## 11) اختبار ما بعد النشر

- [ ] `https://storyhati.com` يفتح، وشهادة SSL سليمة.
- [ ] تسجيل الدخول يعمل.
- [ ] DevTools → Network → `/socket.io` يرجع **101 Switching Protocols**.
- [ ] إرسال رسالة، خاص، حائط، ستوري.
- [ ] رفع صورة وفيديو أقل من 100MB.
- [ ] فصل الشبكة (DevTools Offline) ثم الرجوع: لا رسائل مكررة/مفقودة.
- [ ] `GET /healthz` يرجع `{ok:true}`.
- [ ] IP الحقيقي يظهر في السجلات (`CF-Connecting-IP`) وليس IP Cloudflare.
- [ ] لوحة التحكم `/cp?<token>` تفتح بدون الحاجة لاتصال Socket سابق.
- [ ] PM2: `pm2 status` و`pm2 logs gochat`.
- [ ] Cloudflare Analytics: لا أخطاء 5xx/524.

---

## 12) استكشاف الأخطاء

| المشكلة | السبب المحتمل | الحل |
|---|---|---|
| 521/522 | Origin لا يستجيب | `pm2 status`, `curl -k https://127.0.0.1:3443`, `cloudflared` logs |
| 524 | طلب HTTP > 100s | رفع كبير/استعلام بطيء → R2 أو تحسين الاستعلام |
| 526 | شهادة Origin غير صالحة | Origin Cert أو Full + noTLSVerify |
| WebSocket لا يعمل | Rocket Loader/Bot Fight/WAF | أوقفهم، اختبر 101 |
| كل المستخدمين يطردون | Rate Limit على IP الوسيط | تأكد من `trust proxy` و`CF-Connecting-IP` |
| المستخدم يبقى متصل بعد الخروج | pingTimeout قديم | تم تخفيضه إلى 120s |
| رفع 100MB+ يفشل | حد Cloudflare | R2 Direct Upload |
| MySQL بطيء | فهارس ناقصة | `node scripts/ensure-indexes.js` |

---

## 13) التراجع (Rollback)

- احتفظ بمجلد إصدار سابق (`releases/`).
- `pm2 stop gochat`, بدّل symlink/المجلد, `pm2 start ecosystem.config.js`.
- لا تمسح قاعدة البيانات قبل نسخة احتياطية.
- `cloudflared` يبقى كما هو.
