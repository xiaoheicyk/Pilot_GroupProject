const OPT = require('../models/OPT');
const Employee = require('../models/Employee');
const uploadFileToS3 = require('../utils/s3');

exports.uploadOptDocument = async (req, res) => {
    try {
        const { type } = req.body;
        const file = req.file;

        if (!['receipt', 'ead', 'i983', 'i20'].includes(type)) {
        return res.status(400).json({ error: 'Invalid document type' });
        }

        if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
        }

        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        let opt = await OPT.findOne({ employee: employee._id });
        if (!opt) {
        opt = new OPT({ employee: employee._id });
        }

        const result = await uploadFileToS3(file, `opt/${employee._id}`);
        const fileUrl = result.Location;
        
        opt[type] = {
        url: fileUrl,
        status: 'pending',
        };

        await opt.save();

        res.json({
        message: `${type} uploaded to S3`,
        url: fileUrl,
        data: opt,
        });
    } catch (err) {
        console.error('❌ OPT upload error:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.getOptStatus = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        const opt = await OPT.findOne({ employee: employee._id });
        if (!opt) return res.json({ message: 'No OPT uploaded yet' });

        res.json(opt);
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

