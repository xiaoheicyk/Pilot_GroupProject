const Report = require('../models/Report');
const Employee = require('../models/Employee');

exports.createReport = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id });
        const houseId = employee.house;

        const report = new Report({
        employee: employee._id,
        house: houseId,
        title: req.body.title,
        description: req.body.description
        });

        await report.save();
        res.status(201).json({ message: 'Report created', report });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
    };

    exports.getMyReports = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id });
        const reports = await Report.find({ employee: employee._id }).sort({ timestamp: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
    };

    exports.addComment = async (req, res) => {
    try {
        const report = await Report.findById(req.body.reportId);
        if (!report) return res.status(404).json({ error: 'Report not found' });

        report.comments.push({
        user: req.user.id,
        content: req.body.content
        });

        await report.save();
        res.json({ message: 'Comment added', report });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
