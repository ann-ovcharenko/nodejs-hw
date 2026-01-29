import { Router } from 'express';
import { celebrate } from 'celebrate';
import * as notesController from '../controllers/notesController.js';
import * as schemas from '../validations/notesValidation.js';

const router = Router();

router.get(
  '/',
  celebrate(schemas.getAllNotesSchema),
  notesController.getAllNotes,
);

router.get(
  '/:noteId',
  celebrate(schemas.noteIdSchema),
  notesController.getNoteById,
);

router.post(
  '/',
  celebrate(schemas.createNoteSchema),
  notesController.createNote,
);

router.patch(
  '/:noteId',
  celebrate(schemas.updateNoteSchema),
  notesController.updateNote,
);

router.delete(
  '/:noteId',
  celebrate(schemas.noteIdSchema),
  notesController.deleteNote,
);

export default router;
