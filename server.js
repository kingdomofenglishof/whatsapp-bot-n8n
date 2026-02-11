const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

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

let isReady = false;

client.on('qr', (qr) => {
    console.log('📱 امسح QR Code التالي بواتساب:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ تم الاتصال بواتساب بنجاح!');
    isReady = true;
});

client.on('disconnected', (reason) => {
    console.log('❌ تم قطع الاتصال:', reason);
    isReady = false;
});

client.initialize();

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        whatsappReady: isReady,
        message: 'WhatsApp Bot is running'
    });
});

app.post('/send-message', async (req, res) => {
    try {
        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'يجب إرسال phone و message'
            });
        }

        if (!isReady) {
            return res.status(503).json({
                success: false,
                error: 'واتساب غير متصل. يرجى المحاولة لاحقاً'
            });
        }

        let formattedPhone = phone.replace(/[^0-9]/g, '');
        
        if (formattedPhone.startsWith('00')) {
            formattedPhone = formattedPhone.substring(2);
        }
        
        const chatId = formattedPhone + '@c.us';
        await client.sendMessage(chatId, message);

        console.log('✅ تم إرسال رسالة إلى: ' + phone);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 السيرفر يعمل على المنفذ ' + PORT);
    console.log('📡 API endpoint: http://localhost:' + PORT + '/send-message');
});
