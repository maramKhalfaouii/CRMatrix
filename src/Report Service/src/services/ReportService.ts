import Report from '../models/Report';
import { FilterQuery } from 'mongoose';
import { Tracer } from '@opentelemetry/api';
import { Histogram, Counter } from 'prom-client';
import { DaprClient, HttpMethod } from '@dapr/dapr';

// Prometheus metrics
const REPORT_OPERATIONS = new Counter({
    name: 'report_operations_total',
    help: 'Total report operations',
    labelNames: ['operation', 'status']
});

const OPERATION_DURATION = new Histogram({
    name: 'report_operation_duration_seconds',
    help: 'Duration of report operations',
    labelNames: ['operation']
});

export class ReportService {
    private tracer: Tracer;
    private daprClient: DaprClient;

    constructor(tracer: Tracer) {
        this.tracer = tracer;
        this.daprClient = new DaprClient();
    }

    async createReport(reportData: any) {
        const span = this.tracer.startSpan('createReport');
        const timer = OPERATION_DURATION.startTimer({ operation: 'create' });
        
        try {
            const report = new Report(reportData);
            const result = await report.save();
            
            // Publish event to Dapr
            await this.daprClient.pubsub.publish(
                'pubsub',
                'report-events',
                { action: 'created', reportId: result.id }
            );

            REPORT_OPERATIONS.inc({ operation: 'create', status: 'success' });
            return result;
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'create', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }

    async getReports(filters: FilterQuery<any> = {}) {
        const span = this.tracer.startSpan('getReports');
        const timer = OPERATION_DURATION.startTimer({ operation: 'list' });
        
        try {
            const reports = await Report.find(filters);
            REPORT_OPERATIONS.inc({ operation: 'list', status: 'success' });
            return reports;
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'list', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }

    async getReportById(id: string) {
        const span = this.tracer.startSpan('getReportById');
        const timer = OPERATION_DURATION.startTimer({ operation: 'get' });
        
        try {
            const report = await Report.findById(id);
            REPORT_OPERATIONS.inc({ operation: 'get', status: 'success' });
            return report;
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'get', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }

    async updateReport(id: string, updateData: any) {
        const span = this.tracer.startSpan('updateReport');
        const timer = OPERATION_DURATION.startTimer({ operation: 'update' });
        
        try {
            const report = await Report.findByIdAndUpdate(id, updateData, { new: true });
            
            if (report) {
                await this.daprClient.pubsub.publish(
                    'pubsub',
                    'report-events',
                    { action: 'updated', reportId: id }
                );
            }

            REPORT_OPERATIONS.inc({ operation: 'update', status: 'success' });
            return report;
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'update', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }

    async deleteReport(id: string) {
        const span = this.tracer.startSpan('deleteReport');
        const timer = OPERATION_DURATION.startTimer({ operation: 'delete' });
        
        try {
            const report = await Report.findByIdAndDelete(id);
            
            if (report) {
                await this.daprClient.pubsub.publish(
                    'pubsub',
                    'report-events',
                    { action: 'deleted', reportId: id }
                );
            }

            REPORT_OPERATIONS.inc({ operation: 'delete', status: 'success' });
            return report;
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'delete', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }

    async generateCustomReport(params: any) {
        const span = this.tracer.startSpan('generateCustomReport');
        const timer = OPERATION_DURATION.startTimer({ operation: 'generate' });
        
        try {
            const { reportType, dateRange, filters } = params;
            
            // Get sales data from Sales Service via Dapr
            const salesData = await this.daprClient.invoker.invoke(
                'sales-service',
                'sales/data',
                HttpMethod.POST,
                { dateRange, filters }
            );

            const report = await Report.aggregate([
                { $match: { reportType, ...filters } },
                { $sort: { createdAt: -1 } }
            ]);

            REPORT_OPERATIONS.inc({ operation: 'generate', status: 'success' });
            return { report, salesData };
        } catch (error) {
            REPORT_OPERATIONS.inc({ operation: 'generate', status: 'error' });
            const err = error as Error;
            span.setAttributes({ error: true, 'error.message': err.message });
            throw error;
        } finally {
            timer();
            span.end();
        }
    }
}