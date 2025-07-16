const Employee = require('../models/Employee');

exports.submitOnboarding = async (req, res) => {
    try {
        const userId = req.user.id;
        const existing = await Employee.findOne({ userId });
        if (existing) return res.status(400).json({ error: 'Already submitted onboarding' });

        const employee = new Employee({ userId, ...req.body });
        await employee.save();

        res.status(201).json({ message: 'Onboarding submitted' });
    } catch (err) {
        console.error('❌ Error submitting onboarding:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.employeeId).populate('house');
        if (!employee) return res.status(404).json({ error: 'Not found' });

        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
