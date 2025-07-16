const OPT = require('../models/OPT');
const Employee = require('../models/Employee');

exports.uploadOptDocument = async (req, res) => {
    try {
        const { type } = req.body;
        const file = req.file;

        if (!['receipt', 'ead', 'i983', 'i20'].includes(type)) {
        return res.status(400).json({ error: 'Invalid document type' });
        }

        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        let opt = await OPT.findOne({ employee: employee._id });
        if (!opt) {
        opt = new OPT({ employee: employee._id });
        }

        opt[type] = {
        url: `/uploads/${file.filename}`,
        status: 'pending'
        };

        await opt.save();
        res.json({ message: `${type} uploaded`, data: opt });
    } catch (err) {
        console.error('❌ OPT upload error:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};
