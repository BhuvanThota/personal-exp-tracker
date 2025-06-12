import { prisma } from '../../lib/prisma'
import ExcelJS from 'exceljs'

// Helper function to escape CSV values
function escapeCsvValue(value) {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

// Helper function to format date for display
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// Helper function to format datetime for display
function formatDateTime(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19)
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { 
        format = 'csv', 
        dateFrom, 
        dateTo, 
        accountId, 
        accountGroupId, 
        userId,
        category,
        type,
        includeBalance = 'false',
        includeAccount = 'true'
      } = req.query
      
      // Build where clause for filtering
      let whereClause = {}
      
      // Date filtering
      if (dateFrom || dateTo) {
        whereClause.date = {}
        if (dateFrom) whereClause.date.gte = new Date(dateFrom)
        if (dateTo) {
          const endDate = new Date(dateTo)
          endDate.setHours(23, 59, 59, 999) // Include entire end date
          whereClause.date.lte = endDate
        }
      }
      
      // Account filtering
      if (accountId) {
        whereClause.accountId = accountId
      } else if (accountGroupId) {
        // Get all accounts in the account group
        const accountGroup = await prisma.accountGroup.findUnique({
          where: { id: accountGroupId },
          include: {
            accountMembers: {
              where: { isActive: true },
              select: { accountId: true }
            }
          }
        })
        
        if (accountGroup) {
          whereClause.accountId = {
            in: accountGroup.accountMembers.map(member => member.accountId)
          }
        }
      } else if (userId) {
        // Get all user's accounts
        const userAccounts = await prisma.account.findMany({
          where: { userId: userId, isActive: true },
          select: { id: true }
        })
        
        whereClause.accountId = {
          in: userAccounts.map(account => account.id)
        }
      }
      
      // Category and type filtering
      if (category) whereClause.category = category
      if (type) whereClause.type = type.toUpperCase()
      
      // Fetch transactions with account information
      const transactions = await prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: {
            select: {
              id: true,
              name: true,
              type: true,
              bankName: true,
              currency: true
            }
          }
        },
        orderBy: { date: 'desc' }
      })
      
      if (transactions.length === 0) {
        return res.status(404).json({ 
          error: 'No transactions found for the specified criteria' 
        })
      }
      
      // Handle different export formats
      if (format === 'csv') {
        // Build CSV headers based on options
        let headers = ['Date', 'Description', 'Amount', 'Type', 'Category']
        
        if (includeAccount === 'true') {
          headers.push('Account Name', 'Account Type', 'Bank Name')
        }
        
        headers.push('Subcategory', 'Reference', 'Notes', 'Tags')
        
        if (includeBalance === 'true') {
          headers.push('Balance After')
        }
        
        headers.push('Created At')
        
        const csvHeader = headers.join(',') + '\n'
        
        const csvRows = transactions.map(t => {
          let row = [
            formatDate(t.date),
            escapeCsvValue(t.description),
            t.amount,
            t.type,
            escapeCsvValue(t.category || '')
          ]
          
          if (includeAccount === 'true') {
            row.push(
              escapeCsvValue(t.account?.name || ''),
              escapeCsvValue(t.account?.type || ''),
              escapeCsvValue(t.account?.bankName || '')
            )
          }
          
          row.push(
            escapeCsvValue(t.subcategory || ''),
            escapeCsvValue(t.reference || ''),
            escapeCsvValue(t.notes || ''),
            escapeCsvValue(t.tags?.join('; ') || '')
          )
          
          if (includeBalance === 'true') {
            row.push(t.balanceAfter || '')
          }
          
          row.push(formatDateTime(t.createdAt))
          
          return row.join(',')
        }).join('\n')
        
        const filename = `transactions_${formatDate(new Date())}.csv`
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.status(200).send(csvHeader + csvRows)
      } 
      
      else if (format === 'excel') {
        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Transactions')
        
        // Define columns
        let columns = [
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Description', key: 'description', width: 30 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Type', key: 'type', width: 10 },
          { header: 'Category', key: 'category', width: 20 }
        ]
        
        if (includeAccount === 'true') {
          columns.push(
            { header: 'Account Name', key: 'accountName', width: 20 },
            { header: 'Account Type', key: 'accountType', width: 15 },
            { header: 'Bank Name', key: 'bankName', width: 20 }
          )
        }
        
        columns.push(
          { header: 'Subcategory', key: 'subcategory', width: 20 },
          { header: 'Reference', key: 'reference', width: 20 },
          { header: 'Notes', key: 'notes', width: 30 },
          { header: 'Tags', key: 'tags', width: 25 }
        )
        
        if (includeBalance === 'true') {
          columns.push({ header: 'Balance After', key: 'balanceAfter', width: 15 })
        }
        
        columns.push({ header: 'Created At', key: 'createdAt', width: 20 })
        
        worksheet.columns = columns
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true }
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        }
        
        // Add data rows
        transactions.forEach(t => {
          let rowData = {
            date: formatDate(t.date),
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category || ''
          }
          
          if (includeAccount === 'true') {
            rowData.accountName = t.account?.name || ''
            rowData.accountType = t.account?.type || ''
            rowData.bankName = t.account?.bankName || ''
          }
          
          rowData.subcategory = t.subcategory || ''
          rowData.reference = t.reference || ''
          rowData.notes = t.notes || ''
          rowData.tags = t.tags?.join('; ') || ''
          
          if (includeBalance === 'true') {
            rowData.balanceAfter = t.balanceAfter || ''
          }
          
          rowData.createdAt = formatDateTime(t.createdAt)
          
          worksheet.addRow(rowData)
        })
        
        // Format amount column as currency
        const amountColumn = worksheet.getColumn('amount')
        amountColumn.numFmt = '#,##0.00'
        
        if (includeBalance === 'true') {
          const balanceColumn = worksheet.getColumn('balanceAfter')
          balanceColumn.numFmt = '#,##0.00'
        }
        
        // Auto-filter
        worksheet.autoFilter = {
          from: 'A1',
          to: worksheet.getRow(1).cellCount
        }
        
        const filename = `transactions_${formatDate(new Date())}.xlsx`
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        
        await workbook.xlsx.write(res)
        res.end()
      } 
      
      else if (format === 'json') {
        const filename = `transactions_${formatDate(new Date())}.json`
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        
        const exportData = {
          exportDate: new Date().toISOString(),
          totalTransactions: transactions.length,
          filters: {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            accountId: accountId || null,
            accountGroupId: accountGroupId || null,
            userId: userId || null,
            category: category || null,
            type: type || null
          },
          transactions: transactions.map(t => ({
            id: t.id,
            date: t.date,
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
            subcategory: t.subcategory,
            reference: t.reference,
            notes: t.notes,
            tags: t.tags,
            balanceAfter: t.balanceAfter,
            account: includeAccount === 'true' ? {
              id: t.account?.id,
              name: t.account?.name,
              type: t.account?.type,
              bankName: t.account?.bankName,
              currency: t.account?.currency
            } : null,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt
          }))
        }
        
        res.status(200).json(exportData)
      } 
      
      else {
        res.status(400).json({ 
          error: 'Invalid format. Supported formats: csv, excel, json' 
        })
      }
    } catch (error) {
      console.error('Failed to export transactions:', error)
      res.status(500).json({ error: 'Failed to export transactions' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}