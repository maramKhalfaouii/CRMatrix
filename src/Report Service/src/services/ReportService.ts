import Report from '../models/Report';
import { FilterQuery } from 'mongoose';

export class ReportService {
  async createReport(reportData: any) {
    const report = new Report(reportData);
    return await report.save();
  }

  async getReports(filters: FilterQuery<any> = {}) {
    return await Report.find(filters);
  }

  async getReportById(id: string) {
    return await Report.findById(id);
  }

  async updateReport(id: string, updateData: any) {
    return await Report.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deleteReport(id: string) {
    return await Report.findByIdAndDelete(id);
  }

  async generateCustomReport(params: any) {
    // Add custom report generation logic here
    const { reportType, dateRange, filters } = params;
    // Example aggregation pipeline
    return await Report.aggregate([
      { $match: { reportType, ...filters } },
      { $sort: { createdAt: -1 } }
    ]);
  }
}
