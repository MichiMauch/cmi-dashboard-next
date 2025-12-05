/**
 * Gas Bottle Model
 * Tracks gas bottle usage with start/end dates
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGasBottle {
  type: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface IGasBottleDocument extends IGasBottle, Document {}

const GasBottleSchema = new Schema<IGasBottleDocument>(
  {
    type: {
      type: String,
      required: true,
      default: '10.5kg',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient queries
GasBottleSchema.index({ startDate: -1 });
GasBottleSchema.index({ endDate: 1 });

// Prevent model recompilation in development
const GasBottle: Model<IGasBottleDocument> =
  mongoose.models.GasBottle || mongoose.model<IGasBottleDocument>('GasBottle', GasBottleSchema);

export default GasBottle;
