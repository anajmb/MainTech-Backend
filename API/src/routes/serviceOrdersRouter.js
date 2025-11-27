const { Router } = require('express');
const servicesOrdersController = require('../controller/servicesOrdersController');
const { auth, authorize } = require('../middlewares/auth');

const router = Router();

router.post('/create',
    auth,
    authorize(['INSPECTOR']),
    servicesOrdersController.create
);

router.get('/get',
    auth,
    authorize(['ADMIN', 'MAINTAINER', 'INSPECTOR']),
    servicesOrdersController.getAll
);

router.get('/getUnique/:id',
    auth,
    authorize(['ADMIN', 'MAINTAINER', 'INSPECTOR']),
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

router.patch('/refuse/:id',
    auth,
    authorize(['ADMIN']),
    servicesOrdersController.refuseWork
);

module.exports = router;