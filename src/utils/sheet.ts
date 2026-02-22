import axios from 'axios';

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

export async function getSheetData(sheetId: string, apiKey: string): Promise<Record<string, unknown>[] | null> {
    try {
      const sheetNames = await getSheetNames(sheetId, apiKey);
      const sheetName = sheetNames.length > 0 ? sheetNames[0] : 'users';
      const range = `${sheetName}!A1:Z1000`;
      const encodedRange = encodeURIComponent(range);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}`;

      const response = await axios.get(url, {
        params: { key: apiKey },
      });

      if (!response.data.values) {
        return null;
      }

      return convertToJSON(response.data.values);
    } catch (error) {
      throw new Error('Error fetching Google Sheets data: ' + (error.response?.data?.error?.message || error.message));
    }
}

function convertToJSON(values: string[][]): Record<string, unknown>[] {
  if (!values || values.length === 0) {
    return [];
  }

  const headers = values[0];
  const jsonData = values.slice(1).map((row) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      const key = header && header.trim() !== '' ? header.trim() : `column_${index + 1}`;
      obj[key] = row[index] || '';
    });
    return obj;
  });

  return jsonData.filter((row) =>
    Object.values(row).some((value) => value != null && String(value).trim() !== ''),
  );
}