import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { format = 'csv', dateFrom, dateTo } = req.query
      
      let whereClause = {}
      if (dateFrom || dateTo) {
        whereClause.date = {}
        if (dateFrom) whereClause.date.gte = new Date(dateFrom)
        if (dateTo) whereClause.date.lte = new Date(dateTo)
      }
      
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' }
      })
      
      if (format === 'csv') {
        const csvHeader = 'Date,Description,Amount,Type,Category\n'
        const csvRows = transactions.map(t => 
          `${t.date.toISOString().split('T')[0]},"${t.description}",${t.amount},${t.type},"${t.category || ''}"`
        ).join('\n')
        
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv')
        res.status(200).send(csvHeader + csvRows)
      } else {
        res.status(200).json(transactions)
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to export transactions' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
