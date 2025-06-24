import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { query } = req.query
      
      if (!query || query.length < 2) {
        return res.status(200).json([])
      }

      // Search for suggestions based on description similarity
      const suggestions = await prisma.suggestion.findMany({
        where: {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        orderBy: {
          frequency: 'desc'
        },
        take: 5 // Limit to top 5 suggestions
      })

      // Also search in recent transactions for additional suggestions
      const recentTransactions = await prisma.transaction.findMany({
        where: {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 3,
        select: {
          description: true,
          category: true
        }
      })

      // Combine and deduplicate suggestions
      const combinedSuggestions = [
        ...suggestions.map(s => ({
          description: s.description,
          category: s.category
        })),
        ...recentTransactions.filter(t => 
          !suggestions.some(s => s.description.toLowerCase() === t.description.toLowerCase())
        )
      ]

      res.status(200).json(combinedSuggestions.slice(0, 5))
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      res.status(500).json({ error: 'Failed to fetch suggestions' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}