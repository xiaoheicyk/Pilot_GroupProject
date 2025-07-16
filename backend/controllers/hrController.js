const OPT = require('../models/OPT');
const House = require('../models/House');

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

exports.addHouse = async (req, res) => {
    try {
        const house = new House(req.body);
        await house.save();
        res.status(201).json({ message: 'House added', house });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllHouses = async (req, res) => {
    try {
        const houses = await House.find({})
        .populate('employeeId', 'firstName lastName phone email car')
        .populate({
            path: 'report',
            populate: {
            path: 'comments.user',
            select: 'username'
            }
        })
        .sort({ address: 1 });

        res.json(houses);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

