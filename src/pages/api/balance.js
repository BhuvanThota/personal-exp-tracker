import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userId, accountId, accountGroupId } = req.query;

      // If specific account balance is requested
      if (accountId) {
        const account = await prisma.account.findUnique({
          where: { id: accountId },
          select: {
            id: true,
            name: true,
            currentBalance: true,
            currency: true,
            type: true,
            isActive: true
          }
        });

        if (!account) {
          return res.status(404).json({ error: 'Account not found' });
        }

        return res.status(200).json({
          accountId: account.id,
          accountName: account.name,
          balance: account.currentBalance,
          currency: account.currency,
          type: account.type,
          isActive: account.isActive
        });
      }

      // If account group balance is requested
      if (accountGroupId) {
        const accountGroup = await prisma.accountGroup.findUnique({
          where: { id: accountGroupId },
          include: {
            accountMembers: {
              where: { isActive: true },
              include: {
                account: {
                  select: {
                    id: true,
                    name: true,
                    currentBalance: true,
                    currency: true,
                    type: true,
                    isActive: true
                  }
                }
              }
            }
          }
        });

        if (!accountGroup) {
          return res.status(404).json({ error: 'Account group not found' });
        }

        const accounts = accountGroup.accountMembers
          .filter(member => member.account.isActive)
          .map(member => ({
            accountId: member.account.id,
            accountName: member.account.name,
            balance: member.account.currentBalance,
            currency: member.account.currency,
            type: member.account.type,
            weight: member.weight
          }));

        const totalBalance = accounts.reduce((sum, account) => {
          return sum + (account.balance * account.weight);
        }, 0);

        return res.status(200).json({
          accountGroupId: accountGroup.id,
          accountGroupName: accountGroup.name,
          totalBalance,
          accountCount: accounts.length,
          accounts
        });
      }

      // If userId is provided, get all user's account balances
      if (userId) {
        const accounts = await prisma.account.findMany({
          where: {
            userId: userId,
            isActive: true
          },
          select: {
            id: true,
            name: true,
            currentBalance: true,
            currency: true,
            type: true,
            bankName: true
          },
          orderBy: {
            name: 'asc'
          }
        });

        const totalBalance = accounts.reduce((sum, account) => {
          return sum + account.currentBalance;
        }, 0);

        return res.status(200).json({
          userId,
          totalBalance,
          accountCount: accounts.length,
          accounts: accounts.map(account => ({
            accountId: account.id,
            accountName: account.name,
            balance: account.currentBalance,
            currency: account.currency,
            type: account.type,
            bankName: account.bankName
          }))
        });
      }

      // If no specific parameters, return error
      return res.status(400).json({ 
        error: 'Please specify userId, accountId, or accountGroupId' 
      });

    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  } 
  
  else if (req.method === 'PUT') {
    // Update account balance (this would typically be done through transactions)
    try {
      const { accountId, newBalance, reason = 'ADJUSTMENT' } = req.body;

      if (!accountId || newBalance === undefined) {
        return res.status(400).json({ 
          error: 'accountId and newBalance are required' 
        });
      }

      // Update account balance and create balance history record
      const [updatedAccount, balanceHistory] = await prisma.$transaction([
        prisma.account.update({
          where: { id: accountId },
          data: { 
            currentBalance: newBalance,
            updatedAt: new Date()
          }
        }),
        prisma.balanceHistory.create({
          data: {
            accountId,
            amount: newBalance,
            reason,
            date: new Date()
          }
        })
      ]);

      res.status(200).json({
        message: 'Balance updated successfully',
        account: {
          id: updatedAccount.id,
          name: updatedAccount.name,
          currentBalance: updatedAccount.currentBalance
        },
        balanceHistory: balanceHistory
      });

    } catch (error) {
      console.error("Error updating balance:", error);
      res.status(500).json({ error: 'Failed to update balance' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}