import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      let balance = await prisma.balance.findFirst()
      
      if (!balance) {
        balance = await prisma.balance.create({
          data: { amount: 0.00 }
        })
      }
      
      res.status(200).json(balance)
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: 'Failed to fetch balance' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
