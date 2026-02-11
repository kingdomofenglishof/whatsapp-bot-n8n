const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// إنشاء عميل واتساب
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// متغير لتتبع حالة الاتصال
let isReady = false;

// عند توليد QR Code
client.on('qr', (qr) => {
    console.log('📱 امسح QR Code التالي بواتساب:');
    qrcode.generate(qr, { small: true });
});

// عند الاتصال بنجاح
client.on('ready', () => {
    console.log('✅ تم الاتصال بواتساب بنجاح!');
    isReady = true;
});

// عند الانقطاع
client.on('disconnected', (reason) => {
    console.log('❌ تم قطع الاتصال:', reason);
    isReady = false;
});

// بدء تشغيل العميل
client.initialize();

// API endpoint للتحقق من الحالة
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        whatsappReady: isReady,
        message: 'WhatsApp Bot is running'
    });
});

// API endpoint لإرسال رسالة
app.post('/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;

        // التحقق من البيانات
        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'يجب إرسال phone و message'
            });
        }

        // التحقق من جاهزية واتساب
        if (!isReady) {
            return res.status(503).json({
                success: false,
                error: 'واتساب غير متصل. يرجى المحاولة لاحقاً'
            });
        }

        // تنسيق رقم الهاتف
        let formattedPhone = phone.replace(/[^0-9]/g, '');
        
        // إزالة + أو 00 من البداية
        if (formattedPhone.startsWith('00')) {
            formattedPhone = formattedPhone.substring(2);
        }
        
        // إضافة @c.us في النهاية (صيغة واتساب)
        const chatId = formattedPhone + '@c.us';

        // إرسال الرسالة
        await client.sendMessage(chatId, message);

        console.log(`✅ تم إرسال رسالة إلى: ${phone}`);

        res.json({
            success: true,
            message: 'تم إرسال الرسالة بنجاح',
            to: phone
        });

    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل على المنفذ ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/send-message`);
});

```
https://whatsapp-bot-n8n.onrender.com/send-message
