import { prisma } from '../../../lib/prisma'

// Helper function to calculate date ranges
function getDateRange(period, customStartDate = null, customEndDate = null) {
  const now = new Date()
  let startDate, endDate

  if (customStartDate && customEndDate) {
    startDate = new Date(customStartDate)
    endDate = new Date(customEndDate)
    endDate.setHours(23, 59, 59, 999) // Include entire end date
  } else {
    switch (period?.toLowerCase()) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay()) // Start of week (Sunday)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0)
        endDate.setHours(23, 59, 59, 999)
        break
      
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), 11, 31)
        endDate.setHours(23, 59, 59, 999)
        break
      
      case 'last30days':
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 29)
        startDate.setHours(0, 0, 0, 0)
        break
      
      case 'last90days':
        endDate = new Date(now)
        endDate.setHours(23, 59, 59, 999)
        startDate = new Date(endDate)
        startDate.setDate(endDate.getDate() - 89)
        startDate.setHours(0, 0, 0, 0)
        break
    }
  }

  return { startDate, endDate }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { 
        period = 'month',
        startDate: customStartDate,
        endDate: customEndDate,
        accountId,
        accountGroupId,
        userId,
        includeSubcategories = 'false',
        transactionType = 'all', // 'all', 'debit', 'credit'
        minAmount,
        excludeCategories,
        topN
      } = req.query

      // Calculate date range
      const { startDate, endDate } = getDateRange(period, customStartDate, customEndDate)
      
      // Build where clause for filtering
      let whereClause = {
        date: {
          gte: startDate,
          lte: endDate
        }
      }

      // Account filtering
      if (accountId) {
        whereClause.accountId = accountId
      } else if (accountGroupId) {
        // Get all accounts in the account group
        const accountGroup = await prisma.accountGroup.findUnique({
          where: { id: accountGroupId },
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
      } else if (userId) {
        // Get all user's active accounts
        const userAccounts = await prisma.account.findMany({
          where: { userId: userId, isActive: true },
          select: { id: true }
        })
        
        whereClause.accountId = {
          in: userAccounts.map(account => account.id)
        }
      }

      // Transaction type filtering
      if (transactionType !== 'all') {
        whereClause.type = transactionType.toUpperCase()
      }

      // Amount filtering
      if (minAmount) {
        whereClause.amount = { gte: parseFloat(minAmount) }
      }

      // Category exclusion
      if (excludeCategories) {
        const excludeList = excludeCategories.split(',').map(cat => cat.trim())
        whereClause.category = {
          notIn: excludeList
        }
      }

      // Fetch transactions with account information
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              currency: true
            }
          }
        },
        orderBy: { date: 'desc' }
      })

      if (transactions.length === 0) {
        return res.status(200).json({
          period,
          dateRange: { startDate, endDate },
          totalTransactions: 0,
          categoryBreakdown: [],
          summary: {
            totalCredit: 0,
            totalDebit: 0,
            netAmount: 0,
            categoriesCount: 0
          }
        })
      }

      // Process category breakdown
      const categoryData = transactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Uncategorized'
        const subcategory = transaction.subcategory || null
        const amount = Math.abs(transaction.amount) // Use absolute value for calculations
        
        if (!acc[category]) {
          acc[category] = {
            name: category,
            credit: 0,
            debit: 0,
            netAmount: 0,
            transactionCount: 0,
            subcategories: {},
            averageTransaction: 0,
            currency: transaction.account?.currency || 'USD'
          }
        }
        
        // Update category totals
        if (transaction.type === 'CREDIT') {
          acc[category].credit += amount
          acc[category].netAmount += amount
        } else {
          acc[category].debit += amount
          acc[category].netAmount -= amount
        }
        
        acc[category].transactionCount++
        
        // Handle subcategories if requested
        if (includeSubcategories === 'true' && subcategory) {
          if (!acc[category].subcategories[subcategory]) {
            acc[category].subcategories[subcategory] = {
              name: subcategory,
              credit: 0,
              debit: 0,
              netAmount: 0,
              transactionCount: 0
            }
          }
          
          const subcat = acc[category].subcategories[subcategory]
          if (transaction.type === 'CREDIT') {
            subcat.credit += amount
            subcat.netAmount += amount
          } else {
            subcat.debit += amount
            subcat.netAmount -= amount
          }
          subcat.transactionCount++
        }
        
        return acc
      }, {})

      // Calculate averages and convert subcategories to arrays
      Object.values(categoryData).forEach(category => {
        category.averageTransaction = category.transactionCount > 0 
          ? (category.credit + category.debit) / category.transactionCount 
          : 0
        
        if (includeSubcategories === 'true') {
          category.subcategories = Object.values(category.subcategories)
          category.subcategoriesCount = category.subcategories.length
        } else {
          delete category.subcategories
        }
      })

      // Sort categories and apply topN filter if specified
      let categoryBreakdown = Object.values(categoryData)
      
      // Sort by total spending (credit + debit) descending
      categoryBreakdown.sort((a, b) => (b.credit + b.debit) - (a.credit + a.debit))
      
      if (topN) {
        const limit = parseInt(topN)
        if (limit > 0 && limit < categoryBreakdown.length) {
          const others = categoryBreakdown.slice(limit)
          const othersTotal = others.reduce((sum, cat) => ({
            credit: sum.credit + cat.credit,
            debit: sum.debit + cat.debit,
            netAmount: sum.netAmount + cat.netAmount,
            transactionCount: sum.transactionCount + cat.transactionCount
          }), { credit: 0, debit: 0, netAmount: 0, transactionCount: 0 })
          
          categoryBreakdown = categoryBreakdown.slice(0, limit)
          
          if (othersTotal.transactionCount > 0) {
            categoryBreakdown.push({
              name: 'Others',
              ...othersTotal,
              averageTransaction: othersTotal.transactionCount > 0 
                ? (othersTotal.credit + othersTotal.debit) / othersTotal.transactionCount 
                : 0,
              currency: 'USD' // Default currency for aggregated data
            })
          }
        }
      }

      // Calculate summary statistics
      const summary = categoryBreakdown.reduce((sum, category) => ({
        totalCredit: sum.totalCredit + category.credit,
        totalDebit: sum.totalDebit + category.debit,
        netAmount: sum.netAmount + category.netAmount,
        categoriesCount: sum.categoriesCount + (category.name !== 'Others' ? 1 : 0)
      }), { totalCredit: 0, totalDebit: 0, netAmount: 0, categoriesCount: 0 })

      // Add percentage calculations
      const totalSpending = summary.totalCredit + summary.totalDebit
      categoryBreakdown.forEach(category => {
        const categoryTotal = category.credit + category.debit
        category.percentageOfTotal = totalSpending > 0 
          ? Math.round((categoryTotal / totalSpending) * 10000) / 100 
          : 0
        
        // Round monetary values to 2 decimal places
        category.credit = Math.round(category.credit * 100) / 100
        category.debit = Math.round(category.debit * 100) / 100
        category.netAmount = Math.round(category.netAmount * 100) / 100
        category.averageTransaction = Math.round(category.averageTransaction * 100) / 100
      })

      // Round summary values
      summary.totalCredit = Math.round(summary.totalCredit * 100) / 100
      summary.totalDebit = Math.round(summary.totalDebit * 100) / 100
      summary.netAmount = Math.round(summary.netAmount * 100) / 100

      const response = {
        period,
        dateRange: { 
          startDate: startDate.toISOString().split('T')[0], 
          endDate: endDate.toISOString().split('T')[0] 
        },
        filters: {
          accountId: accountId || null,
          accountGroupId: accountGroupId || null,
          userId: userId || null,
          transactionType,
          includeSubcategories: includeSubcategories === 'true',
          minAmount: minAmount ? parseFloat(minAmount) : null
        },
        totalTransactions: transactions.length,
        categoryBreakdown,
        summary
      }

      res.status(200).json(response)
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: 'Failed to fetch category breakdown' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}