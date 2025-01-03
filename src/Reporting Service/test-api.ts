import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
const API_URL = 'http://localhost:3000/api';

interface Report {
  reportName: string;
  reportType: string;
  filters: object;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

interface ReportResponse extends Report {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

const sampleReport: Report = {
  reportName: 'Sales Q1 2024',
  reportType: 'sales',
  filters: {
    region: 'North',
    product: 'Widget A'
  },
  dateRange: {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-03-31')
  }
};

async function testAPI() {
  let createdReportId: string;

  try {
    console.log(chalk.blue('\n🚀 Starting API Tests...\n'));

    // Test CREATE
    console.log(chalk.yellow('Testing POST /api/reports'));
    const createResponse = await axios.post<ReportResponse>(`${API_URL}/reports`, sampleReport);
    createdReportId = createResponse.data._id;
    console.log(chalk.green('✅ CREATE Test passed'));
    console.log('Created report ID:', createdReportId);

    // Test GET ALL
    console.log(chalk.yellow('\nTesting GET /api/reports'));
    const getAllResponse = await axios.get<ReportResponse[]>(`${API_URL}/reports`);
    console.log(chalk.green('✅ GET ALL Test passed'));
    console.log('Number of reports:', getAllResponse.data.length);

    // Test GET by ID
    console.log(chalk.yellow('\nTesting GET /api/reports/:id'));
    const getByIdResponse = await axios.get<ReportResponse>(`${API_URL}/reports/${createdReportId}`);
    console.log(chalk.green('✅ GET BY ID Test passed'));
    console.log('Retrieved report name:', getByIdResponse.data.reportName);

    // Test UPDATE
    console.log(chalk.yellow('\nTesting PUT /api/reports/:id'));
    const updateData = {
      reportName: 'Updated Sales Report',
      filters: {
        ...sampleReport.filters,
        status: 'completed'
      }
    };
    const updateResponse = await axios.put<ReportResponse>(`${API_URL}/reports/${createdReportId}`, updateData);
    console.log(chalk.green('✅ UPDATE Test passed'));
    console.log('Updated report name:', updateResponse.data.reportName);

    // Test DELETE
    console.log(chalk.yellow('\nTesting DELETE /api/reports/:id'));
    await axios.delete(`${API_URL}/reports/${createdReportId}`);
    console.log(chalk.green('✅ DELETE Test passed'));

    // Verify DELETE
    console.log(chalk.yellow('\nVerifying DELETE operation'));
    try {
      await axios.get(`${API_URL}/reports/${createdReportId}`);
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 404) {
        console.log(chalk.green('✅ DELETE Verification passed'));
      }
    }

    console.log(chalk.blue('\n✨ All tests completed successfully!\n'));

  } catch (error) {
    const axiosError = error as AxiosError;
    console.log(chalk.red('\n❌ Test Failed:'));
    if (axiosError.response) {
      console.log(chalk.red('Status:', axiosError.response.status));
      console.log(chalk.red('Error:', JSON.stringify(axiosError.response.data, null, 2)));
    } else {
      console.log(chalk.red('Error:', axiosError.message));
    }
    process.exit(1);
  }
}

// Run the tests
testAPI();