const House = require('../models/House');
const Employee = require('../models/Employee');

exports.getMyHouse = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id }).populate('house');
        if (!employee || !employee.house) return res.status(404).json({ error: 'No house assigned' });

        const house = await House.findById(employee.house).populate('employeeId', 'firstName lastName cellPhone');
        res.json(house);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
