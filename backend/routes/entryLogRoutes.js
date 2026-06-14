const express = require('express');
const router = express.Router();
const {
    markExit,
    getVehicleHistory,
    createLog,
    getAllLogs,
    updateLog,
    deleteLog,
    uploadPhoto,
} = require('../controller/entryLogController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/multer');
// all roles can view — but phone masked in controller based on role
router.get('/', protect, authorize('admin', 'guard' , 'viewer'), getAllLogs);

//only guard and admin can create entry log 
router.post('/',protect,authorize('guard','admin'),createLog);

router.put('/:id/exit', protect, authorize('guard', 'admin'), markExit);

router.put('/:id', protect, authorize('admin'), updateLog);

router.delete('/:id', protect, authorize('admin'), deleteLog);

router.get('/vehicle/:vehicleNumber', protect, authorize('admin', 'guard', 'viewer'), getVehicleHistory);

// photo upload --> request comes in -> protect --> authorize --> upload single --> validate using multer 
// This is called middleware chaining — each function runs in order. If any step fails, the chain stops and error is returned. Your actual controller never runs unless all checks pass.module.exports= router;

router.put('/:id/photos',protect, authorize('guard','admin'),upload.single('photo'),uploadPhoto);

module.exports= router;
