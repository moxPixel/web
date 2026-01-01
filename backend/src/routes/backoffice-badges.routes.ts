import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { ApiResponse } from '../types';
import Training from '../models/Training';
import Event from '../models/Event';
import Certification from '../models/Certification';
import Contact, { ContactStatus } from '../models/Contact';
import TrainingEnrollment, { EnrollmentStatus } from '../models/TrainingEnrollment';
import User, { UserStatus } from '../models/User';

type BackofficeBadges = {
  trainingsDraft: number;
  eventsDraft: number;
  certificationsInactive: number;
  usersPending: number;
  contactsToProcess: number; // pending + in_progress
  enrollmentsToProcess: number; // submitted + in_review
};

const router = Router();

// Admin-only: aggregated counts for backoffice navbar badges.
router.get('/', authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const [
    trainingsDraft,
    eventsDraft,
    certificationsInactive,
    usersPending,
    contactsToProcess,
    enrollmentsToProcess,
  ] = await Promise.all([
    Training.count({ where: { status: 'draft' } }),
    Event.count({ where: { status: 'draft' } }),
    Certification.count({ where: { status: 'inactive' } }),
    User.count({ where: { status: UserStatus.PENDING } }),
    Contact.count({ where: { status: [ContactStatus.PENDING, ContactStatus.IN_PROGRESS] as any } }),
    TrainingEnrollment.count({ where: { status: [EnrollmentStatus.SUBMITTED, EnrollmentStatus.IN_REVIEW] as any } }),
  ]);

  const data: BackofficeBadges = {
    trainingsDraft,
    eventsDraft,
    certificationsInactive,
    usersPending,
    contactsToProcess,
    enrollmentsToProcess,
  };

  const response: ApiResponse<BackofficeBadges> = { success: true, data };
  res.status(200).json(response);
});

export default router;


