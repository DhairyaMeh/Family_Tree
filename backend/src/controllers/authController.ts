/**
 * Authentication controller for user registration, login, and verification.
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/User.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import type {
  SignupRequest,
  LoginRequest,
  VerifyOtpRequest,
  GoogleAuthRequest,
} from '../types/index.js';

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email transporter (configure with your SMTP settings)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Generate a 6-digit OTP
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP email
 */
async function sendOtpEmail(email: string, otp: string): Promise<boolean> {
  // Always log OTP for debugging (check terminal if email doesn't arrive)
  console.log(`📧 OTP for ${email}: ${otp}`);
  
  // Check if SMTP is configured
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  
  if (!smtpUser || !smtpPass) {
    console.log(`⚠️ SMTP not configured - email not sent. Check OTP above.`);
    return true; // Return true so signup/verification flow continues
  }
  
  try {
    console.log(`📧 Sending OTP email to ${email} via ${process.env.SMTP_HOST}...`);
    
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || smtpUser,
      to: email,
      subject: 'Verify your email - Family Tree',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Welcome to Family Tree!</h2>
          <p>Your verification code is:</p>
          <div style="background: #f1f5f9; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    
    console.log(`✅ Email sent successfully! Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    // Still return true so the flow continues - user can check terminal for OTP
    return true;
  }
}

/**
 * User signup - creates account and sends verification OTP
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, password } = req.body as SignupRequest;
    
    // Validate input
    if (!username || !email || !password) {
      res.status(400).json({ success: false, error: 'Username, email, and password are required' });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }
    
    // Check if username or email already exists
    const existingUser = await UserModel.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() },
      ],
    });
    
    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        res.status(400).json({ success: false, error: 'Username already taken' });
      } else {
        res.status(400).json({ success: false, error: 'Email already registered' });
      }
      return;
    }
    
    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Create user
    const userId = uuidv4();
    const user = new UserModel({
      _id: userId,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      tier: 'free',
      isEmailVerified: false,
      emailOtp: otp,
      emailOtpExpiry: otpExpiry,
    });
    
    await user.save();
    
    // Send OTP email for later verification
    await sendOtpEmail(email, otp);
    
    // Generate token so user can login immediately
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
        },
        token,
        message: 'Account created! Please verify your email.',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Verify email with OTP
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body as VerifyOtpRequest;
    
    if (!email || !otp) {
      res.status(400).json({ success: false, error: 'Email and OTP are required' });
      return;
    }
    
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    
    if (user.isEmailVerified) {
      res.status(400).json({ success: false, error: 'Email already verified' });
      return;
    }
    
    if (!user.emailOtp || !user.emailOtpExpiry) {
      res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
      return;
    }
    
    if (new Date() > user.emailOtpExpiry) {
      res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
      return;
    }
    
    if (user.emailOtp !== otp) {
      res.status(400).json({ success: false, error: 'Invalid OTP' });
      return;
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
        },
        token,
        message: 'Email verified successfully!',
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Resend verification OTP
 */
export async function resendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }
    
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }
    
    if (user.isEmailVerified) {
      res.status(400).json({ success: false, error: 'Email already verified' });
      return;
    }
    
    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.emailOtp = otp;
    user.emailOtpExpiry = otpExpiry;
    await user.save();
    
    // Send OTP email
    await sendOtpEmail(email, otp);
    
    res.json({
      success: true,
      data: { message: 'OTP sent to your email' },
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * User login with username/email and password
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { usernameOrEmail, password } = req.body as LoginRequest;
    
    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, error: 'Username/email and password are required' });
      return;
    }
    
    // Find user by username or email
    const user = await UserModel.findOne({
      $or: [
        { username: usernameOrEmail.toLowerCase() },
        { email: usernameOrEmail.toLowerCase() },
      ],
    });
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Google OAuth login/signup
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential } = req.body as GoogleAuthRequest;
    
    if (!credential) {
      res.status(400).json({ success: false, error: 'Google credential is required' });
      return;
    }
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      res.status(400).json({ success: false, error: 'Invalid Google token' });
      return;
    }
    
    const { email, name, sub: googleId, picture } = payload;
    
    // Check if user exists
    let user = await UserModel.findOne({
      $or: [
        { googleId },
        { email: email.toLowerCase() },
      ],
    });
    
    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true;
        await user.save();
      }
    } else {
      // Create new user
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.random().toString(36).slice(-4);
      
      user = new UserModel({
        _id: uuidv4(),
        username,
        email: email.toLowerCase(),
        password: uuidv4(), // Random password for Google users
        googleId,
        tier: 'free',
        isEmailVerified: true,
        profileImage: picture,
      });
      
      await user.save();
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
          profileImage: user.profileImage,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, error: 'Google authentication failed' });
  }
}

/**
 * Get current user profile
 */
export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    
    const { profileImage, currentPassword, newPassword } = req.body;
    
    // Update profile image if provided
    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }
    
    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ success: false, error: 'Current password is incorrect' });
        return;
      }
      
      if (newPassword.length < 6) {
        res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
        return;
      }
      
      user.password = newPassword;
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        isEmailVerified: user.isEmailVerified,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

