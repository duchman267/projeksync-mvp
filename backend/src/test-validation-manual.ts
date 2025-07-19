#!/usr/bin/env tsx

import { 
  validateCreateClient, 
  validateUpdateClient, 
  sanitizeClientData,
  isValidEmail,
  isValidPhone
} from './utils/validation';

function testValidationUtils() {
  console.log('🧪 Testing Validation Utils...\n');

  // Test email validation
  console.log('1. Testing email validation');
  console.log('✅ Valid email:', isValidEmail('test@example.com')); // should be true
  console.log('❌ Invalid email:', isValidEmail('invalid-email')); // should be false
  console.log('');

  // Test phone validation
  console.log('2. Testing phone validation');
  console.log('✅ Valid phone:', isValidPhone('+1234567890')); // should be true
  console.log('✅ Valid phone:', isValidPhone('1234567890')); // should be true
  console.log('❌ Invalid phone:', isValidPhone('abc123')); // should be false
  console.log('');

  // Test validateCreateClient
  console.log('3. Testing validateCreateClient');
  
  const validClientData = {
    name: 'Test Client',
    email: 'test@example.com',
    phone: '+1234567890',
    address: '123 Test Street',
  };
  
  const validResult = validateCreateClient(validClientData);
  console.log('✅ Valid client data:', validResult);
  
  const invalidResult = validateCreateClient({});
  console.log('❌ Invalid client data:', invalidResult);
  console.log('');

  // Test validateUpdateClient
  console.log('4. Testing validateUpdateClient');
  
  const validUpdateResult = validateUpdateClient({ name: 'Updated Name' });
  console.log('✅ Valid update data:', validUpdateResult);
  
  const invalidUpdateResult = validateUpdateClient({});
  console.log('❌ Invalid update data:', invalidUpdateResult);
  console.log('');

  // Test sanitizeClientData
  console.log('5. Testing sanitizeClientData');
  
  const dirtyData = {
    name: '  Test Client  ',
    email: '  test@example.com  ',
    phone: '  +1234567890  ',
    address: '  123 Test Street  ',
  };
  
  const sanitizedData = sanitizeClientData(dirtyData);
  console.log('✅ Sanitized data:', sanitizedData);
  console.log('');

  console.log('🎉 All validation tests completed!');
}

testValidationUtils();