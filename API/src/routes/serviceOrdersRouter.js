const { Router } = require('express');
const servicesOrdersController = require('../controller/servicesOrdersController');

const router = Router();

router.post('/create', (req, res) => servicesOrdersController.create(req, res));

router.get('/get', (req, res) => servicesOrdersController.getAll(req, res));

router.get('/getUnique/:id', (req, res) => servicesOrdersController.getUnique(req, res));

router.get('/get/manutentor/:id', (req, res) => servicesOrdersController.getByManutentor(req, res))

module.exports = router;