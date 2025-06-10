import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Extract pagination parameters from query
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 10
      const skip = (page - 1) * limit

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({ 
          error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1-100' 
        })
      }

      // Get total count for pagination metadata
      const totalCount = await prisma.transaction.count()

      // Fetch transactions with pagination
      const transactions = await prisma.transaction.findMany({
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
      const { date, description, amount, type, category } = req.body
      
      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          date: new Date(date),
          description,
          amount: parseFloat(amount),
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
        where: { description },
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