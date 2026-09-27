import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

async function getSessionContext() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const client = await clerkClient();
  const memberships = await client.users.getOrganizationMembershipList({
    userId,
    limit: MAX_LIMIT,
  });

  return { client, userId, memberships };
}

export async function GET(request: NextRequest) {
  const context = await getSessionContext();

  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { client, memberships } = context;

  if (!memberships.data.some((membership) => membership.role === 'org:admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationIds = [
    ...new Set(
      memberships.data.map((membership) => membership.organization.id)
    ),
  ];

  const adminUserIds = new Set<string>();

  for (const organizationId of organizationIds) {
    let memberOffset = 0;

    while (adminUserIds.size < MAX_LIMIT) {
      const page = await client.organizations.getOrganizationMembershipList({
        organizationId,
        role: ['org:admin'],
        limit: MAX_LIMIT,
        offset: memberOffset,
      });

      for (const membership of page.data) {
        const memberUserId = membership.publicUserData?.userId;
        if (memberUserId) {
          adminUserIds.add(memberUserId);
        }
      }

      memberOffset += page.data.length;
      if (page.data.length === 0 || memberOffset >= page.totalCount) break;
    }
  }

  const { searchParams } = request.nextUrl;
  const limit = Math.min(
    Math.max(Number(searchParams.get('limit')) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

  try {
    const { data, totalCount } = await client.users.getUserList({
      limit,
      offset,
      orderBy: '-created_at',
    });

    const users = data.map((user) => ({
      id: user.id,
      email:
        user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
          ?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl: user.imageUrl,
      createdAt: new Date(user.createdAt).toISOString(),
      lastSignInAt: user.lastSignInAt
        ? new Date(user.lastSignInAt).toISOString()
        : null,
      lastActiveAt: user.lastActiveAt
        ? new Date(user.lastActiveAt).toISOString()
        : null,
      banned: user.banned,
      locked: user.locked,
      isAdmin: adminUserIds.has(user.id),
    }));

    return NextResponse.json({ users, totalCount, limit, offset });
  } catch (error) {
    console.error('Failed to fetch users from Clerk:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const context = await getSessionContext();

  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { client, userId, memberships } = context;

  const adminMembership = memberships.data.find(
    (membership) => membership.role === 'org:admin'
  );

  if (!adminMembership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = adminMembership.organization.id;

  const body = await request.json().catch(() => null);
  const targetUserId: unknown = body?.userId;

  if (!targetUserId || typeof targetUserId !== 'string') {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (targetUserId === userId) {
    return NextResponse.json(
      { error: 'You are already an admin' },
      { status: 400 }
    );
  }

  try {
    const existing = await client.organizations.getOrganizationMembershipList({
      organizationId,
      userId: [targetUserId],
      limit: 1,
    });

    const membership =
      existing.data.length > 0
        ? await client.organizations.updateOrganizationMembership({
            organizationId,
            userId: targetUserId,
            role: 'org:admin',
          })
        : await client.organizations.createOrganizationMembership({
            organizationId,
            userId: targetUserId,
            role: 'org:admin',
          });

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      organizationId,
      role: membership.role,
    });
  } catch (error) {
    console.error('Failed to make user admin:', error);
    return NextResponse.json(
      { error: 'Failed to make user admin' },
      { status: 500 }
    );
  }
}
