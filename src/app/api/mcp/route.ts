import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifyBearerToken } from '@/lib/agentTokens';
import { db } from '@/lib/db';
import { goals, user, type GoalPriority, type GoalStatus } from '@/db/schema';
import { and, asc, desc, eq, inArray, or } from 'drizzle-orm';
import { generateKeyBetween } from 'fractional-indexing';

interface JsonRpcRequest {
  jsonrpc: string;
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

function jsonRpcSuccess(id: string | number | null | undefined, result: unknown) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    result,
  };
}

function jsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  data?: unknown
) {
  return {
    jsonrpc: '2.0',
    id: id ?? null,
    error: {
      code,
      message,
      ...(data ? { data } : {}),
    },
  };
}

const TOOLS_MANIFEST = [
  {
    name: 'list_goals',
    description:
      "List goals for the authenticated user, optionally filtered by status ('active', 'completed', 'killed', or 'all').",
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'not-started', 'in-progress', 'completed', 'killed', 'all'],
          description: "Goal status to filter by (default: 'active')",
        },
      },
    },
  },
  {
    name: 'add_goal',
    description: 'Add a new goal to the list.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Goal title (1 to 200 characters)',
        },
        priority: {
          type: 'string',
          enum: ['none', 'low', 'medium', 'high'],
          description: "Optional priority level (default: 'none')",
        },
        description: {
          type: 'string',
          description: 'Optional goal description',
        },
        link: {
          type: 'string',
          description: 'Optional link URL',
        },
        status: {
          type: 'string',
          enum: ['not-started', 'in-progress', 'completed', 'killed', 'active'],
          description: "Initial status (default: 'not-started')",
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_goal',
    description: "Update an existing goal's title or priority.",
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'UUID of the goal to update',
        },
        title: {
          type: 'string',
          description: 'Updated title (1 to 200 characters)',
        },
        priority: {
          type: 'string',
          enum: ['none', 'low', 'medium', 'high'],
          description: 'Updated priority',
        },
        description: {
          type: 'string',
          description: 'Updated goal description (pass empty string to clear)',
        },
        link: {
          type: 'string',
          description: 'Updated link URL (pass empty string to clear)',
        },
        status: {
          type: 'string',
          enum: ['not-started', 'in-progress', 'completed', 'killed', 'active'],
          description: "Updated status ('not-started', 'in-progress', 'completed', 'killed')",
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'complete_goal',
    description:
      'Mark an active goal as completed. Moves the goal to the archive.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'UUID of the goal to complete',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'kill_goal',
    description:
      'Mark an active goal as killed/abandoned. Moves the goal to the archive.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'UUID of the goal to kill',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'restore_goal',
    description:
      'Restore an archived (completed or killed) goal back to active.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'UUID of the goal to restore',
        },
      },
      required: ['id'],
    },
  },
];

