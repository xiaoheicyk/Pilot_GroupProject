const OPT = require('../models/OPT');
const House = require('../models/House');
const Employee = require('../models/Employee');
const RegistrationToken = require('../models/RegistrationToken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'haoshuli123@dynamicode.net',
    pass: 'Pilotemailsender'
  }
});

exports.getEmployeeOpt = async (req, res) => {
    try {
        const { id } = req.params;
        
        const opt = await OPT.findOne({ employee: id });
        if (!opt) {
            return res.status(404).json({ error: 'OPT record not found' });
        }
        
        res.json(opt);
    } catch (err) {
        console.error('Error fetching OPT data:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

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
        const { email, firstName, lastName } = req.body;

        const token = crypto.randomBytes(20).toString('hex');
        const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 有效期 3 小时

        const newToken = new RegistrationToken({
            email,
            firstName,
            lastName,
            token,
            expiresAt
        });

        await newToken.save();

        // 发送邮件
        const link = `http://localhost:3000/signup?token=${token}`;
        const mailOptions = {
            from: 'haoshuli123@dynamicode.net',
            to: email,
            subject: 'Your Registration Link',
            html: `
                <h1>Welcome ${firstName} ${lastName}!</h1>
                <p>Click the link below to complete your registration:</p>
                <a href="${link}">${link}</a>
                <p>This link will expire in 3 hours.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        
        res.json({ message: 'Registration token created and email sent', link });
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.assignHouse = async (req, res) => {
    const { employeeId, houseId } = req.body;

    if (!employeeId || !houseId) {
        return res.status(400).json({ error: 'Missing employeeId or houseId' });
    }

    try {
        const employee = await Employee.findById(employeeId);
        const house = await House.findById(houseId);

        if (!employee || !house) {
        return res.status(404).json({ error: 'Employee or house not found' });
        }

        employee.house = house._id;
        await employee.save();

        if (!house.employeeId.includes(employee._id)) {
        house.employeeId.push(employee._id);
        await house.save();
        }

        res.json({ message: 'House assigned to employee' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

// 获取所有注册令牌
exports.getAllRegistrationTokens = async (req, res) => {
    try {
        const tokens = await RegistrationToken.find().sort({ createdAt: -1 });
        
        // 检查令牌是否过期
        const currentTime = new Date();
        const tokensWithStatus = tokens.map(token => {
            const tokenObj = token.toObject();
            // 如果令牌已过期但未标记为使用过，在响应中添加过期状态
            if (currentTime > token.expiresAt && !token.used) {
                tokenObj.expired = true;
            } else {
                tokenObj.expired = false;
            }
            
            // 兼容旧数据：为缺少 firstName 和 lastName 的记录添加默认值
            if (!tokenObj.firstName) tokenObj.firstName = '';
            if (!tokenObj.lastName) tokenObj.lastName = '';
            
            return tokenObj;
        });
        
        res.json(tokensWithStatus);
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

// 获取所有入职申请
exports.getAllOnboardingApplications = async (req, res) => {
    try {
        const { status } = req.query;
        
        // 根据状态过滤
        const filter = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            filter.onBoardingStatus = status;
        }
        
        const employees = await Employee.find(filter).select('firstName lastName email onBoardingStatus');
        res.json(employees);
    } catch (err) {
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({})
            .select('firstName middleName lastName preferredName ssn cellPhone email workAuth')
            .populate('userId', 'email')
            .sort({ lastName: 1 });

        const formattedEmployees = employees.map(emp => ({
            id: emp._id,
            firstName: emp.firstName || '',
            middleName: emp.middleName || '',
            lastName: emp.lastName || '',
            preferredName: emp.preferredName || emp.firstName || '',
            ssn: emp.ssn || '',
            visaTitle: emp.workAuth?.visa || '',
            cellPhone: emp.cellPhone || '',
            email: emp.email || (emp.userId?.email || ''),
            onBoardingStatus: emp.onBoardingStatus || 'pending'
        }));

        res.json(formattedEmployees);
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const employee = await Employee.findById(id)
            .populate('userId', 'email')
            .populate('house');
            
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        // Format the employee data to match frontend expectations
        const formattedEmployee = {
            id: employee._id,
            firstName: employee.firstName || '',
            middleName: employee.middleName || '',
            lastName: employee.lastName || '',
            preferredName: employee.preferredName || employee.firstName || '',
            ssn: employee.ssn || '',
            dob: employee.dob || '',
            gender: employee.gender || '',
            
            // Contact info
            email: employee.email || (employee.userId?.email || ''),
            cellPhone: employee.cellPhone || '',
            workPhone: employee.workPhone || '',
            
            // Address
            building: employee.address?.building || '',
            street: employee.address?.street || '',
            city: employee.address?.city || '',
            state: employee.address?.state || '',
            zip: employee.address?.zip || '',
            
            // Work authorization
            visaTitle: employee.workAuth?.visa || '',
            visaStart: employee.workAuth?.startDate || '',
            visaEnd: employee.workAuth?.endDate || '',
            
            // Emergency contacts
            emergency: employee.emergencyContacts?.map(contact => ({
                firstName: contact.firstName || '',
                middleName: contact.middleName || '',
                lastName: contact.lastName || '',
                phone: contact.phone || '',
                email: contact.email || '',
                relationship: contact.relationship || ''
            })) || [],
            
            // Documents
            files: employee.documents?.map(doc => ({
                name: doc.title || 'Document',
                url: doc.link || ''
            })) || []
        };
        
        res.json(formattedEmployee);
    } catch (err) {
        console.error('Error fetching employee details:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};

exports.updateEmployeeSection = async (req, res) => {
    try {
        const { id, section } = req.params;
        const updateData = req.body;
        
        const employee = await Employee.findById(id);
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Update different sections based on the section parameter
        switch (section) {
            case 'identity':
                employee.firstName = updateData.firstName || employee.firstName;
                employee.middleName = updateData.middleName || employee.middleName;
                employee.lastName = updateData.lastName || employee.lastName;
                employee.preferredName = updateData.preferredName || employee.preferredName;
                employee.ssn = updateData.ssn || employee.ssn;
                employee.dob = updateData.dob || employee.dob;
                employee.gender = updateData.gender || employee.gender;
                employee.email = updateData.email || employee.email;
                break;
                
            case 'contact':
                employee.cellPhone = updateData.cellPhone || employee.cellPhone;
                employee.workPhone = updateData.workPhone || employee.workPhone;
                break;
                
            case 'address':
                if (!employee.address) employee.address = {};
                employee.address.building = updateData.building || employee.address.building;
                employee.address.street = updateData.street || employee.address.street;
                employee.address.city = updateData.city || employee.address.city;
                employee.address.state = updateData.state || employee.address.state;
                employee.address.zip = updateData.zip || employee.address.zip;
                break;
                
            case 'workAuth':
                if (!employee.workAuth) employee.workAuth = {};
                employee.workAuth.visa = updateData.visaTitle || employee.workAuth.visa;
                employee.workAuth.startDate = updateData.visaStart || employee.workAuth.startDate;
                employee.workAuth.endDate = updateData.visaEnd || employee.workAuth.endDate;
                break;
                
            case 'emergency':
                employee.emergencyContacts = updateData.emergency || employee.emergencyContacts;
                break;
                
            case 'documents':
                employee.documents = updateData.files || employee.documents;
                break;
                
            default:
                return res.status(400).json({ error: 'Invalid section' });
        }

        await employee.save();
        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Error updating employee:', err);
        res.status(500).json({ error: 'Server error', detail: err.message });
    }
};
