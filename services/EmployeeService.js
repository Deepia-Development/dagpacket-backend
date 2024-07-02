const EmployeesModel = require('../models/EmployeesModel');
const { successResponse, errorResponse, dataResponse } = require('../helpers/ResponseHelper');

async function create(req){
    try {
        
        const employExists = await EmployeesModel.findOne({ email: req.body.email });
        if(employExists) return errorResponse('El empleado ya existe');

        const { user_id, name, surname, phone, email, role_id } = req.body;
        const Employee = new EmployeesModel({ user_id, name, surname, phone, email, role_id});
        await Employee.save();

        if(Employee){
            return successResponse('Empleado agregado')
        }
    } catch (error) {
        return errorResponse('No se pudo agregar el usuario: ', error.message);
    }
}

async function updateEmploye(req){
    try {
        const { id } = req.params;
        const { name, surname, phone, email, role_id } = req.body;
        const Employee = await EmployeesModel.findOneAndUpdate({ _id: id },
            name, surname, phone, email, role_id
        )
        if(Employee){
            return successResponse('Empleado actualizado');            
        }
    } catch (error) {
        return errorResponse('Error al actualizar los datos: ' + error.message)
    }
}

async function deleteEmployee(req){
    try {
        const { id } = req.params;
        const Employee = await EmployeesModel.findOneAndDelete({ _id: id });
        if(Employee){
            return successResponse('Empleado eliminado');
        }
    } catch (error) {
        return errorResponse('Ocurrio un error al eliminar el usuario: ', + error.message);
    }
}




module.exports = {
    create
}