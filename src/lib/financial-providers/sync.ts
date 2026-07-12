import { prisma } from "@/lib/prisma";
import { getFinancialProvider } from "./registry";
import { decryptCredentials } from "./encryption";

export async function syncConnection(connectionId: string) {
  const connection = await prisma.providerConnection.findUnique({
    where: { id: connectionId },
  });

  if (!connection) throw new Error("Conexión no encontrada");
  if (connection.status === "DISCONNECTED") throw new Error("Conexión desconectada");

  const provider = getFinancialProvider(connection.providerId);
  const credentials = decryptCredentials(connection.credentials);

  const startTime = Date.now();

  const syncLog = await prisma.syncLog.create({
    data: {
      connectionId: connection.id,
      status: "SUCCESS",
    },
  });

  try {
    const [accounts, transactions, investments] = await Promise.all([
      provider.getAccounts(credentials).catch(() => []),
      provider.getTransactions(credentials, connection.lastSyncAt ?? undefined).catch(() => []),
      provider.getInvestments(credentials).catch(() => []),
    ]);

    for (const account of accounts) {
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: connection.userId,
          description: `Synced from ${connection.providerId}:${account.externalId}`,
        },
      });

      if (!existing) {
        await prisma.transaction.create({
          data: {
            userId: connection.userId,
            type: account.balance >= 0 ? "INCOME" : "EXPENSE",
            category: `Cuenta: ${account.name}`,
            amount: Math.abs(account.balance),
            currency: account.currency,
            description: `Synced from ${connection.providerId}:${account.externalId}`,
          },
        });
      }
    }

    for (const tx of transactions) {
      const existing = await prisma.transaction.findFirst({
        where: {
          userId: connection.userId,
          description: `Synced from ${connection.providerId}:${tx.externalId}`,
        },
      });

      if (!existing) {
        await prisma.transaction.create({
          data: {
            userId: connection.userId,
            type: tx.type,
            category: tx.category,
            amount: Math.abs(tx.amount),
            currency: "ARS",
            description: `Synced from ${connection.providerId}:${tx.externalId} — ${tx.description}`,
            date: tx.date,
          },
        });
      }
    }

    for (const inv of investments) {
      const existing = await prisma.investment.findFirst({
        where: {
          userId: connection.userId,
          name: inv.name,
        },
      });

      if (existing) {
        await prisma.investment.update({
          where: { id: existing.id },
          data: {
            currentPrice: inv.currentPrice,
            quantity: inv.quantity,
          },
        });
      } else {
        await prisma.investment.create({
          data: {
            userId: connection.userId,
            name: inv.name,
            type: inv.type as never,
            symbol: inv.symbol,
            amount: inv.buyPrice * inv.quantity,
            quantity: inv.quantity,
            buyPrice: inv.buyPrice,
            currentPrice: inv.currentPrice,
            currency: inv.currency,
          },
        });
      }
    }

    const duration = Date.now() - startTime;

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        accountsImported: accounts.length,
        transactionsImported: transactions.length,
        investmentsImported: investments.length,
        duration,
      },
    });

    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncAt: new Date(),
        lastError: null,
        status: "ACTIVE",
      },
    });

    return {
      ok: true,
      accounts: accounts.length,
      transactions: transactions.length,
      investments: investments.length,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : "Error desconocido";

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "ERROR",
        errorMessage: message,
        duration,
      },
    });

    await prisma.providerConnection.update({
      where: { id: connection.id },
      data: {
        lastError: message,
        status: "ERROR",
      },
    });

    return { ok: false, error: message };
  }
}
