const { Router } = require('express');
const servicesOrdersController = require('../controller/servicesOrdersController');
const { auth, authorize } = require('../middleware/auth'); 

const router = Router();

router.post('/create', 
    auth, 
    authorize(['INSPECTOR']), 
    servicesOrdersController.create
);

router.get('/get', 
    auth, 
    authorize(['ADMIN', 'MANUTENTOR', 'INSPECTOR']), 
    servicesOrdersController.getAll
);

router.get('/getUnique/:id', 
    auth, 
    authorize(['ADMIN', 'MANUTENTOR', 'INSPECTOR']), 
    servicesOrdersController.getUnique
);

router.delete('/delete/:id', 
    auth, 
    authorize(['ADMIN']), 
    servicesOrdersController.delete
);

router.patch('/assign/:id', 
    auth, 
    authorize(['ADMIN']), 
    servicesOrdersController.assignMaintainer
);

router.patch('/submit/:id', 
    auth, 
    authorize(['MAINTAINER']), 
    servicesOrdersController.submitWork
);

router.patch('/approve/:id', 
    auth, 
    authorize(['ADMIN']), 
    servicesOrdersController.approveWork
);

module.exports = router;