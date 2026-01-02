/**
 * Authentication Routes - OAuth callbacks for broker connections
 * Handles Zerodha and Upstox OAuth flows
 */

import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { databaseService } from '../services/databaseService';
import { loggerService } from '../services/loggerService';

const router = express.Router();

/**
 * Zerodha OAuth Callback
 *
 * Flow:
 * 1. User initiates login from frontend
 * 2. User is redirected to Zerodha login page
 * 3. After authentication, Zerodha redirects back here with request_token
 * 4. We generate access_token using request_token
 * 5. Store tokens in database
 * 6. Redirect back to frontend
 */
router.get('/zerodha/callback', async (req, res) => {
  try {
    const { request_token, status } = req.query;

    if (status === 'error' || !request_token) {
      loggerService.error('Zerodha OAuth failed', { status, request_token });
      return res.redirect('http://localhost:5173/settings?error=zerodha_auth_failed');
    }

    // Get the broker account from database (should have API key/secret)
    // For now, we'll look for the most recent Zerodha account
    const accounts = databaseService.getBrokerAccounts();
    const zerodhaBrokerAccount = accounts.find(
      (acc: any) => acc.broker === 'zerodha'
    );

    if (!zerodhaBrokerAccount) {
      loggerService.error('No Zerodha account found in database');
      return res.redirect('http://localhost:5173/settings?error=no_zerodha_account');
    }

    const credentials = typeof zerodhaBrokerAccount.credentials === 'string'
      ? JSON.parse(zerodhaBrokerAccount.credentials)
      : zerodhaBrokerAccount.credentials;

    const { apiKey, apiSecret } = credentials;

    // Generate checksum for access token request
    const checksum = crypto
      .createHash('sha256')
      .update(apiKey + request_token + apiSecret)
      .digest('hex');

    // Request access token from Zerodha
    const tokenResponse = await axios.post(
      'https://api.kite.trade/session/token',
      new URLSearchParams({
        api_key: apiKey,
        request_token: request_token as string,
        checksum: checksum,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Kite-Version': '3',
        },
      }
    );

    const { access_token } = tokenResponse.data.data;

    // Update broker account with access token
    const updatedCredentials = {
      ...credentials,
      accessToken: access_token,
      requestToken: request_token as string,
    };

    databaseService.updateBrokerCredentials(zerodhaBrokerAccount.id as number, updatedCredentials);

    // Update broker account status to connected
    databaseService.updateBrokerAccount(zerodhaBrokerAccount.id as number, {
      status: 'connected',
    });

    loggerService.success('Zerodha authentication successful', {
      accountId: zerodhaBrokerAccount.id,
    });

    // Redirect back to settings page with success message
    res.redirect('http://localhost:5173/settings?success=zerodha_connected');
  } catch (error: any) {
    loggerService.error('Zerodha OAuth callback error', { error: error.message });
    console.error('Zerodha OAuth error:', error.response?.data || error.message);
    res.redirect('http://localhost:5173/settings?error=zerodha_token_failed');
  }
});

/**
 * Upstox OAuth Callback
 *
 * Flow:
 * 1. User initiates login from frontend
 * 2. User is redirected to Upstox login page
 * 3. After authentication, Upstox redirects back here with authorization code
 * 4. We exchange code for access_token
 * 5. Store tokens in database
 * 6. Redirect back to frontend
 */
router.get('/upstox/callback', async (req, res) => {
  try {
    const { code, error } = req.query;

    if (error || !code) {
      loggerService.error('Upstox OAuth failed', { error, code });
      return res.redirect('http://localhost:5173/settings?error=upstox_auth_failed');
    }

    // Get the broker account from database
    const accounts = databaseService.getBrokerAccounts();
    const upstoxAccount = accounts.find(
      (acc: any) => acc.broker === 'upstox'
    );

    if (!upstoxAccount) {
      loggerService.error('No Upstox account found in database');
      return res.redirect('http://localhost:5173/settings?error=no_upstox_account');
    }

    const credentials = typeof upstoxAccount.credentials === 'string'
      ? JSON.parse(upstoxAccount.credentials)
      : upstoxAccount.credentials;

    const { apiKey, apiSecret } = credentials;
    const redirectUri = 'http://localhost:3001/api/auth/upstox/callback';

    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://api.upstox.com/v2/login/authorization/token',
      new URLSearchParams({
        code: code as string,
        client_id: apiKey,
        client_secret: apiSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
      }
    );

    const { access_token } = tokenResponse.data;

    // Update broker account with access token
    const updatedCredentials = {
      ...credentials,
      accessToken: access_token,
      code: code as string,
    };

    databaseService.updateBrokerCredentials(upstoxAccount.id as number, updatedCredentials);

    // Update broker account status to connected
    databaseService.updateBrokerAccount(upstoxAccount.id as number, {
      status: 'connected',
    });

    loggerService.success('Upstox authentication successful', {
      accountId: upstoxAccount.id,
    });

    // Redirect back to settings page with success message
    res.redirect('http://localhost:5173/settings?success=upstox_connected');
  } catch (error: any) {
    loggerService.error('Upstox OAuth callback error', { error: error.message });
    console.error('Upstox OAuth error:', error.response?.data || error.message);
    res.redirect('http://localhost:5173/settings?error=upstox_token_failed');
  }
});

/**
 * Initiate Zerodha OAuth Flow
 * Returns the authorization URL for the user to visit
 */
router.get('/zerodha/login', async (req, res) => {
  try {
    const accounts = databaseService.getBrokerAccounts();
    const zerodhaBrokerAccount = accounts.find(
      (acc: any) => acc.broker === 'zerodha'
    );

    if (!zerodhaBrokerAccount) {
      return res.status(404).json({
        success: false,
        error: 'No Zerodha account found. Please add one in settings first.',
      });
    }

    const credentials = typeof zerodhaBrokerAccount.credentials === 'string'
      ? JSON.parse(zerodhaBrokerAccount.credentials)
      : zerodhaBrokerAccount.credentials;

    const { apiKey } = credentials;
    const redirectUri = 'http://localhost:3001/api/auth/zerodha/callback';

    // Zerodha authorization URL
    const authUrl = `https://kite.zerodha.com/connect/login?api_key=${apiKey}&redirect_params=${encodeURIComponent(redirectUri)}`;

    res.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    loggerService.error('Error initiating Zerodha login', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Zerodha login',
    });
  }
});

/**
 * Initiate Upstox OAuth Flow
 * Returns the authorization URL for the user to visit
 */
router.get('/upstox/login', async (req, res) => {
  try {
    const accounts = databaseService.getBrokerAccounts();
    const upstoxAccount = accounts.find(
      (acc: any) => acc.broker === 'upstox'
    );

    if (!upstoxAccount) {
      return res.status(404).json({
        success: false,
        error: 'No Upstox account found. Please add one in settings first.',
      });
    }

    const credentials = typeof upstoxAccount.credentials === 'string'
      ? JSON.parse(upstoxAccount.credentials)
      : upstoxAccount.credentials;

    const { apiKey } = credentials;
    const redirectUri = 'http://localhost:3001/api/auth/upstox/callback';

    // Upstox authorization URL
    const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?client_id=${apiKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    res.json({
      success: true,
      authUrl,
    });
  } catch (error: any) {
    loggerService.error('Error initiating Upstox login', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to initiate Upstox login',
    });
  }
});

export default router;
