const CuponController = require('../controllers/CuponController')
const router = require('express').Router()

router.post('/create', CuponController.createCupon)
router.get('/all', CuponController.getAllCupon) 
router.get('/:id', CuponController.getCuponById)
router.get('/user/:user_id', CuponController.getCuponByUserId)
router.patch('/update/:id', CuponController.updateCupon)
router.patch('/status/:id', CuponController.changeCuponStatus)

module.exports = router

