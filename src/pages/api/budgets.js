import { prisma } from '../../lib/prisma'

// Helper function to calculate budget period dates
function calculateBudgetPeriod(period, customStartDate = null) {
  const currentDate = new Date()
  let startDate, endDate

  if (customStartDate) {
    startDate = new Date(customStartDate)
  } else {
    startDate = new Date()
  }

  switch (period.toUpperCase()) {
    case 'WEEKLY':
      if (!customStartDate) {
        const dayOfWeek = currentDate.getDay()
        startDate.setDate(currentDate.getDate() - dayOfWeek)
        startDate.setHours(0, 0, 0, 0)
      }
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'MONTHLY':
      if (!customStartDate) {
        startDate.setDate(1)
        startDate.setHours(0, 0, 0, 0)
      }
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      endDate.setHours(23, 59, 59, 999)
      break
    
    case 'YEARLY':
      if (!customStartDate) {
        startDate = new Date(currentDate.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
      }
      endDate = new Date(startDate.getFullYear(), 11, 31)
      endDate.setHours(23, 59, 59, 999)
      break
    
    default:
      throw new Error(`Invalid period: ${period}`)
  }

  return { startDate, endDate }
}

// Helper function to calculate actual spending for a budget
async function calculateBudgetSpending(budget) {
  const whereClause = {
    category: budget.category,
    type: 'DEBIT',
    date: {
      gte: budget.startDate,
      lte: budget.endDate
    }
  }

  // Add account filtering based on budget scope
  if (budget.accountId) {
    whereClause.accountId = budget.accountId
  } else if (budget.accountGroupId) {
    // Get all accounts in the account group
    const accountGroup = await prisma.accountGroup.findUnique({
      where: { id: budget.accountGroupId },
      include: {
        accountMembers: {
          where: { isActive: true },
          select: { accountId: true }
        }
      }
    })
    
    if (accountGroup) {
      whereClause.accountId = {
        in: accountGroup.accountMembers.map(member => member.accountId)
      }
    }
  } else if (budget.userId) {
    // Get all user's accounts
    const userAccounts = await prisma.account.findMany({
      where: { userId: budget.userId, isActive: true },
      select: { id: true }
    })
    
    whereClause.accountId = {
      in: userAccounts.map(account => account.id)
    }
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: { amount: true }
  })

  return transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { userId, accountId, accountGroupId, category, isActive } = req.query

      // Build where clause based on query parameters
      const whereClause = {}
      
      if (userId) whereClause.userId = userId
      if (accountId) whereClause.accountId = accountId
      if (accountGroupId) whereClause.accountGroupId = accountGroupId
      if (category) whereClause.category = category
      if (isActive !== undefined) whereClause.isActive = isActive === 'true'

      // Get budgets with related data
      const budgets = await prisma.budget.findMany({
        where: whereClause,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          accountGroup: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { startDate: 'desc' }
        ]
      })

      // Calculate current spending for each budget
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          const actualSpent = await calculateBudgetSpending(budget)
          
          // Update the budget's spent field if it's different
          if (Math.abs(actualSpent - budget.spent) > 0.01) {
            await prisma.budget.update({
              where: { id: budget.id },
              data: { spent: actualSpent }
            })
          }

          const remaining = budget.amount - actualSpent
          const percentUsed = budget.amount > 0 ? (actualSpent / budget.amount) * 100 : 0
          const isOverBudget = actualSpent > budget.amount
          
          // Check if budget period is current
          const currentDate = new Date()
          const isCurrentPeriod = currentDate >= budget.startDate && currentDate <= budget.endDate

          return {
            ...budget,
            spent: actualSpent,
            remaining,
            percentUsed: Math.round(percentUsed * 100) / 100,
            isOverBudget,
            isCurrentPeriod,
            daysRemaining: isCurrentPeriod ? 
              Math.ceil((budget.endDate - currentDate) / (1000 * 60 * 60 * 24)) : 0
          }
        })
      )

      res.status(200).json(budgetsWithSpending)
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
      res.status(500).json({ error: 'Failed to fetch budgets' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { 
        category, 
        amount, 
        period, 
        accountId, 
        accountGroupId, 
        userId,
        startDate,
        endDate,
        isActive = true
      } = req.body

      // Validate required fields
      if (!category || !amount || !period) {
        return res.status(400).json({ 
          error: 'category, amount, and period are required' 
        })
      }

      // Validate that at least one scope is specified
      if (!accountId && !accountGroupId && !userId) {
        return res.status(400).json({ 
          error: 'Must specify either accountId, accountGroupId, or userId' 
        })
      }

      // Calculate period dates if not provided
      let budgetStartDate, budgetEndDate
      if (startDate && endDate) {
        budgetStartDate = new Date(startDate)
        budgetEndDate = new Date(endDate)
      } else {
        const periodDates = calculateBudgetPeriod(period, startDate)
        budgetStartDate = periodDates.startDate
        budgetEndDate = periodDates.endDate
      }

      // Check for existing budget with same parameters
      const existingBudget = await prisma.budget.findFirst({
        where: {
          category,
          period: period.toUpperCase(),
          accountId: accountId || null,
          accountGroupId: accountGroupId || null,
          userId: userId || null,
          startDate: budgetStartDate,
          endDate: budgetEndDate,
          isActive: true
        }
      })

      if (existingBudget) {
        return res.status(409).json({ 
          error: 'Budget already exists for this category and period' 
        })
      }

      const budget = await prisma.budget.create({
        data: {
          category,
          amount: parseFloat(amount),
          period: period.toUpperCase(),
          startDate: budgetStartDate,
          endDate: budgetEndDate,
          accountId: accountId || null,
          accountGroupId: accountGroupId || null,
          userId: userId || null,
          isActive,
          spent: 0 // Initialize spent to 0
        },
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          accountGroup: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      res.status(201).json(budget)
    } catch (error) {
      console.error('Failed to create budget:', error)
      res.status(500).json({ error: 'Failed to create budget' })
    }
  } 
  
  else if (req.method === 'PUT') {
    try {
      const { id, amount, isActive, startDate, endDate } = req.body

      if (!id) {
        return res.status(400).json({ error: 'Budget ID is required' })
      }

      const updateData = {}
      if (amount !== undefined) updateData.amount = parseFloat(amount)
      if (isActive !== undefined) updateData.isActive = isActive
      if (startDate) updateData.startDate = new Date(startDate)
      if (endDate) updateData.endDate = new Date(endDate)
      
      const updatedBudget = await prisma.budget.update({
        where: { id },
        data: updateData,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          accountGroup: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      })

      res.status(200).json(updatedBudget)
    } catch (error) {
      console.error('Failed to update budget:', error)
      res.status(500).json({ error: 'Failed to update budget' })
    }
  } 
  
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query

      if (!id) {
        return res.status(400).json({ error: 'Budget ID is required' })
      }

      // Soft delete by setting isActive to false
      const deletedBudget = await prisma.budget.update({
        where: { id },
        data: { isActive: false }
      })

      res.status(200).json({ message: 'Budget deleted successfully', budget: deletedBudget })
    } catch (error) {
      console.error('Failed to delete budget:', error)
      res.status(500).json({ error: 'Failed to delete budget' })
    }
  } 
  
  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}