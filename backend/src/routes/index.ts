import { Router } from 'express';
import {
  getTree,
  getTreeByShareToken,
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
import { authenticate, optionalAuth } from '../middleware/auth.js';

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

// Tree routes (with optional auth to show user's trees)
router.get('/trees', optionalAuth, getAllTrees);
router.get('/tree/shared', getTreeByShareToken); // Public route for shared trees
router.get('/tree/:id', optionalAuth, getTree);

// Tree routes (protected - require authentication)
router.post('/tree', authenticate, createTree);
router.put('/tree/:id', authenticate, updateTree);
router.delete('/tree/:id', authenticate, deleteTree);
router.post('/tree/:id/first-person', authenticate, addFirstPerson);

// Person routes (protected - require authentication and ownership)
router.put('/tree/:treeId/person/:personId', authenticate, updatePerson);
router.delete('/tree/:treeId/person/:personId', authenticate, deletePerson);
router.post('/tree/:treeId/person/:personId/spouse', authenticate, addSpouse);
router.post('/tree/:treeId/person/:personId/child', authenticate, addChild);
router.post('/tree/:treeId/person/:personId/parent', authenticate, addParent);

export default router;

