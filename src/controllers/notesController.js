import { Note } from '../models/note.js';
import createError from 'http-errors';

export const getAllNotes = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const perPage = Number(req.query.perPage) || 10;
    const { tag, search } = req.query;

    const filter = {};
    if (tag) filter.tag = tag;

    if (search && search.trim() !== '') {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * perPage;

    const [notes, totalNotes] = await Promise.all([
      Note.find(filter)
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 })
        .lean(),
      Note.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalNotes / perPage);

    res.status(200).json({
      page,
      perPage,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    console.error('GET ALL NOTES ERROR:', error.message);
    next(error);
  }
};

export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findById(noteId);

    if (!note) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create(req.body);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const updatedNote = await Note.findByIdAndUpdate(noteId, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedNote) {
      throw createError(404, 'Note not found');
    }

    res.status(200).json(updatedNote);
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const result = await Note.findByIdAndDelete(noteId);

    if (!result) {
      throw createError(404, 'Note not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
