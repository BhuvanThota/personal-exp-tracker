import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)
      
      const nextMonth = new Date(currentMonth)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          date: {
            gte: currentMonth,
            lt: nextMonth
          }
        }
      })
      
      const categoryData = transactions.reduce((acc, transaction) => {
        const category = transaction.category || 'Other'
        if (!acc[category]) {
          acc[category] = { name: category, credit: 0, debit: 0 }
        }
        
        if (transaction.type === 'CREDIT') {
          acc[category].credit += transaction.amount
        } else {
          acc[category].debit += transaction.amount
        }
        
        return acc
      }, {})
      
      res.status(200).json(Object.values(categoryData))
    } catch (error) {
      console.error("Error fetching category breakdown:", error);
      res.status(500).json({ error: 'Failed to fetch category breakdown' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
