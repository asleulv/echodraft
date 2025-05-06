import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    // Make a direct request to the Django backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Log the URL we're trying to access for debugging
    console.log(`Attempting to verify email with token: ${token}`);
    console.log(`Backend URL: ${backendUrl}/api/v1/verify-email/${token}/`);
    
    // Make the request with detailed error handling
    try {
      const response = await axios.get(`${backendUrl}/api/v1/verify-email/${token}/`, {
        // Don't follow redirects automatically
        maxRedirects: 0,
        // Add headers that might be needed
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Increase timeout
        timeout: 10000,
      });
      
      console.log('Verification successful, response:', response.status);
      
      // Return success
      return res.status(200).json({ success: true });
    } catch (axiosError: any) {
      // If we got a redirect response (which is what we expect from the Django view)
      if (axiosError.response && axiosError.response.status >= 300 && axiosError.response.status < 400) {
        const redirectUrl = axiosError.response.headers.location;
        console.log('Received redirect to:', redirectUrl);
        
        // Check if it's a redirect to login with verified=true
        if (redirectUrl && redirectUrl.includes('login?verified=true')) {
          console.log('Verification successful, redirecting to login with success');
          return res.status(200).json({ success: true });
        } 
        // Check if it's a redirect to login with verified=false
        else if (redirectUrl && redirectUrl.includes('login?verified=false')) {
          console.log('Verification failed, redirecting to login with error');
          return res.status(400).json({ 
            error: 'Verification failed', 
            message: 'The verification link is invalid or has expired.' 
          });
        }
        // Any other redirect
        else if (redirectUrl) {
          console.log('Received unexpected redirect:', redirectUrl);
          return res.status(200).json({ success: true, redirectUrl });
        }
      }
      
      // For any other error
      console.error('Error details:', axiosError.message);
      if (axiosError.response) {
        console.error('Response status:', axiosError.response.status);
        console.error('Response data:', axiosError.response.data);
      }
      
      throw axiosError; // Re-throw to be caught by the outer try/catch
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    
    // Return error response
    return res.status(400).json({ 
      error: 'Verification failed', 
      message: 'The verification link is invalid or has expired.' 
    });
  }
}
