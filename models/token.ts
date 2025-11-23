/**
 * Token Model for MongoDB
 * Stores Victron API access tokens with expiration
 */

import mongoose, { Schema, Model } from 'mongoose';

export interface IToken {
  accessToken: string;
  expiresAt: Date;
}

const tokenSchema = new Schema<IToken>({
  accessToken: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// Prevent model recompilation in development (Next.js hot reload)
const Token: Model<IToken> =
  mongoose.models.Token || mongoose.model<IToken>('Token', tokenSchema);

export default Token;
