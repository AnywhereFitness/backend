import express from 'express';
import verifyToken from '../middleware/verifyToken.mjs';
import verifyRole from '../middleware/verifyRole.mjs';
import Class from '../model/Class.mjs';
import Reservation from '../model/Reservation.mjs';

const router = express.Router();

// Get Classes
router.get('/', verifyToken, async (req, res) => {
  try {
    const classes = await Class.find();
    res.send(classes);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Class By ID
router.get('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const class_ = await Class.findById(id);
    res.send(class_);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Class By Instructor
router.get('/instructor/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const class_ = await Class.find({ instructor: id });
    res.send(class_);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get Reservations
// Maybe filter by instructor id
router.get(
  '/:id/reservations',
  [verifyToken, verifyRole('instructor')],
  async (req, res) => {
    try {
      const reservations = await Reservation.find({
        classId: req.params.id
      }).select('_id classId');
      res.send(reservations);
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

// Add Class
router.post('/', [verifyToken, verifyRole('instructor')], async (req, res) => {
  const data = req.body;

  try {
    // const user = await User.findById({ id: req.user.id });
    const class_ = new Class({
      ...data,
      instructor: req.user.id
    });
    const newClass = await class_.save();
    res.send(newClass);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete Reservation
// Maybe filter by instructor id
router.delete(
  '/:id/reservation',
  [verifyToken, verifyRole('instructor')],
  async (req, res) => {
    const { id } = req.params;
    try {
      const removedReservation = await Reservation.findOneAndRemove({
        classId: id
      });
      await Class.updateOne(
        { _id: id },
        {
          $pull: {
            registeredAttendees: removedReservation._id
          }
        }
      );
      res.send({
        message: `${removedReservation.deletedCount} Reservation deleted`
      });
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

// Delete Class
router.delete(
  '/:id',
  [verifyToken, verifyRole('instructor')],
  async (req, res) => {
    const { id } = req.params;
    try {
      const removedClass = await Class.deleteOne({ _id: id });
      res.send(removedClass);
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

// Update Class
router.put(
  '/:id',
  [verifyToken, verifyRole('instructor')],
  async (req, res) => {
    const { id } = req.params;
    try {
      const updatedClass = await Class.updateOne(
        { _id: id },
        {
          $set: {
            ...req.body
          }
        }
      );
      res.send(updatedClass);
    } catch (error) {
      res.status(400).send(error);
    }
  }
);

export default router;
