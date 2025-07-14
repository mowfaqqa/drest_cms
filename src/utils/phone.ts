export const formatSenegalPhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle Senegal phone numbers
  if (digits.startsWith('221')) {
    // Already has country code
    return `+${digits}`;
  } else if (digits.startsWith('77') || digits.startsWith('78') || digits.startsWith('70') || digits.startsWith('76')) {
    // Mobile numbers
    return `+221${digits}`;
  } else if (digits.startsWith('33')) {
    // Landline numbers
    return `+221${digits}`;
  }
  
  return phone; // Return original if format not recognized
};

export const isValidSenegalPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  
  // With country code: +22177xxxxxxx, +22178xxxxxxx, etc.
  if (cleaned.startsWith('221')) {
    const localNumber = cleaned.slice(3);
    return (localNumber.startsWith('77') || 
            localNumber.startsWith('78') || 
            localNumber.startsWith('70') || 
            localNumber.startsWith('76') || 
            localNumber.startsWith('33')) && 
           localNumber.length === 9;
  }
  
  // Without country code: 77xxxxxxx, 78xxxxxxx, etc.
  return (cleaned.startsWith('77') || 
          cleaned.startsWith('78') || 
          cleaned.startsWith('70') || 
          cleaned.startsWith('76') || 
          cleaned.startsWith('33')) && 
         cleaned.length === 9;
};
