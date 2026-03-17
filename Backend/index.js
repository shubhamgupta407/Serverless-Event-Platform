const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ImageKit = require('imagekit');
const Razorpay = require('razorpay');

const app = express();
require('dotenv').config();
const path = require('path');

app.use(cors());
app.use(express.json());

// Serve static files from the Frontend dist directory
app.use(express.static(path.join(__dirname, '../Frontend/dist')));

// ImageKit Setup
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Razorpay Setup
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

// --- Endpoints ---

/**
 * Enhanced upload function based on user's snippet
 */
async function uploadToImageKit({ buffer, filename, folder = "event_banners" }) {
    return await imagekit.upload({
        file: buffer,
        fileName: filename,
        folder: folder
    });
}

// ImageKit: Upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image file provided." });
        }

        const result = await uploadToImageKit({
            buffer: req.file.buffer,
            filename: req.file.originalname
        });

        res.json({
            url: result.url,
            fileId: result.fileId
        });
    } catch (error) {
        console.error("ImageKit Upload Error:", error);
        res.status(500).json({ error: "Cloud upload failed: " + error.message });
    }
});

// Razorpay: Create Order
app.post('/api/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR', receipt = 'receipt_123' } = req.body;
        console.log("Creating Razorpay Order:", { amount, currency, receipt });

        if (amount === undefined || amount === null) {
            return res.status(400).json({ error: "Amount is required" });
        }

        // Razorpay expects amount in paise (1 INR = 100 paise)
        const amountInPaise = Math.round(Number(amount) * 100);

        if (isNaN(amountInPaise) || amountInPaise <= 0) {
            return res.status(400).json({ error: "Invalid amount. Must be greater than 0." });
        }

        const options = {
            amount: amountInPaise,
            currency,
            receipt
        };

        const order = await razorpay.orders.create(options);
        console.log("Order Created Successfully:", order.id);
        res.json(order);
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        res.status(500).json({
            error: error.message || "Failed to create order",
            details: error
        });
    }
});

// Global Error Handler to ensure JSON responses
app.use((err, req, res, next) => {
    console.error("Global Server Error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: err.message
    });
});

// New Express 5 syntax for catch-all route (SPA support)
app.get('/{*path}', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../Frontend/dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
