import { Schema, model } from 'mongoose';
import { TAGS } from '../constants/tags.js';

const notesSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: '',
      trim: true,
    },
    tag: {
      type: String,
      enum: TAGS,
      default: 'Todo',
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

notesSchema.index({ title: 'text', content: 'text' });

export const Note = model('note', notesSchema, 'notes');
