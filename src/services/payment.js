// Local test payment flow for offline development and demo mode.
export async function processTestPayment(amount) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        provider: 'test-provider',
        transactionId: `test_payment_${Date.now()}`,
      });
    }, 800);
  });
}
