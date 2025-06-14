// pages/api/transactions/[id].js
import { prisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing transaction ID' })
  }

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    })

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' })
    }

    const balance = await prisma.balance.findFirst()
    if (!balance) {
      return res.status(500).json({ error: 'Balance record not found' })
    }

    if (req.method === 'PUT') {
      const { date, description, amount, type, category } = req.body

      if (!date || !description || !amount || !type) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const parsedAmount = parseFloat(amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' })
      }

      // Reverse original transaction
      let updatedBalance = balance.amount
      updatedBalance += transaction.type === 'CREDIT'
        ? -transaction.amount
        : transaction.amount

      // Apply updated transaction
      updatedBalance += type === 'CREDIT'
        ? parsedAmount
        : -parsedAmount

      // Update transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id },
        data: {
          date: new Date(date),
          description,
          amount: parsedAmount,
          type,
          category,
        },
      })

      // Update balance
      await prisma.balance.update({
        where: { id: balance.id },
        data: { amount: updatedBalance },
      })

      return res.status(200).json(updatedTransaction)

    } else if (req.method === 'DELETE') {
      // Reverse the transaction effect on balance
      const updatedBalance = transaction.type === 'CREDIT'
        ? balance.amount - transaction.amount
        : balance.amount + transaction.amount

      await prisma.transaction.delete({ where: { id } })

      await prisma.balance.update({
        where: { id: balance.id },
        data: { amount: updatedBalance },
      })

      return res.status(200).json({ message: 'Transaction deleted' })

    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error(`Transaction error:`, error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
