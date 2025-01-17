// src/services/ReportService.ts
import { DaprClient, DaprServer, CommunicationProtocolEnum } from '@dapr/dapr';
import Report from '../models/Report';
import { FilterQuery } from 'mongoose';

export class ReportService {
    private daprClient: DaprClient;
    private readonly PUBSUB_NAME = 'pubsub';
    private readonly STATE_STORE_NAME = 'statestore';

    constructor() {
        this.daprClient = new DaprClient();
        this.initializeDaprSubscriptions();
    }

    private async initializeDaprSubscriptions() {
        const server = new DaprServer({
            serverHost: '127.0.0.1',
            serverPort: 50002,
            communicationProtocol: CommunicationProtocolEnum.HTTP
        });

        // Subscribe to customer events
        await server.pubsub.subscribe(this.PUBSUB_NAME, 'customer-events', async (data) => {
            console.log('Received customer event:', data);
            await this.handleCustomerEvent(data);
        });

        await server.start();
    }

    private async handleCustomerEvent(data: any) {
        // Create a report based on customer event
        await this.createReport({
            reportType: 'CUSTOMER_EVENT',
            data: data,
            timestamp: new Date(),
            status: 'PROCESSED'
        });
    }

    // Existing MongoDB methods
    async createReport(reportData: any) {
        const report = new Report(reportData);
        const savedReport = await report.save();
        
        // Also save to Dapr state store for redundancy/caching
        await this.daprClient.state.save(this.STATE_STORE_NAME, [{
            key: `report-${savedReport._id}`,
            value: savedReport
        }]);
        
        // Publish report created event
        await this.daprClient.pubsub.publish(
            this.PUBSUB_NAME,
            'report-created',
            savedReport
        );

        return savedReport;
    }

    async getReports(filters: FilterQuery<any> = {}) {
        return await Report.find(filters);
    }

    async getReportById(id: string) {
        // Try getting from Dapr state store first (faster)
        const stateReport = await this.daprClient.state.get(
            this.STATE_STORE_NAME,
            `report-${id}`
        );

        if (stateReport) {
            return stateReport;
        }

        // Fall back to MongoDB
        return await Report.findById(id);
    }

    async updateReport(id: string, updateData: any) {
        const updatedReport = await Report.findByIdAndUpdate(id, updateData, { new: true });
        
        if (updatedReport) {
            // Update Dapr state store
            await this.daprClient.state.save(this.STATE_STORE_NAME, [{
                key: `report-${id}`,
                value: updatedReport
            }]);

            // Publish update event
            await this.daprClient.pubsub.publish(
                this.PUBSUB_NAME,
                'report-updated',
                updatedReport
            );
        }

        return updatedReport;
    }

    async deleteReport(id: string) {
        const deletedReport = await Report.findByIdAndDelete(id);
        
        if (deletedReport) {
            // Delete from Dapr state store
            await this.daprClient.state.delete(
                this.STATE_STORE_NAME,
                `report-${id}`
            );

            // Publish delete event
            await this.daprClient.pubsub.publish(
                this.PUBSUB_NAME,
                'report-deleted',
                { id }
            );
        }

        return deletedReport;
    }

    async generateCustomReport(params: any) {
        const { reportType, dateRange, filters } = params;
        const report = await Report.aggregate([
            { $match: { reportType, ...filters } },
            { $sort: { createdAt: -1 } }
        ]);

        // Cache the custom report in Dapr state store
        const cacheKey = `custom-report-${reportType}-${Date.now()}`;
        await this.daprClient.state.save(this.STATE_STORE_NAME, [{
            key: cacheKey,
            value: report
        }]);

        return report;
    }
}