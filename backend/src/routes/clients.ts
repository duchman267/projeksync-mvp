import { Router, Request, Response } from 'express';
import { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ClientsQueryParams,
  ApiSuccessResponse,
  ApiErrorResponse 
} from '../types';
import { 
  validateCreateClient, 
  validateUpdateClient, 
  sanitizeClientData 
} from '../utils/validation';

const router = Router();

/**
 * GET /api/clients
 * Get all clients for the authenticated user with optional filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiErrorResponse);
    }

    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search
    } = req.query as ClientsQueryParams;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page.toString()) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit.toString()) || 10));
    const offset = (pageNum - 1) * limitNum;

    // Validate sort parameters
    const validSortFields = ['name', 'email', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    // Build query
    let query = req.supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order(sortField, { ascending: sortDirection === 'asc' })
      .range(offset, offset + limitNum - 1);

    // Add search filter if provided
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
    }

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Database error fetching clients:', error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch clients',
          details: error.message,
        },
      } as ApiErrorResponse);
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      success: true,
      data: {
        clients: clients || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1,
        },
      },
    } as ApiSuccessResponse);

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * POST /api/clients
 * Create a new client for the authenticated user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiErrorResponse);
    }

    // Validate request body
    const validation = validateCreateClient(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client data',
          details: validation.errors,
        },
      } as ApiErrorResponse);
    }

    // Sanitize and prepare client data
    const clientData = sanitizeClientData(req.body as CreateClientRequest);
    
    // Insert client into database
    const { data: client, error } = await req.supabase
      .from('clients')
      .insert({
        ...clientData,
        user_id: req.user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating client:', error);
      
      // Handle unique constraint violations
      if (error.code === '23505') {
        return res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_CLIENT',
            message: 'A client with this information already exists',
          },
        } as ApiErrorResponse);
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to create client',
          details: error.message,
        },
      } as ApiErrorResponse);
    }

    res.status(201).json({
      success: true,
      data: client,
      message: 'Client created successfully',
    } as ApiSuccessResponse);

  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * PUT /api/clients/:id
 * Update an existing client for the authenticated user
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiErrorResponse);
    }

    const clientId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid client ID format',
        },
      } as ApiErrorResponse);
    }

    // Validate request body
    const validation = validateUpdateClient(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid client data',
          details: validation.errors,
        },
      } as ApiErrorResponse);
    }

    // Check if client exists and belongs to user
    const { data: existingClient, error: fetchError } = await req.supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingClient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found or access denied',
        },
      } as ApiErrorResponse);
    }

    // Sanitize and prepare update data
    const updateData = sanitizeClientData(req.body as UpdateClientRequest);
    
    // Remove undefined values
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    // Add updated_at timestamp
    cleanUpdateData.updated_at = new Date().toISOString();

    // Update client in database
    const { data: updatedClient, error: updateError } = await req.supabase
      .from('clients')
      .update(cleanUpdateData)
      .eq('id', clientId)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error updating client:', updateError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to update client',
          details: updateError.message,
        },
      } as ApiErrorResponse);
    }

    res.json({
      success: true,
      data: updatedClient,
      message: 'Client updated successfully',
    } as ApiSuccessResponse);

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

/**
 * DELETE /api/clients/:id
 * Delete a client for the authenticated user
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      } as ApiErrorResponse);
    }

    const clientId = req.params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid client ID format',
        },
      } as ApiErrorResponse);
    }

    // Check if client exists and belongs to user
    const { data: existingClient, error: fetchError } = await req.supabase
      .from('clients')
      .select('id, name')
      .eq('id', clientId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !existingClient) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found or access denied',
        },
      } as ApiErrorResponse);
    }

    // Check for related projects before deletion
    const { data: relatedProjects, error: projectsError } = await req.supabase
      .from('projects')
      .select('id')
      .eq('client_id', clientId)
      .eq('user_id', req.user.id);

    if (projectsError) {
      console.error('Error checking related projects:', projectsError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to check client dependencies',
        },
      } as ApiErrorResponse);
    }

    // If client has related projects, prevent deletion
    if (relatedProjects && relatedProjects.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CLIENT_HAS_PROJECTS',
          message: 'Cannot delete client with associated projects. Please delete or reassign projects first.',
          details: {
            projectCount: relatedProjects.length,
          },
        },
      } as ApiErrorResponse);
    }

    // Delete client from database
    const { error: deleteError } = await req.supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', req.user.id);

    if (deleteError) {
      console.error('Database error deleting client:', deleteError);
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to delete client',
          details: deleteError.message,
        },
      } as ApiErrorResponse);
    }

    res.json({
      success: true,
      data: { id: clientId, name: existingClient.name },
      message: 'Client deleted successfully',
    } as ApiSuccessResponse);

  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    } as ApiErrorResponse);
  }
});

export default router;