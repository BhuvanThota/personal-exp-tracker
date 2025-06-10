import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          date: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { date: 'asc' }
      })
      
      const dailyData = transactions.reduce((acc, transaction) => {
        const dateStr = transaction.date.toISOString().split('T')[0]
        if (!acc[dateStr]) {
          acc[dateStr] = { date: dateStr, credit: 0, debit: 0 }
        }
        
        if (transaction.type === 'CREDIT') {
          acc[dateStr].credit += transaction.amount
        } else {
          acc[dateStr].debit += transaction.amount
        }
        
        return acc
      }, {})
      
      res.status(200).json(Object.values(dailyData))
    } catch (error) {
      console.error("Error fetching daily trend:", error);
      res.status(500).json({ error: 'Failed to fetch daily trend' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
