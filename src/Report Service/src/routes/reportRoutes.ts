import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();
const reportController = new ReportController();

router.post('/', (req, res) => reportController.createReport(req, res));
router.get('/', (req, res) => reportController.getReports(req, res));
router.get('/:id', (req, res) => reportController.getReportById(req, res));
router.put('/:id', (req, res) => reportController.updateReport(req, res));
router.delete('/:id', (req, res) => reportController.deleteReport(req, res));

export default router;