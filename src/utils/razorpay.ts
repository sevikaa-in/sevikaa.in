"use client";

interface RazorpayCheckoutOptions {
  orderId?: string; // Server-issued Razorpay order_id from /api/payments/create-order
  amount: number;   // in INR (e.g. 699)
  planName: string;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  paymentMethod?: 'upi' | 'card' | 'netbanking';
  onSuccess: (paymentId: string, orderId?: string) => void;
  onFailure: (errorMsg: string) => void;
}

export const executeRazorpayCheckout = async ({
  orderId,
  amount,
  planName,
  userEmail = '',
  userName = '',
  userPhone = '',
  paymentMethod,
  onSuccess,
  onFailure
}: RazorpayCheckoutOptions) => {
  try {
    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      console.error('[RazorpayCheckout] NEXT_PUBLIC_RAZORPAY_KEY_ID is missing. Cannot initiate checkout.');
      onFailure('Payment gateway client key is not configured.');
      return;
    }

    // 1. Ensure Razorpay Checkout SDK script is loaded
    if (typeof window !== 'undefined' && !(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK script.'));
        document.body.appendChild(script);
      });
    }

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      console.log(`[Razorpay SDK] Opening Razorpay checkout window (OrderID: ${orderId || 'none'})`);

      const options: any = {
        key: razorpayKey.trim(),
        ...(orderId ? { order_id: orderId } : {}), // Pass server-created order_id
        amount: Math.round(amount * 100), // Amount in paise
        currency: 'INR',
        name: 'Sevikaa Household Network',
        description: `Subscription: ${planName}`,
        image: '/logo.png',
        handler: function (response: any) {
          console.log('[Razorpay SDK] Payment Captured:', response);
          if (response.razorpay_payment_id) {
            onSuccess(response.razorpay_payment_id, response.razorpay_order_id || orderId);
          } else {
            onFailure('Payment completed but response was missing payment ID.');
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
          contact: userPhone,
          ...(paymentMethod ? { method: paymentMethod } : {})
        },
        theme: {
          color: '#1A73E8', // Sevikaa Primary Royal Blue
          backdrop_color: 'rgba(15, 23, 42, 0.7)'
        },
        modal: {
          ondismiss: function () {
            console.log('[Razorpay SDK] User closed checkout modal.');
            onFailure('Payment checkout closed by user.');
          }
        }
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      
      razorpayInstance.on('payment.failed', function (response: any) {
        console.error('[Razorpay SDK] Payment Failed:', response.error);
        onFailure(response.error?.description || 'Razorpay payment transaction failed.');
      });

      razorpayInstance.open();
    } else {
      onFailure('Razorpay Checkout SDK is not available in browser.');
    }
  } catch (err: any) {
    console.error('[Razorpay SDK Error]:', err);
    onFailure(err.message || 'Razorpay initialization failed.');
  }
};
