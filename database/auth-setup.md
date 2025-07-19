# Supabase Authentication Setup Guide

This guide covers the authentication configuration for ProjekSync MVP.

## Authentication Settings

### 1. Basic Auth Configuration

In your Supabase dashboard, go to **Authentication** → **Settings**:

#### Site URL
- **Development**: `http://localhost:3000`
- **Production**: Your actual domain (e.g., `https://yourapp.com`)

#### Redirect URLs
Add these URLs to allow authentication redirects:
- **Development**: `http://localhost:3000/auth/callback`
- **Production**: `https://yourapp.com/auth/callback`

#### Additional Redirect URLs (Optional)
If you need additional redirect patterns:
- `http://localhost:3000/**` (for development)
- `https://yourapp.com/**` (for production)

### 2. Email Settings

#### Email Confirmation
- **Enabled**: Recommended for production
- **Disabled**: OK for development

#### Email Templates
You can customize the email templates for:
- Confirmation emails
- Password reset emails
- Magic link emails

### 3. Security Settings

#### JWT Expiry
- **Access Token**: 1 hour (default)
- **Refresh Token**: 24 hours (default)

#### Password Requirements
- **Minimum Length**: 6 characters (default)
- **Require Special Characters**: Optional

### 4. Social Authentication Providers (Optional)

#### Google OAuth
1. Go to **Authentication** → **Providers**
2. Enable Google
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Configure authorized domains

#### GitHub OAuth
1. Enable GitHub provider
2. Add GitHub OAuth app credentials
3. Configure callback URL

#### Other Providers
Supabase supports many providers:
- Apple
- Azure
- Discord
- Facebook
- LinkedIn
- Twitter
- And more...

## Authentication Flow

### 1. User Registration
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2. User Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### 3. User Logout
```typescript
const { error } = await supabase.auth.signOut();
```

### 4. Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### 5. Listen to Auth Changes
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

## Row Level Security Integration

### User Context
RLS policies use `auth.uid()` to identify the current user:

```sql
CREATE POLICY "Users can only see their own data" ON clients
  FOR ALL USING (auth.uid() = user_id);
```

### Automatic User ID
When authenticated, Supabase automatically provides the user ID in queries.

## Testing Authentication

### 1. Test User Registration
```bash
# In your frontend
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 2. Test User Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### 3. Verify in Supabase Dashboard
1. Go to **Authentication** → **Users**
2. You should see your test users listed
3. Check user metadata and last sign-in times

## Common Issues

### Email Confirmation Issues
- Check spam folder
- Verify SMTP settings
- Test with different email providers

### Redirect Issues
- Ensure redirect URLs are exactly correct
- Check for trailing slashes
- Verify protocol (http vs https)

### RLS Policy Issues
- Make sure policies are applied
- Test with authenticated and unauthenticated requests
- Check policy conditions

### Session Issues
- Verify JWT settings
- Check token expiry times
- Test session persistence

## Security Best Practices

### Password Security
- Enforce strong password requirements
- Consider implementing password strength indicators
- Use secure password reset flows

### Session Management
- Implement proper session timeout
- Handle token refresh automatically
- Clear sessions on logout

### Data Protection
- Never expose service role keys in frontend
- Use RLS policies for all sensitive data
- Validate user permissions on backend

### Rate Limiting
- Implement rate limiting for auth endpoints
- Protect against brute force attacks
- Monitor failed login attempts

## Production Considerations

### Email Provider
- Configure a proper email provider (not the default)
- Set up SPF, DKIM, and DMARC records
- Monitor email deliverability

### Domain Configuration
- Use HTTPS in production
- Configure proper CORS settings
- Set up proper redirect URLs

### Monitoring
- Monitor authentication metrics
- Set up alerts for unusual activity
- Track user registration and login patterns

### Backup and Recovery
- Backup user data regularly
- Have a plan for account recovery
- Document emergency procedures

---

This authentication setup ensures secure user management for your ProjekSync application.