async function handleToolCall(
  userId: string,
  userEmail: string | null,
  toolName: string,
  args: Record<string, unknown> = {}
) {
  const userScope = userEmail
    ? or(eq(goals.userId, userId), eq(goals.userEmail, userEmail))
    : eq(goals.userId, userId);

  switch (toolName) {
    case 'list_goals': {
      const requestedStatus = (args.status as string) || 'active';
      const validStatuses = ['active', 'not-started', 'in-progress', 'completed', 'killed', 'all'];
      const statusFilter = validStatuses.includes(requestedStatus)
        ? requestedStatus
        : 'active';

      const query = db.select().from(goals).where(userScope);
      let rows;

      if (statusFilter === 'all') {
        rows = await query.orderBy(asc(goals.position));
      } else if (statusFilter === 'active') {
        rows = await db
          .select()
          .from(goals)
          .where(
            and(
              userScope,
              inArray(goals.status, ['not-started', 'in-progress', 'active'])
            )
          )
          .orderBy(asc(goals.position));
      } else {
        rows = await db
          .select()
          .from(goals)
          .where(
            and(
              userScope,
              eq(goals.status, statusFilter as GoalStatus)
            )
          )
          .orderBy(
            ['completed', 'killed'].includes(statusFilter)
              ? desc(goals.archivedAt)
              : asc(goals.position)
          );
      }

      return {
        goals: rows.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          priority: g.priority,
          description: g.description,
          link: g.link,
          position: g.position,
          createdAt: g.createdAt,
          updatedAt: g.updatedAt,
          archivedAt: g.archivedAt,
        })),
        count: rows.length,
        filter: statusFilter,
      };
    }

    case 'add_goal': {
      const rawTitle = typeof args.title === 'string' ? args.title.trim() : '';
      if (!rawTitle || rawTitle.length > 200) {
        throw new Error('Title must be between 1 and 200 characters');
      }

      const rawPriority = (args.priority as GoalPriority) || 'none';
      const validPriorities: GoalPriority[] = ['none', 'low', 'medium', 'high'];
      const priority = validPriorities.includes(rawPriority) ? rawPriority : 'none';

      const rawStatus = (args.status as GoalStatus) || 'not-started';
      const validStatuses: GoalStatus[] = ['not-started', 'in-progress', 'completed', 'killed', 'active'];
      const status = validStatuses.includes(rawStatus) ? rawStatus : 'not-started';

      const description = typeof args.description === 'string' ? args.description.trim() || null : null;
      const link = typeof args.link === 'string' ? args.link.trim() || null : null;

      // Find the last active goal for the user to append at the bottom
      const [lastActive] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(userScope, inArray(goals.status, ['not-started', 'in-progress', 'active'])))
        .orderBy(desc(goals.position))
        .limit(1);

      const newPosition = generateKeyBetween(lastActive?.position ?? null, null);
      const now = new Date().toISOString();
      const goalId = crypto.randomUUID();

      await db.insert(goals).values({
        id: goalId,
        userId,
        userEmail: userEmail ?? null,
        title: rawTitle,
        status,
        priority,
        description,
        link,
        position: newPosition,
        createdAt: now,
        updatedAt: now,
        archivedAt: ['completed', 'killed'].includes(status) ? now : null,
      });

      return {
        success: true,
        goal: {
          id: goalId,
          title: rawTitle,
          status,
          priority,
          description,
          link,
          position: newPosition,
          createdAt: now,
          updatedAt: now,
        },
      };
    }

    case 'update_goal': {
      const id = typeof args.id === 'string' ? args.id.trim() : '';
      if (!id) throw new Error('Goal ID is required');

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), userScope))
        .limit(1);

      if (!existing) {
        throw new Error(`Goal with ID "${id}" not found`);
      }

      const updates: Partial<typeof goals.$inferInsert> = {
        updatedAt: new Date().toISOString(),
      };

      if (typeof args.title === 'string') {
        const title = args.title.trim();
        if (title.length < 1 || title.length > 200) {
          throw new Error('Title must be between 1 and 200 characters');
        }
        updates.title = title;
      }

      if (typeof args.priority === 'string') {
        const p = args.priority as GoalPriority;
        if (['none', 'low', 'medium', 'high'].includes(p)) {
          updates.priority = p;
        }
      }

      if (args.description !== undefined) {
        updates.description = typeof args.description === 'string' ? args.description.trim() || null : null;
      }

      if (args.link !== undefined) {
        updates.link = typeof args.link === 'string' ? args.link.trim() || null : null;
      }

      if (typeof args.status === 'string') {
        const s = args.status as GoalStatus;
        if (['not-started', 'in-progress', 'completed', 'killed', 'active'].includes(s)) {
          updates.status = s;
          if (['completed', 'killed'].includes(s)) {
            updates.archivedAt = new Date().toISOString();
          } else {
            updates.archivedAt = null;
          }
        }
      }

      await db
        .update(goals)
        .set(updates)
        .where(and(eq(goals.id, id), userScope));

      return {
        success: true,
        goal: {
          ...existing,
          ...updates,
        },
      };
    }

    case 'complete_goal': {
      const id = typeof args.id === 'string' ? args.id.trim() : '';
      if (!id) throw new Error('Goal ID is required');

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), userScope))
        .limit(1);

      if (!existing) {
        throw new Error(`Goal with ID "${id}" not found`);
      }

      const now = new Date().toISOString();
      await db
        .update(goals)
        .set({
          status: 'completed',
          archivedAt: now,
          updatedAt: now,
        })
        .where(and(eq(goals.id, id), userScope));

      return {
        success: true,
        id,
        status: 'completed',
        archivedAt: now,
      };
    }

    case 'kill_goal': {
      const id = typeof args.id === 'string' ? args.id.trim() : '';
      if (!id) throw new Error('Goal ID is required');

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), userScope))
        .limit(1);

      if (!existing) {
        throw new Error(`Goal with ID "${id}" not found`);
      }

      const now = new Date().toISOString();
      await db
        .update(goals)
        .set({
          status: 'killed',
          archivedAt: now,
          updatedAt: now,
        })
        .where(and(eq(goals.id, id), userScope));

      return {
        success: true,
        id,
        status: 'killed',
        archivedAt: now,
      };
    }

    case 'restore_goal': {
      const id = typeof args.id === 'string' ? args.id.trim() : '';
      if (!id) throw new Error('Goal ID is required');

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), userScope))
        .limit(1);

      if (!existing) {
        throw new Error(`Goal with ID "${id}" not found`);
      }

      // Restore to bottom of active list
      const [lastActive] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(userScope, eq(goals.status, 'active')))
        .orderBy(desc(goals.position))
        .limit(1);

      const newPosition = generateKeyBetween(lastActive?.position ?? null, null);
      const now = new Date().toISOString();

      await db
        .update(goals)
        .set({
          status: 'active',
          position: newPosition,
          archivedAt: null,
          updatedAt: now,
        })
        .where(and(eq(goals.id, id), userScope));

      return {
        success: true,
        id,
        status: 'active',
        position: newPosition,
      };
    }

    default:
      throw new Error(`Unknown tool: "${toolName}"`);
  }
}

