import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { query } = req.query
      
      const suggestions = await prisma.suggestion.findMany({
        where: query ? {
          description: {
            contains: query,
            mode: 'insensitive'
          }
        } : {},
        orderBy: { frequency: 'desc' },
        take: 10
      })
      
      res.status(200).json(suggestions)
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: 'Failed to fetch suggestions' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
