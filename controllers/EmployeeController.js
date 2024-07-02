const EmployeeService = require('../services/EmployeeService');

async function create (req, res){
    try {
        const Employee = await EmployeeService.create(req, res);
        res.status(200).json(Employee)
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    create
}