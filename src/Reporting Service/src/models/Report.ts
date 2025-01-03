
import mongoose, { Schema, Document } from 'mongoose';

interface IReport extends Document {
  reportName: string;
  reportType: string;
  filters: object;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  reportName: { type: String, required: true },
  reportType: { type: String, required: true },
  filters: { type: Object, default: {} },
  dateRange: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  }
}, {
  timestamps: true
});

export default mongoose.model<IReport>('Report', ReportSchema);