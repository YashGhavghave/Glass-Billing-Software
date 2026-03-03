export async function createUserWithFallback(prisma, data) {
  try {
    return await prisma.user.create({ data });
  } catch (error) {
    if (error?.code !== 'P2031') {
      throw error;
    }

    const nowIso = new Date().toISOString();
    const userId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;

    const document = {
      _id: userId,
      email: data.email,
      password_hash: data.passwordHash ?? '',
      first_name: data.firstName ?? null,
      last_name: data.lastName ?? null,
      phone: data.phone ?? null,
      role: data.role ?? 'CUSTOMER',
      status: 'ACTIVE',
      company_id: data.companyId ?? null,
      avatar: data.avatar ?? null,
      timezone: data.timezone ?? null,
      language: data.language ?? 'en',
      created_at: { $date: nowIso },
      updated_at: { $date: nowIso },
      last_login_at: data.lastLoginAt ? { $date: new Date(data.lastLoginAt).toISOString() } : null,
    };

    await prisma.$runCommandRaw({
      insert: 'users',
      documents: [document],
    });

    return {
      id: userId,
      ...data,
      status: 'ACTIVE',
      language: data.language ?? 'en',
    };
  }
}
