/**
 * Shelly Reading Model for MongoDB
 * Stores historical temperature and humidity readings from Shelly H&T sensors
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IShellyReading {
  deviceId: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  battery: number;
  wifiSignal?: number;
}

const shellyReadingSchema = new Schema<IShellyReading>({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  temperature: {
    type: Number,
    required: true,
  },
  humidity: {
    type: Number,
    required: true,
  },
  battery: {
    type: Number,
    required: true,
  },
  wifiSignal: {
    type: Number,
    required: false,
  },
});

// Compound index for efficient queries by device and time range
shellyReadingSchema.index({ deviceId: 1, timestamp: -1 });

// Unique index to prevent duplicate readings
shellyReadingSchema.index({ deviceId: 1, timestamp: 1 }, { unique: true });

// Prevent model recompilation in development (Next.js hot reload)
const ShellyReading: Model<IShellyReading> =
  mongoose.models.ShellyReading ||
  mongoose.model<IShellyReading>('ShellyReading', shellyReadingSchema);

export default ShellyReading;
