import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  async createReport(req: Request, res: Response) {
    try {
      const report = await this.reportService.createReport(req.body);
      res.status(201).json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create report' });
    }
  }

  async getReports(req: Request, res: Response) {
    try {
      const reports = await this.reportService.getReports(req.query);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }

  async getReportById(req: Request, res: Response) {
    try {
      const report = await this.reportService.getReportById(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }

  async updateReport(req: Request, res: Response) {
    try {
      const report = await this.reportService.updateReport(req.params.id, req.body);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update report' });
    }
  }

  async deleteReport(req: Request, res: Response) {
    try {
      const report = await this.reportService.deleteReport(req.params.id);
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete report' });
    }
  }
}
