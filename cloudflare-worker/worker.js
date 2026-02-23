export default {
  async fetch(request, env) {
    // CORS headers - allow the website to call the worker
    const headers = {
      'Access-Control-Allow-Origin': 'https://lovebite.club',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    try {
      // Fetch events from Eventbrite public page (web scraping)
      // Using organization ID which doesn't change when business name changes
      const response = await fetch(
        'https://www.eventbrite.com.au/o/96768399103',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Eventbrite page error: ${response.status}`)
      }

      const html = await response.text()
      
      // Extract events from JSON-LD structured data
      const allEvents = extractEventsFromHtml(html)
      
      // Split into upcoming and past events
      const now = new Date()
      const upcoming = allEvents.filter(e => new Date(e.start) > now)
      const past = allEvents.filter(e => new Date(e.start) <= now)
      
      // Sort both lists
      upcoming.sort((a, b) => new Date(a.start) - new Date(b.start))
      past.sort((a, b) => new Date(b.start) - new Date(a.start)) // Past events: newest first
      
      return new Response(JSON.stringify({ 
        events: upcoming,
        past_events: past,
        total_upcoming: upcoming.length,
        total_past: past.length
      }), { headers })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers }
      )
    }
  }
}

function extractEventsFromHtml(html) {
  const events = []
  
  // Find all JSON-LD script tags
  const startMarker = '<script type="application/ld+json">'
  const endMarker = '</script>'
  
  let idx = 0
  while (true) {
    const start = html.indexOf(startMarker, idx)
    if (start === -1) break
    
    const scriptStart = start + startMarker.length
    const end = html.indexOf(endMarker, scriptStart)
    if (end === -1) break
    
    const jsonStr = html.substring(scriptStart, end).trim()
    idx = end + endMarker.length
    
    try {
      const data = JSON.parse(jsonStr)
      
      // Look for itemListElement which contains events list
      if (data && data.itemListElement && Array.isArray(data.itemListElement)) {
        for (const listItem of data.itemListElement) {
          const item = listItem.item
          if (item && item['@type'] === 'Event') {
            events.push(transformEvent(item))
          }
        }
      }
    } catch (e) {
      // Skip invalid JSON
      continue
    }
  }
  
  return events
}

function transformEvent(item) {
  // Parse location
  const location = item.location || {}
  const venueName = location.name || 'Sydney Venue'
  const address = location.address || {}
  const addressDisplay = address.streetAddress 
    ? `${address.streetAddress}, ${address.addressLocality}`
    : venueName
  
  // Parse dates - Eventbrite format: 2026-02-27T18:30:00+1100
  const startDate = item.startDate || ''
  const endDate = item.endDate || ''
  
  // Convert to format expected by frontend (ISO format)
  const start = startDate ? convertToIsoFormat(startDate) : ''
  const end = endDate ? convertToIsoFormat(endDate) : ''
  
  return {
    id: extractEventId(item.url),
    name: item.name || 'Untitled Event',
    description: item.description || '',
    url: item.url || '',
    start: start,
    end: end,
    image: item.image || null,
    venue: {
      name: venueName,
      address: addressDisplay
    },
    is_free: isFreeEvent(item),
    ticket_availability: null
  }
}

function convertToIsoFormat(dateStr) {
  // Eventbrite format: 2026-02-27T18:30:00+1100
  // Need to convert to: 2026-02-27T18:30:00+11:00 (add colon in timezone)
  if (!dateStr) return ''
  
  // Match pattern like +1100 or -0500 at the end and add colon
  const match = dateStr.match(/^(.+)([+-])(\d{2})(\d{2})$/)
  if (match) {
    return `${match[1]}${match[2]}${match[3]}:${match[4]}`
  }
  
  return dateStr
}

function extractEventId(url) {
  if (!url) return ''
  const match = url.match(/tickets-(\d+)$/)
  return match ? match[1] : url
}

function isFreeEvent(item) {
  const offers = item.offers || {}
  if (offers.price === '0' || offers.price === 0) {
    return true
  }
  if (offers.priceCurrency && !offers.price) {
    return true
  }
  return false
}
