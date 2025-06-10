import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Get budgets with current spending
      const budgets = await prisma.budget.findMany()
      
      // Calculate current spending for each budget
      const budgetsWithSpending = await Promise.all(
        budgets.map(async (budget) => {
          const currentDate = new Date()
          let startDate = new Date()
          
          if (budget.period === 'monthly') {
            startDate.setDate(1)
            startDate.setHours(0, 0, 0, 0)
          } else if (budget.period === 'weekly') {
            const dayOfWeek = currentDate.getDay()
            startDate.setDate(currentDate.getDate() - dayOfWeek)
            startDate.setHours(0, 0, 0, 0)
          }
          
          const transactions = await prisma.transaction.findMany({
            where: {
              category: budget.category,
              type: 'DEBIT',
              date: {
                gte: startDate,
                lte: currentDate
              }
            }
          })
          
          const spent = transactions.reduce((sum, t) => sum + t.amount, 0)
          
          return {
            ...budget,
            spent
          }
        })
      )
      
      res.status(200).json(budgetsWithSpending)
    } catch (error) {
      console.error('Failed to fetch budgets:', error)
      res.status(500).json({ error: 'Failed to fetch budgets' })
    }
  } else if (req.method === 'POST') {
    try {
      const { category, amount, period } = req.body
      
      const budget = await prisma.budget.create({
        data: {
          category,
          amount: parseFloat(amount),
          period
        }
      })
      
      res.status(201).json(budget)
    } catch (error) {
      console.error('Failed to create budget:', error)
      res.status(500).json({ error: 'Failed to create budget' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
