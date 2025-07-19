import { 
  validateCreateClient, 
  validateUpdateClient, 
  sanitizeClientData,
  isValidEmail,
  isValidPhone 
} from '../utils/validation';

describe('Client Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate correct phone formats', () => {
      expect(isValidPhone('+1234567890')).toBe(true);
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('+44 20 7946 0958')).toBe(true);
      expect(isValidPhone('(555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone formats', () => {
      expect(isValidPhone('abc123')).toBe(false);
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('validateCreateClient', () => {
    it('should validate valid client data', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Test Street',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require name field', () => {
      const result = validateCreateClient({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Client name is required',
      });
    });

    it('should validate minimum name length', () => {
      const result = validateCreateClient({
        name: 'A',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Client name must be at least 2 characters long',
      });
    });

    it('should validate maximum name length', () => {
      const result = validateCreateClient({
        name: 'A'.repeat(256),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Client name must be less than 255 characters',
      });
    });

    it('should validate email format', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        email: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should validate phone format', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        phone: 'abc123',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Invalid phone number format',
      });
    });

    it('should validate address length', () => {
      const result = validateCreateClient({
        name: 'Test Client',
        address: 'A'.repeat(1001),
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'address',
        message: 'Address must be less than 1000 characters',
      });
    });

    it('should allow optional fields to be empty', () => {
      const result = validateCreateClient({
        name: 'Test Client',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateUpdateClient', () => {
    it('should validate valid update data', () => {
      const result = validateUpdateClient({
        name: 'Updated Client',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require at least one field', () => {
      const result = validateUpdateClient({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'general',
        message: 'At least one field must be provided for update',
      });
    });

    it('should validate name if provided', () => {
      const result = validateUpdateClient({
        name: '',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: 'Client name cannot be empty',
      });
    });

    it('should validate email if provided', () => {
      const result = validateUpdateClient({
        email: 'invalid-email',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'email',
        message: 'Invalid email format',
      });
    });

    it('should allow empty email to clear field', () => {
      const result = validateUpdateClient({
        email: '',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('sanitizeClientData', () => {
    it('should sanitize string inputs', () => {
      const result = sanitizeClientData({
        name: '  Test Client  ',
        email: '  test@example.com  ',
        phone: '  +1234567890  ',
        address: '  123 Test Street  ',
      });

      expect(result.name).toBe('Test Client');
      expect(result.email).toBe('test@example.com');
      expect(result.phone).toBe('+1234567890');
      expect(result.address).toBe('123 Test Street');
    });

    it('should handle undefined values', () => {
      const result = sanitizeClientData({
        name: 'Test Client',
      });

      expect(result.name).toBe('Test Client');
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should handle null and empty strings', () => {
      const result = sanitizeClientData({
        name: 'Test Client',
        email: null as any,
        phone: '',
        address: '   ',
      });

      expect(result.name).toBe('Test Client');
      expect(result.email).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('should remove null bytes', () => {
      const result = sanitizeClientData({
        name: 'Test\0Client',
        email: 'test\0@example.com',
      });

      expect(result.name).toBe('TestClient');
      expect(result.email).toBe('test@example.com');
    });
  });
});