import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, verifyBearerToken } from '@/lib/agentTokens';
import { db } from '@/lib/db';
import { goals, type GoalPriority, type GoalStatus } from '@/db/schema';
import { and, asc, desc, eq } from 'drizzle-orm';
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
          enum: ['active', 'completed', 'killed', 'all'],
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
  toolName: string,
  args: Record<string, unknown> = {}
) {
  switch (toolName) {
    case 'list_goals': {
      const requestedStatus = (args.status as string) || 'active';
      const validStatuses = ['active', 'completed', 'killed', 'all'];
      const statusFilter = validStatuses.includes(requestedStatus)
        ? requestedStatus
        : 'active';

      const query = db.select().from(goals).where(eq(goals.userId, userId));
      let rows;

      if (statusFilter === 'all') {
        rows = await query.orderBy(asc(goals.position));
      } else {
        rows = await db
          .select()
          .from(goals)
          .where(
            and(
              eq(goals.userId, userId),
              eq(goals.status, statusFilter as GoalStatus)
            )
          )
          .orderBy(
            statusFilter === 'active' ? asc(goals.position) : desc(goals.archivedAt)
          );
      }

      return {
        goals: rows.map((g) => ({
          id: g.id,
          title: g.title,
          status: g.status,
          priority: g.priority,
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

      // Find the last active goal for the user to append at the bottom
      const [lastActive] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.status, 'active')))
        .orderBy(desc(goals.position))
        .limit(1);

      const newPosition = generateKeyBetween(lastActive?.position ?? null, null);
      const now = new Date().toISOString();
      const goalId = crypto.randomUUID();

      await db.insert(goals).values({
        id: goalId,
        userId,
        title: rawTitle,
        status: 'active',
        priority,
        position: newPosition,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      });

      return {
        success: true,
        goal: {
          id: goalId,
          title: rawTitle,
          status: 'active',
          priority,
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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
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

      await db
        .update(goals)
        .set(updates)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)))
        .limit(1);

      if (!existing) {
        throw new Error(`Goal with ID "${id}" not found`);
      }

      // Restore to bottom of active list
      const [lastActive] = await db
        .select({ position: goals.position })
        .from(goals)
        .where(and(eq(goals.userId, userId), eq(goals.status, 'active')))
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
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

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
        const result = await handleToolCall(userId, name, args);
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

  const acceptHeader = request.headers.get('accept') || '';
  const isStreamRequest = acceptHeader.includes('text/event-stream');

  // Handle single request or batch requests
  if (Array.isArray(body)) {
    const responses = await Promise.all(
      body.map((item) => processRpcMessage(auth.userId!, item as JsonRpcRequest))
    );
    return NextResponse.json(responses);
  }

  const response = await processRpcMessage(auth.userId, body as JsonRpcRequest);

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
