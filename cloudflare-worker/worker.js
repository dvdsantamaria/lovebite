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
      // Fetch events from Eventbrite API
      const response = await fetch(
        `https://www.eventbriteapi.com/v3/organizations/${env.EVENTBRITE_ORG_ID}/events/?status=live&expand=venue&order_by=start_asc`,
        {
          headers: {
            'Authorization': `Bearer ${env.EVENTBRITE_PRIVATE_TOKEN}`
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Eventbrite API error: ${response.status}`)
      }

      const data = await response.json()
      
      // Transform and filter the data
      const events = data.events.map(event => ({
        id: event.id,
        name: event.name.text,
        description: event.description?.text || '',
        url: event.url,
        start: event.start.local,
        end: event.end.local,
        image: event.logo?.url || null,
        venue: event.venue ? {
          name: event.venue.name,
          address: event.venue.address?.localized_address_display || ''
        } : null,
        is_free: event.is_free,
        ticket_availability: event.ticket_availability
      }))

      return new Response(JSON.stringify({ events }), { headers })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }), 
        { status: 500, headers }
      )
    }
  }
}
