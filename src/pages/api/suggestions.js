import { prisma } from '../../lib/prisma'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { query, category, limit = 10, includeFrequency = false } = req.query
      
      // Build where clause for filtering
      const whereClause = {}
      
      if (query) {
        whereClause.OR = [
          {
            description: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            category: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      }
      
      if (category) {
        whereClause.category = {
          equals: category,
          mode: 'insensitive'
        }
      }
      
      const suggestions = await prisma.suggestion.findMany({
        where: whereClause,
        orderBy: [
          { frequency: 'desc' },
          { description: 'asc' }
        ],
        take: parseInt(limit)
      })
      
      // Format response based on includeFrequency parameter
      const formattedSuggestions = suggestions.map(suggestion => {
        const result = {
          id: suggestion.id,
          description: suggestion.description,
          category: suggestion.category
        }
        
        if (includeFrequency === 'true') {
          result.frequency = suggestion.frequency
        }
        
        return result
      })
      
      res.status(200).json(formattedSuggestions)
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: 'Failed to fetch suggestions' })
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { description, category } = req.body
      
      // Validation
      if (!description || description.trim().length === 0) {
        return res.status(400).json({ error: 'Description is required' })
      }
      
      if (!category || category.trim().length === 0) {
        return res.status(400).json({ error: 'Category is required' })
      }
      
      const trimmedDescription = description.trim()
      const trimmedCategory = category.trim()
      
      // Check if suggestion already exists (case insensitive)
      const existingSuggestion = await prisma.suggestion.findFirst({
        where: {
          description: {
            equals: trimmedDescription,
            mode: 'insensitive'
          },
          category: {
            equals: trimmedCategory,
            mode: 'insensitive'
          }
        }
      })
      
      if (existingSuggestion) {
        // Increment frequency of existing suggestion
        const updatedSuggestion = await prisma.suggestion.update({
          where: { id: existingSuggestion.id },
          data: { 
            frequency: existingSuggestion.frequency + 1 
          }
        })
        
        return res.status(200).json({
          message: 'Suggestion frequency updated',
          suggestion: {
            id: updatedSuggestion.id,
            description: updatedSuggestion.description,
            category: updatedSuggestion.category,
            frequency: updatedSuggestion.frequency
          }
        })
      }
      
      // Create new suggestion
      const newSuggestion = await prisma.suggestion.create({
        data: {
          description: trimmedDescription,
          category: trimmedCategory,
          frequency: 1
        }
      })
      
      res.status(201).json({
        message: 'Suggestion created successfully',
        suggestion: {
          id: newSuggestion.id,
          description: newSuggestion.description,
          category: newSuggestion.category,
          frequency: newSuggestion.frequency
        }
      })
    } catch (error) {
      console.error("Error creating suggestion:", error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Suggestion with this category already exists' })
      }
      
      res.status(500).json({ error: 'Failed to create suggestion' })
    }
  } 
  
  else if (req.method === 'PUT') {
    try {
      const { id, description, category, frequency } = req.body
      
      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' })
      }
      
      // Build update data
      const updateData = {}
      if (description !== undefined) updateData.description = description.trim()
      if (category !== undefined) updateData.category = category.trim()
      if (frequency !== undefined) updateData.frequency = parseInt(frequency)
      
      // Validate that we have something to update
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' })
      }
      
      const updatedSuggestion = await prisma.suggestion.update({
        where: { id },
        data: updateData
      })
      
      res.status(200).json({
        message: 'Suggestion updated successfully',
        suggestion: {
          id: updatedSuggestion.id,
          description: updatedSuggestion.description,
          category: updatedSuggestion.category,
          frequency: updatedSuggestion.frequency
        }
      })
    } catch (error) {
      console.error("Error updating suggestion:", error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Suggestion not found' })
      }
      
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Suggestion with this category already exists' })
      }
      
      res.status(500).json({ error: 'Failed to update suggestion' })
    }
  } 
  
  else if (req.method === 'DELETE') {
    try {
      const { id } = req.query
      
      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' })
      }
      
      await prisma.suggestion.delete({
        where: { id }
      })
      
      res.status(200).json({ message: 'Suggestion deleted successfully' })
    } catch (error) {
      console.error("Error deleting suggestion:", error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Suggestion not found' })
      }
      
      res.status(500).json({ error: 'Failed to delete suggestion' })
    }
  } 
  
  else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}

// Helper function to automatically create suggestions from transactions
export async function createSuggestionFromTransaction(description, category) {
  try {
    if (!description || !category) return
    
    const trimmedDescription = description.trim()
    const trimmedCategory = category.trim()
    
    // Check if suggestion already exists
    const existingSuggestion = await prisma.suggestion.findFirst({
      where: {
        description: {
          equals: trimmedDescription,
          mode: 'insensitive'
        },
        category: {
          equals: trimmedCategory,
          mode: 'insensitive'
        }
      }
    })
    
    if (existingSuggestion) {
      // Increment frequency
      await prisma.suggestion.update({
        where: { id: existingSuggestion.id },
        data: { frequency: existingSuggestion.frequency + 1 }
      })
    } else {
      // Create new suggestion
      await prisma.suggestion.create({
        data: {
          description: trimmedDescription,
          category: trimmedCategory,
          frequency: 1
        }
      })
    }
  } catch (error) {
    console.error("Error creating suggestion from transaction:", error)
    // Don't throw error as this is a background operation
  }
}