const PublicityLockerService = require('../services/PublicityLockerService');


async function create(req,res){
    try{
        const Publicity = await PublicityLockerService.createPublicity(req,res);
        res.status(200).json(Publicity);
    }catch(error){
        res.status(400).json({ message: error.message });
    }
}



module.exports = {
    create
};