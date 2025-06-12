import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Extract parameters from query
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit
      const userId = req.query.userId // Required for account filtering
      const accountId = req.query.accountId // Optional: specific account
      const accountGroupId = req.query.accountGroupId // Optional: account group
      const category = req.query.category // Optional: filter by category
      const type = req.query.type // Optional: filter by type (CREDIT/DEBIT)
      const startDate = req.query.startDate // Optional: date range start
      const endDate = req.query.endDate // Optional: date range end

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
        })
      }

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
      }

      // Build the where clause based on filters
      let whereClause = {}

      if (accountId) {
        // Specific account transactions
        whereClause.accountId = accountId
        
        // Verify account belongs to user
        const account = await prisma.account.findFirst({
          where: { id: accountId, userId }
        })
        if (!account) {
          return res.status(404).json({ error: 'Account not found or access denied' })
        }
      } else if (accountGroupId) {
        // Account group transactions
        const accountGroup = await prisma.accountGroup.findFirst({
          where: { id: accountGroupId, userId },
          include: {
            accountMembers: {
              where: { isActive: true },
              select: { accountId: true }
            }
          }
        })
        
        if (!accountGroup) {
          return res.status(404).json({ error: 'Account group not found or access denied' })
        }
        
        const accountIds = accountGroup.accountMembers.map(member => member.accountId)
        whereClause.accountId = { in: accountIds }
      } else {
        // All user's transactions (across all accounts)
        whereClause.account = { userId }
      }

      // Add additional filters
      if (category) {
        whereClause.category = category
      }
      
      if (type) {
        whereClause.type = type
      }
      
      if (startDate || endDate) {
        whereClause.date = {}
        if (startDate) whereClause.date.gte = new Date(startDate)
        if (endDate) whereClause.date.lte = new Date(endDate)
      }

      // Get total count for pagination metadata
      const totalCount = await prisma.transaction.count({ where: whereClause })

      // Fetch transactions with pagination and account info
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              bankName: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      })

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalCount / limit)
      const hasNext = page < totalPages
      const hasPrev = page > 1

      // Return paginated response
      res.status(200).json({
        data: transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext,
          hasPrev,
          nextPage: hasNext ? page + 1 : null,
          prevPage: hasPrev ? page - 1 : null
        }
      })
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: 'Failed to fetch transactions' })
    }
  } else if (req.method === 'POST') {
    try {
      const { 
        accountId, 
        date, 
        description, 
        amount, 
        type, 
        category, 
        subcategory,
        notes,
        tags,
        reference 
      } = req.body

      // Validate required fields
      if (!accountId || !date || !description || !amount || !type) {
        return res.status(400).json({ error: 'Missing required fields: accountId, date, description, amount, type' })
      }

      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' })
      }

      if (!['CREDIT', 'DEBIT'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either CREDIT or DEBIT' })
      }

      // Verify account exists and get current balance
      const account = await prisma.account.findUnique({
        where: { id: accountId }
      })

      if (!account) {
        return res.status(404).json({ error: 'Account not found' })
      }

      // Calculate new balance
      const balanceChange = type === 'CREDIT' ? parsedAmount : -parsedAmount
      const newBalance = account.currentBalance + balanceChange

      // Create transaction and update account balance in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the transaction
        const transaction = await tx.transaction.create({
          data: {
            accountId,
            date: new Date(date),
            description,
            amount: parsedAmount,
            type,
            category: category || 'Other',
            subcategory,
            notes,
            tags: tags || [],
            reference,
            balanceAfter: newBalance
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
                bankName: true
              }
            }
          }
        })

        // Update account balance
        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: newBalance }
        })

        // Create balance history record
        await tx.balanceHistory.create({
          data: {
            accountId,
            amount: newBalance,
            reason: 'TRANSACTION'
          }
        })

        return transaction
      })

      // Update suggestions (outside of transaction for performance)
      await prisma.suggestion.upsert({
        where: { category: category || 'Other' },
        update: { frequency: { increment: 1 } },
        create: { 
          description, 
          category: category || 'Other', 
          frequency: 1 
        }
      })

      res.status(201).json(result)
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: 'Failed to create transaction' })
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query
      const { 
        date, 
        description, 
        amount, 
        type, 
        category, 
        subcategory,
        notes,
        tags 
      } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' })
      }

      // Get existing transaction
      const existingTransaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true }
      })

      if (!existingTransaction) {
        return res.status(404).json({ error: 'Transaction not found' })
      }

      // Calculate balance adjustments if amount or type changed
      let balanceAdjustment = 0
      if (amount !== undefined || type !== undefined) {
        const newAmount = amount !== undefined ? parseFloat(amount) : existingTransaction.amount
        const newType = type || existingTransaction.type
        
        // Remove old transaction effect
        const oldEffect = existingTransaction.type === 'CREDIT' 
          ? -existingTransaction.amount 
          : existingTransaction.amount
        
        // Add new transaction effect
        const newEffect = newType === 'CREDIT' ? newAmount : -newAmount
        
        balanceAdjustment = oldEffect + newEffect
      }

      const newBalance = existingTransaction.account.currentBalance + balanceAdjustment

      // Update transaction and account balance
      const result = await prisma.$transaction(async (tx) => {
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: {
            ...(date && { date: new Date(date) }),
            ...(description && { description }),
            ...(amount && { amount: parseFloat(amount) }),
            ...(type && { type }),
            ...(category && { category }),
            ...(subcategory !== undefined && { subcategory }),
            ...(notes !== undefined && { notes }),
            ...(tags !== undefined && { tags }),
            ...(balanceAdjustment !== 0 && { balanceAfter: newBalance })
          },
          include: {
            account: {
              select: {
                id: true,
                name: true,
                type: true,
                bankName: true
              }
            }
          }
        })

        // Update account balance if needed
        if (balanceAdjustment !== 0) {
          await tx.account.update({
            where: { id: existingTransaction.accountId },
            data: { currentBalance: newBalance }
          })

          // Create balance history record
          await tx.balanceHistory.create({
            data: {
              accountId: existingTransaction.accountId,
              amount: newBalance,
              reason: 'ADJUSTMENT'
            }
          })
        }

        return updatedTransaction
      })

      res.status(200).json(result)
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({ error: 'Failed to update transaction' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: 'Transaction ID is required' })
      }

      // Get transaction to calculate balance adjustment
      const transaction = await prisma.transaction.findUnique({
        where: { id },
        include: { account: true }
      })

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' })
      }

      // Calculate balance adjustment (reverse the transaction)
      const balanceAdjustment = transaction.type === 'CREDIT' 
        ? -transaction.amount 
        : transaction.amount
      
      const newBalance = transaction.account.currentBalance + balanceAdjustment

      // Delete transaction and update balance
      await prisma.$transaction(async (tx) => {
        await tx.transaction.delete({ where: { id } })
        
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: newBalance }
        })

        // Create balance history record
        await tx.balanceHistory.create({
          data: {
            accountId: transaction.accountId,
            amount: newBalance,
            reason: 'ADJUSTMENT'
          }
        })
      })

      res.status(200).json({ message: 'Transaction deleted successfully' })
    } catch (error) {
      console.error("Error deleting transaction:", error);
      res.status(500).json({ error: 'Failed to delete transaction' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}