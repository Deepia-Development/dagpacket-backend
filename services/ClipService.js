const ClipModel = require('../models/ClipModel');
const WalletModel = require('../models/WalletsModel');
const {successResponse, errorResponse, dataResponse} = require('../helpers/ResponseHelper');

class ClipService {
    constructor() {}

    async getClip() {
        console.log("Fetching clip data...");
        try {
            const response = await ClipModel.find()
            .populate({
                path: 'operation_by',
                select: 'name email' // solo estos campos
            })
            .populate('transaction_id');
        
            console.log(response);
            return dataResponse('Clip data fetched successfully', response);
        } catch (error) {
            throw new Error('Error fetching clip: ' + error.message);
        }
    }

    async refoundClip(req) {
        try{
            const {id} = req.params; 
            const response = await ClipModel.findById(id).populate({
                path: 'operation_by',
                select: 'name email _id' // solo estos campos
            }).populate('transaction_id');
            if(!response){
                throw new Error('Clip not found');
            }
            const user_id = response.operation_by._id;
            const amount = response.transaction_id.amount;



            const wallet = await WalletModel.findOne({user: user_id});

            // wallet.sendBalance = wallet.sendBalance + amount;


            const newBalance = parseFloat(wallet.sendBalance) + parseFloat(amount);
            wallet.sendBalance = newBalance.toFixed(2); // Actualiza el saldo en la billetera
            
            await wallet.save();
            return successResponse('Clip refounded successfully', response);
        }catch(error){
            throw new Error('Error refounding clip: ' + error.message);
        }
    }
}

module.exports = new ClipService();
