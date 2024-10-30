const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const PublicityModel = new Schema({
    locker_id : { type: Schema.Types.ObjectId, ref: 'lockers', required: true },
    publicity:[
        {
            enterprise: { type: String, required: true },
            images: [
             {  
                image64: {type: Buffer, required: false},
                url: { type: String, required: false },
                alt: { type: String },
             }
            ],
            description: { type: String, required: true },
            // contract: { type: String, required: true },
        }
    ]

})


module.exports = mongoose.model('locker_publicity', PublicityModel);