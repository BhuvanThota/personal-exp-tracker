// pages/api/transactions/[id].js
import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing transaction ID' })
  }

  try {
    // Get transaction with account information
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            type: true,
            bankName: true,
            currentBalance: true,
            userId: true
          }
        }
      }
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    // Optional: Add user authorization check
    const userId = req.query.userId || req.headers['user-id'] // Adjust based on your auth system
    if (userId && transaction.account.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (req.method === 'GET') {
      // Return transaction with account details
      res.status(200).json(transaction)

    } else if (req.method === 'PUT') {
      const { 
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
      if (!date || !description || !amount || !type) {
        return res.status(400).json({ error: 'Missing required fields: date, description, amount, type' })
      }

      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' })
      }

      if (!['CREDIT', 'DEBIT'].includes(type)) {
        return res.status(400).json({ error: 'Type must be either CREDIT or DEBIT' })
      }

      // Calculate balance adjustment
      // First, reverse the original transaction effect
      const originalEffect = transaction.type === 'CREDIT' 
        ? -transaction.amount 
        : transaction.amount

      // Then apply the new transaction effect  
      const newEffect = type === 'CREDIT' ? parsedAmount : -parsedAmount
      
      // Total adjustment to current balance
      const balanceAdjustment = originalEffect + newEffect
      const newBalance = transaction.account.currentBalance + balanceAdjustment

      // Update transaction and account balance in a database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the transaction
        const updatedTransaction = await tx.transaction.update({
          where: { id },
          data: {
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
                bankName: true,
                currentBalance: true
              }
            }
          }
        })

        // Update account balance
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: newBalance }
        })

        // Create balance history record
        await tx.balanceHistory.create({
          data: {
            accountId: transaction.accountId,
            amount: newBalance,
            reason: 'ADJUSTMENT',
            date: new Date()
          }
        })

        return updatedTransaction
      })

      // Update suggestions frequency (outside transaction for performance)
      if (category) {
        await prisma.suggestion.upsert({
          where: { category },
          update: { frequency: { increment: 1 } },
          create: { 
            description, 
            category, 
            frequency: 1 
          }
        })
      }

      return res.status(200).json(result)

    } else if (req.method === 'DELETE') {
      // Calculate balance adjustment (reverse the transaction effect)
      const balanceAdjustment = transaction.type === 'CREDIT' 
        ? -transaction.amount 
        : transaction.amount
      
      const newBalance = transaction.account.currentBalance + balanceAdjustment

      // Delete transaction and update balance in a database transaction
      await prisma.$transaction(async (tx) => {
        // Delete the transaction
        await tx.transaction.delete({ 
          where: { id } 
        })

        // Update account balance
        await tx.account.update({
          where: { id: transaction.accountId },
          data: { currentBalance: newBalance }
        })

        // Create balance history record
        await tx.balanceHistory.create({
          data: {
            accountId: transaction.accountId,
            amount: newBalance,
            reason: 'ADJUSTMENT',
            date: new Date()
          }
        })
      })

      return res.status(200).json({ 
        message: 'Transaction deleted successfully',
        deletedTransactionId: id 
      })

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error(`Transaction error:`, error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}