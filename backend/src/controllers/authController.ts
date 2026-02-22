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
 * Send OTP via SMS
 * Supports: Twilio, Fast2SMS (India), or falls back to console logging
 */
async function sendPhoneOtp(phone: string, otp: string): Promise<boolean> {
  // Always log OTP for debugging
  console.log(`📱 Phone OTP for ${phone}: ${otp}`);
  
  // Option 1: Twilio (Global - Recommended)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
  
  if (twilioSid && twilioToken && twilioPhone) {
    try {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phone,
          From: twilioPhone,
          Body: `Your Family Tree verification code is: ${otp}. Valid for 10 minutes.`,
        }),
      });
      
      if (response.ok) {
        console.log(`✅ SMS sent via Twilio to ${phone}`);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ Twilio error:', error);
      }
    } catch (error) {
      console.error('❌ Twilio SMS failed:', error);
    }
  }
  
  // Option 2: Fast2SMS (India - Free tier)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  
  if (fast2smsKey && phone.startsWith('+91')) {
    try {
      // Remove +91 prefix for Fast2SMS
      const indianNumber = phone.replace('+91', '').replace(/\D/g, '');
      
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q', // Quick SMS route
          message: `Your Family Tree verification code is: ${otp}. Valid for 10 minutes.`,
          numbers: indianNumber,
        }),
      });
      
      const data = await response.json();
      if (data.return === true) {
        console.log(`✅ SMS sent via Fast2SMS to ${phone}`);
        return true;
      } else {
        console.error('❌ Fast2SMS error:', data);
      }
    } catch (error) {
      console.error('❌ Fast2SMS failed:', error);
    }
  }
  
  // Fallback: Log to console
  console.log(`⚠️ SMS service not configured - check console for OTP above`);
  return true;
}

/**
 * User signup - creates account and sends verification OTP
 * Supports signup via email OR phone number (at least one required)
 */
export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const { username, email, phone, password } = req.body;
    
    // Validate input - require username, password, and at least email OR phone
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }
    
    if (!email && !phone) {
      res.status(400).json({ success: false, error: 'Either email or phone number is required' });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }
    
    // Build query conditions for checking existing users
    const orConditions: Array<Record<string, string>> = [
      { username: username.toLowerCase() },
    ];
    if (email) {
      orConditions.push({ email: email.toLowerCase() });
    }
    if (phone) {
      orConditions.push({ phone: phone });
    }
    
    // Check if username, email, or phone already exists
    const existingUser = await UserModel.findOne({ $or: orConditions });
    
    if (existingUser) {
      if (existingUser.username === username.toLowerCase()) {
        res.status(400).json({ success: false, error: 'Username already taken' });
      } else if (email && existingUser.email === email.toLowerCase()) {
        res.status(400).json({ success: false, error: 'Email already registered' });
      } else if (phone && existingUser.phone === phone) {
        res.status(400).json({ success: false, error: 'Phone number already registered' });
      }
      return;
    }
    
    // Generate OTPs for provided contact methods
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Create user object
    const userId = uuidv4();
    const userData: Record<string, unknown> = {
      _id: userId,
      username: username.toLowerCase(),
      password,
      tier: 'free',
      isEmailVerified: false,
      isPhoneVerified: false,
    };
    
    // Add email if provided
    if (email) {
      userData.email = email.toLowerCase();
      userData.emailOtp = otp;
      userData.emailOtpExpiry = otpExpiry;
    }
    
    // Add phone if provided
    if (phone) {
      userData.phone = phone;
      userData.phoneOtp = otp;
      userData.phoneOtpExpiry = otpExpiry;
    }
    
    const user = new UserModel(userData);
    await user.save();
    
    // Send OTP to provided contact method
    if (email) {
      await sendOtpEmail(email, otp);
    }
    if (phone) {
      await sendPhoneOtp(phone, otp);
    }
    
    // Generate token so user can login immediately
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        token,
        message: email ? 'Account created! Please verify your email.' : 'Account created! Please verify your phone number.',
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
 * Resend verification OTP (for email)
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
 * Send phone verification OTP
 */
export async function sendPhoneVerificationOtp(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    
    const { phone } = req.body;
    
    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }
    
    // Check if phone is already used by another user
    const existingPhone = await UserModel.findOne({ phone, _id: { $ne: user._id } });
    if (existingPhone) {
      res.status(400).json({ success: false, error: 'Phone number already registered to another account' });
      return;
    }
    
    // Generate OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.phone = phone;
    user.phoneOtp = otp;
    user.phoneOtpExpiry = otpExpiry;
    user.isPhoneVerified = false;
    await user.save();
    
    // Send OTP via SMS
    await sendPhoneOtp(phone, otp);
    
    res.json({
      success: true,
      data: { message: 'OTP sent to your phone number' },
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Verify phone with OTP
 */
export async function verifyPhoneOtp(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    
    const { otp } = req.body;
    
    if (!otp) {
      res.status(400).json({ success: false, error: 'OTP is required' });
      return;
    }
    
    if (!user.phone) {
      res.status(400).json({ success: false, error: 'No phone number set' });
      return;
    }
    
    if (user.isPhoneVerified) {
      res.status(400).json({ success: false, error: 'Phone already verified' });
      return;
    }
    
    if (!user.phoneOtp || !user.phoneOtpExpiry) {
      res.status(400).json({ success: false, error: 'No OTP found. Please request a new one.' });
      return;
    }
    
    if (new Date() > user.phoneOtpExpiry) {
      res.status(400).json({ success: false, error: 'OTP expired. Please request a new one.' });
      return;
    }
    
    if (user.phoneOtp !== otp) {
      res.status(400).json({ success: false, error: 'Invalid OTP' });
      return;
    }
    
    // Mark phone as verified
    user.isPhoneVerified = true;
    user.phoneOtp = undefined;
    user.phoneOtpExpiry = undefined;
    await user.save();
    
    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          phone: user.phone,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        message: 'Phone verified successfully!',
      },
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * Resend phone verification OTP
 */
export async function resendPhoneOtp(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    
    if (!user.phone) {
      res.status(400).json({ success: false, error: 'No phone number set' });
      return;
    }
    
    if (user.isPhoneVerified) {
      res.status(400).json({ success: false, error: 'Phone already verified' });
      return;
    }
    
    // Generate new OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.phoneOtp = otp;
    user.phoneOtpExpiry = otpExpiry;
    await user.save();
    
    // Send OTP via SMS
    await sendPhoneOtp(user.phone, otp);
    
    res.json({
      success: true,
      data: { message: 'OTP sent to your phone number' },
    });
  } catch (error) {
    console.error('Resend phone OTP error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

/**
 * User login with username/email/phone and password
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { usernameOrEmail, password } = req.body as LoginRequest;
    
    if (!usernameOrEmail || !password) {
      res.status(400).json({ success: false, error: 'Username/email/phone and password are required' });
      return;
    }
    
    // Find user by username, email, or phone
    const user = await UserModel.findOne({
      $or: [
        { username: usernameOrEmail.toLowerCase() },
        { email: usernameOrEmail.toLowerCase() },
        { phone: usernameOrEmail },
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
          phone: user.phone,
          tier: user.tier,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
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
        phone: user.phone,
        tier: user.tier,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
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

