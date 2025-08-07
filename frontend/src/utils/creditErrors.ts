export function getCreditErrorText(type: 'insufficient' | 'deduction_failed' | 'purchase_required') {
  const errorMap = {
    insufficient: {
      title: "Insufficient Credits",
      message: "You need at least 1 credit to generate AI content. Each generation uses 1 credit.",
      buttonText: "Purchase Credits"
    },
    deduction_failed: {
      title: "Credit Deduction Failed",
      message: "Failed to deduct credit for this generation. Please try again.", 
      buttonText: "Check Credit Balance"
    },
    purchase_required: {
      title: "Credits Required",
      message: "You don't have enough credits to generate more suggestions.",
      buttonText: "Purchase Credits"
    }
  };

  return errorMap[type];
}
