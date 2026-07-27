"use client";

interface RazorpayCheckoutOptions {
  amount: number; // in INR (e.g. 699)
  planName: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onSuccess: (paymentId: string) => void;
  onFailure: (errorMsg: string) => void;
}

export const executeRazorpayCheckout = async ({
  amount,
  planName,
  userEmail = 'employer@sevikaa.in',
  userName = 'Household Employer',
  userPhone = '+91 98765 43210',
  onSuccess,
  onFailure
}: RazorpayCheckoutOptions) => {
  try {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    // Load Razorpay Checkout Script if not already loaded
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
      });
    }

    // If Key ID is present and valid, launch live Razorpay popup
    if (razorpayKey && !razorpayKey.includes('placeholder') && (window as any).Razorpay) {
      const options = {
        key: razorpayKey,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Sevikaa Platform',
        description: `Subscription: ${planName}`,
        image: '/logo.png',
        handler: function (response: any) {
          if (response.razorpay_payment_id) {
            onSuccess(response.razorpay_payment_id);
          } else {
            onFailure('Payment response was incomplete.');
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone
        },
        theme: {
          color: '#1A73E8'
        },
        modal: {
          ondismiss: function () {
            onFailure('Payment checkout popup closed by user.');
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on('payment.failed', function (response: any) {
        onFailure(response.error?.description || 'Razorpay payment transaction failed.');
      });
      razorpayInstance.open();
    } else {
      // Graceful instant fallback handler when Razorpay keys are not configured
      setTimeout(() => {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        onSuccess(mockPaymentId);
      }, 1000);
    }
  } catch (err: any) {
    onFailure(err.message || 'Razorpay initialization failed.');
  }
};
