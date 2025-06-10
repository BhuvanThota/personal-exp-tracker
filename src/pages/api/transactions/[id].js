import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    try {
      const { date, description, amount, type, category } = req.body
      
      // Get the original transaction
      const originalTransaction = await prisma.transaction.findUnique({
        where: { id }
      })
      
      if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found' })
      }
      
      // Update the transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          date: new Date(date),
          description,
          amount: parseFloat(amount),
          type,
          category
        }
      })
      
      // Recalculate balance
      const balance = await prisma.balance.findFirst()
      if (balance) {
        // Reverse the original transaction effect
        let newAmount = balance.amount
        if (originalTransaction.type === 'CREDIT') {
          newAmount -= originalTransaction.amount
        } else {
          newAmount += originalTransaction.amount
        }
        
        // Apply the updated transaction effect
        if (type === 'CREDIT') {
          newAmount += parseFloat(amount)
        } else {
          newAmount -= parseFloat(amount)
        }
        
        await prisma.balance.update({
          where: { id: balance.id },
          data: { amount: newAmount }
        })
      }
      
      res.status(200).json(updatedTransaction)
    } catch (error) {
      console.error('Failed to update transaction:', error)
      res.status(500).json({ error: 'Failed to update transaction' })
    }
  } else if (req.method === 'DELETE') {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id }
      })
      
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' })
      }
      
      // Delete the transaction
      await prisma.transaction.delete({
        where: { id }
      })
      
      // Update balance
      const balance = await prisma.balance.findFirst()
      if (balance) {
        const newAmount = transaction.type === 'CREDIT'
          ? balance.amount - transaction.amount
          : balance.amount + transaction.amount
        
        await prisma.balance.update({
          where: { id: balance.id },
          data: { amount: newAmount }
        })
      }
      
      res.status(200).json({ message: 'Transaction deleted' })
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      res.status(500).json({ error: 'Failed to delete transaction' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
