import axios from 'axios';
import * as fs from 'fs';

export async function getSheetNames(sheetId: string, apiKey: string): Promise<string[]> {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
        const response = await axios.get(url, {
            params: {
                key: apiKey,
                fields: 'sheets.properties.title'
            }
        });
        return response.data.sheets.map(sheet => sheet.properties.title);
    } catch (error) {
        console.error('Error fetching sheet names:', error.message);
        return [];
    }
}

export async function getSheetData(sheetId: string, apiKey: string) { 
    // Route to fetch Google Sheets data and return as JSON
      try {

          // Try to get actual sheet names
          const sheetNames = await getSheetNames(sheetId, apiKey);
          const sheetName = sheetNames.length > 0 ? sheetNames[0] : 'users';
          const range = `${sheetName}!A1:Z1000`;
        
        
        // URL encode the range
        const encodedRange = encodeURIComponent(range);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}`;
        
        const response = await axios.get(url, {
          params: {
            key: apiKey
          }
        });
    
        if (!response.data.values) {
          return null;
        }
    
        const jsonData = convertToJSON(response.data.values);
    
        fs.writeFile('users.json', JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
          if (err) {
            throw new Error('Error writing users.json:', err);
        }
      });
    } catch (error) {
      throw new Error('Error fetching Google Sheets data:', error.response?.data || error.message);
    }
}

function convertToJSON(values) {
  if (!values || values.length === 0) {
    return [];
  }

  // First row is headers
  const headers = values[0];
  
  // Convert remaining rows to objects
  const jsonData = values.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      // Use header as key, or 'column_N' if header is empty
      const key = header && header.trim() !== '' ? header.trim() : `column_${index + 1}`;
      obj[key] = row[index] || '';
    });
    return obj;
  });

  // Filter out completely empty rows
  return jsonData.filter(row => {
    return Object.values(row).some(value => value && value.toString().trim() !== '');
  });
}