const OPT = require('../models/OPT');

exports.reviewVisa = async (req, res) => {
    try {
        const { employeeId, type, action } = req.body;

        if (!['receipt', 'ead', 'i983', 'i20'].includes(type)) {
        return res.status(400).json({ error: 'Invalid document type' });
        }
        if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
        }

        const opt = await OPT.findOne({ employee: employeeId });
        if (!opt) return res.status(404).json({ error: 'OPT record not found' });

        opt[type].status = action === 'approve' ? 'approval' : 'rejected';
        await opt.save();

        res.json({ message: `OPT ${type} ${action}d` });
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};
