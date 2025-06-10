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
      
      const income = transactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const expenses = transactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + t.amount, 0)
      
      res.status(200).json({
        income,
        expenses,
        net: income - expenses,
        transactionCount: transactions.length
      })
    } catch (error) {
      console.error("Error fetching monthly summary:", error);
      res.status(500).json({ error: 'Failed to fetch monthly summary' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