async function processRpcMessage(
  userId: string,
  userEmail: string | null,
  req: JsonRpcRequest
): Promise<unknown> {
  const { id, method, params } = req;

  switch (method) {
    case 'initialize':
      return jsonRpcSuccess(id, {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'quiet-goals-mcp',
          version: '1.0.0',
        },
      });

    case 'notifications/initialized':
      return jsonRpcSuccess(id, {});

    case 'ping':
      return jsonRpcSuccess(id, {});

    case 'tools/list':
      return jsonRpcSuccess(id, {
        tools: TOOLS_MANIFEST,
      });

    case 'tools/call': {
      if (!params || typeof params !== 'object') {
        return jsonRpcError(id, -32602, 'Invalid params: expected object');
      }

      const name = params.name as string;
      const args = (params.arguments as Record<string, unknown>) || {};

      if (!name) {
        return jsonRpcError(id, -32602, 'Missing tool name in params');
      }

      try {
        const result = await handleToolCall(userId, userEmail, name, args);
        return jsonRpcSuccess(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonRpcSuccess(id, {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error: ${message}`,
            },
          ],
        });
      }
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// GET handler: Streamable HTTP SSE connection or info
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const auth = await verifyBearerToken(authHeader);

  if (!auth.valid || !auth.userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: auth.error || 'Invalid bearer token' },
      { status: 401 }
    );
  }

  const rateLimit = checkRateLimit(auth.userId, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Rate limit exceeded (60 req/min)' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
        },
      }
    );
  }

  const acceptHeader = request.headers.get('accept') || '';
  if (acceptHeader.includes('text/event-stream')) {
    // Return SSE stream for Streamable HTTP MCP clients
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const initPayload = JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/message',
          params: { status: 'ready', server: 'quiet-goals-mcp' },
        });
        controller.enqueue(encoder.encode(`event: message\ndata: ${initPayload}\n\n`));
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  return NextResponse.json({
    status: 'ok',
    name: 'quiet-goals-mcp',
    version: '1.0.0',
    protocolVersion: '2024-11-05',
    tools: TOOLS_MANIFEST.map((t) => t.name),
  });
}

// POST handler: JSON-RPC 2.0 (Direct or Streamable HTTP)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const auth = await verifyBearerToken(authHeader);

  if (!auth.valid || !auth.userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: auth.error || 'Invalid bearer token' },
      { status: 401 }
    );
  }

  const rateLimit = checkRateLimit(auth.userId, 60, 60000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      jsonRpcError(
        null,
        -32000,
        'Rate limit exceeded. Maximum 60 requests per minute.'
      ),
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      jsonRpcError(null, -32700, 'Parse error: invalid JSON'),
      { status: 400 }
    );
  }

  // Look up user email for dual-scope data isolation
  const [userRecord] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, auth.userId))
    .limit(1);
  const userEmail = userRecord?.email ?? null;

  const acceptHeader = request.headers.get('accept') || '';
  const isStreamRequest = acceptHeader.includes('text/event-stream');

  // Handle single request or batch requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) => processRpcMessage(auth.userId!, userEmail, item as JsonRpcRequest))
    );
    return NextResponse.json(responses);
  }

  const response = await processRpcMessage(auth.userId, userEmail, body as JsonRpcRequest);

  if (isStreamRequest) {
    const encoder = new TextEncoder();
    const eventPayload = `event: message\ndata: ${JSON.stringify(response)}\n\n`;
    return new Response(encoder.encode(eventPayload), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  }

  return NextResponse.json(response);
}
