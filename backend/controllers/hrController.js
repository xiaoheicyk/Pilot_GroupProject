const OPT = require('../models/OPT');
const House = require('../models/House');
const Employee = require('../models/Employee');
const RegistrationToken = require('../models/RegistrationToken');
const crypto = require('crypto');

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

exports.reviewOnboarding = async (req, res) => {
    try {
        const { employeeId, action } = req.body;

        if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ error: 'Invalid action' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });

        employee.onBoardingStatus = action === 'approve' ? 'approved' : 'rejected';
        await employee.save();

        res.json({ message: `Onboarding ${action}d` });
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.getProgressStatus = async (req, res) => {
    try {
        const employees = await Employee.find({}).populate('userId');

        const result = await Promise.all(
            employees.map(async (emp) => {
                const opt = await OPT.findOne({ employee: emp._id });

                let remain = 0;
                if (emp.workAuth?.endDate) {
                const today = new Date();
                const end = new Date(emp.workAuth.endDate);
                remain = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
                }

                let nextStep = 'Submit onboarding';
                if (emp.onBoardingStatus === 'pending') nextStep = 'HR approval pending';
                if (emp.onBoardingStatus === 'approved') {
                if (!opt || !opt.receipt) {
                    nextStep = 'Upload OPT Receipt';
                } else if (opt.receipt.status === 'pending') {
                    nextStep = 'Waiting for HR to approve OPT Receipt';
                } else if (!opt.ead) {
                    nextStep = 'Upload OPT EAD';
                } else if (opt.ead.status === 'pending') {
                    nextStep = 'Waiting for HR to approve OPT EAD';
                } else if (!opt.i983) {
                    nextStep = 'Upload I-983';
                } else if (!opt.i20) {
                    nextStep = 'Upload I-20';
                } else {
                    nextStep = 'All documents approved';
                }
                }

                return {
                name: `${emp.firstName} ${emp.lastName}`,
                workAuth: {
                    title: emp.workAuth?.visa || 'N/A',
                    startDate: emp.workAuth?.startDate || null,
                    endDate: emp.workAuth?.endDate || null,
                    remain
                },
                nextStep
                };
            })
            );

            res.json(result);
        } catch (err) {
            res.status(500).json({ error: 'Server error', detail: err.message });
        }
};

exports.generateRegistrationToken = async (req, res) => {
    try {
        const { email } = req.body;

        const token = crypto.randomBytes(20).toString('hex');
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 有效期 3 小时

        const newToken = new RegistrationToken({
        email,
        token,
        expiresAt
        });

        await newToken.save();

        const link = `http://localhost:3000/register?token=${token}`;
        res.json({ message: 'Registration token created', link });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
