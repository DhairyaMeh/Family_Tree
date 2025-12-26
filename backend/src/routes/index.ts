import { Router } from 'express';
import {
  getTree,
  getAllTrees,
  createTree,
  updateTree,
  deleteTree,
  addFirstPerson,
  addSpouse,
  addChild,
  addParent,
  updatePerson,
  deletePerson,
} from '../controllers/treeController.js';
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  googleAuth,
  getProfile,
  updateProfile,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/**
 * Family Tree API Routes
 * 
 * Auth operations:
 * POST   /api/auth/signup      - Register new user
 * POST   /api/auth/login       - Login with username/password
 * POST   /api/auth/verify-otp  - Verify email OTP
 * POST   /api/auth/resend-otp  - Resend verification OTP
 * POST   /api/auth/google      - Google OAuth login
 * GET    /api/auth/profile     - Get current user profile
 * PUT    /api/auth/profile     - Update user profile
 * 
 * Tree operations:
 * GET    /api/trees           - List all trees
 * GET    /api/tree/:id        - Get a specific tree
 * POST   /api/tree            - Create a new tree
 * PUT    /api/tree/:id        - Update tree (rename)
 * DELETE /api/tree/:id        - Delete a tree
 * POST   /api/tree/:id/first-person - Add first person to empty tree
 * 
 * Person operations:
 * PUT    /api/tree/:treeId/person/:personId          - Update person details
 * DELETE /api/tree/:treeId/person/:personId          - Delete a person
 * POST   /api/tree/:treeId/person/:personId/spouse   - Add spouse to person
 * POST   /api/tree/:treeId/person/:personId/child    - Add child to person
 * POST   /api/tree/:treeId/person/:personId/parent   - Add parent to person (ancestor)
 */

// Auth routes
router.post('/auth/signup', signup);
router.post('/auth/login', login);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);
router.post('/auth/google', googleAuth);
router.get('/auth/profile', authenticate, getProfile);
router.put('/auth/profile', authenticate, updateProfile);

// Tree routes
router.get('/trees', getAllTrees);
router.get('/tree/:id', getTree);
router.post('/tree', createTree);
router.put('/tree/:id', updateTree);
router.delete('/tree/:id', deleteTree);
router.post('/tree/:id/first-person', addFirstPerson);

// Person routes
router.put('/tree/:treeId/person/:personId', updatePerson);
router.delete('/tree/:treeId/person/:personId', deletePerson);
router.post('/tree/:treeId/person/:personId/spouse', addSpouse);
router.post('/tree/:treeId/person/:personId/child', addChild);
router.post('/tree/:treeId/person/:personId/parent', addParent);

export default router;

