import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Extract query parameters
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const recent = req.query.recent // For dashboard recent transactions
      const all = req.query.all === 'true' // For getting all transactions (balance history)
      const search = req.query.search || ''
      const category = req.query.category || ''
      const type = req.query.type || ''
      const dateFrom = req.query.dateFrom
      const dateTo = req.query.dateTo

      // For getting all transactions (used in balance history)
      if (all) {
        const transactions = await prisma.transaction.findMany({
          orderBy: { date: 'desc' }
        })
        return res.status(200).json({
          data: transactions,
          total: transactions.length
        })
      }

      // Build where clause for filtering
      let whereClause = {}

      // Search in description
      if (search) {
        whereClause.description = {
          contains: search,
          mode: 'insensitive'
        }
      }

      // Filter by category
      if (category) {
        whereClause.category = category
      }

      // Filter by type
      if (type) {
        whereClause.type = type
      }

      // Filter by date range
      if (dateFrom || dateTo) {
        whereClause.date = {}
        if (dateFrom) {
          whereClause.date.gte = new Date(dateFrom)
        }
        if (dateTo) {
          whereClause.date.lte = new Date(dateTo)
        }
      }

      // For dashboard recent transactions (limit to recent 20)
      if (recent) {
        const recentLimit = Math.min(parseInt(recent), 20) // Max 20 for dashboard
        const totalCount = await prisma.transaction.count({ where: whereClause })
        const recentCount = Math.min(totalCount, recentLimit)
        
        // Calculate pagination for recent transactions
        const skip = (page - 1) * limit
        const take = Math.min(limit, recentLimit - skip)

        if (take <= 0) {
          return res.status(200).json({
            data: [],
            total: recentCount,
            pagination: {
              currentPage: page,
              totalPages: Math.ceil(recentCount / limit),
              totalCount: recentCount,
              limit,
              hasNext: false,
              hasPrev: page > 1
            }
          })
        }

        const transactions = await prisma.transaction.findMany({
          where: whereClause,
          orderBy: { date: 'desc' },
          skip,
          take
        })

        return res.status(200).json({
          data: transactions,
          total: recentCount,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(recentCount / limit),
            totalCount: recentCount,
            limit,
            hasNext: page < Math.ceil(recentCount / limit),
            hasPrev: page > 1
          }
        })
      }

      // Regular pagination for AllTransactions page
      const skip = (page - 1) * limit

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
        })
      }

      // Get total count for pagination metadata
      const totalCount = await prisma.transaction.count({ where: whereClause })

      // Fetch transactions with pagination and filters
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
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
        total: totalCount,
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
      const { date, description, amount, type, category } = req.body

      // Validate required fields
      if (!date || !description || !amount || !type) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' })
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          date: new Date(date),
          description,
          amount: parsedAmount,
          type,
          category
        }
      })
      
      // Update balance
      let balance = await prisma.balance.findFirst()
      if (!balance) {
        balance = await prisma.balance.create({
          data: { amount: 0.00 }
        })
      }
      
      const newAmount = type === 'CREDIT' 
        ? balance.amount + parseFloat(amount)
        : balance.amount - parseFloat(amount)
      
      await prisma.balance.update({
        where: { id: balance.id },
        data: { amount: newAmount }
      })
      
      // Update suggestions
      await prisma.suggestion.upsert({
        where: { category: category || 'Other' },
        update: { frequency: { increment: 1 } },
        create: { description, category: category || 'Other', frequency: 1 }
      })
      
      res.status(201).json(transaction)
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: 'Failed to create transaction' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}