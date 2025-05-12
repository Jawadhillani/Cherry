import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to format user preferences into a human-readable prompt
function formatPreferencesForPrompt(preferences) {
  const parts = [];
  
  if (preferences.budget) {
    parts.push(`Budget: ${preferences.budget}`);
  }
  
  if (preferences.vehicle_type) {
    parts.push(`Vehicle Type: ${preferences.vehicle_type}`);
  }
  
  if (preferences.priority) {
    parts.push(`Priority: ${preferences.priority}`);
  }
  
  if (preferences.brand_preference) {
    parts.push(`Brand Preference: ${preferences.brand_preference}`);
  }
  
  if (preferences.use_case) {
    parts.push(`Use Case: ${preferences.use_case}`);
  }
  
  return parts.join('\n');
}

export async function POST(request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { preferences } = body;
    
    if (!preferences) {
      return NextResponse.json(
        { error: 'No preferences provided' },
        { status: 400 }
      );
    }
    
    // Format preferences for the prompt
    const formattedPreferences = formatPreferencesForPrompt(preferences);
    
    // Construct the prompt for OpenAI
    const prompt = `Based on the following user preferences, recommend cars that would be a good fit. Include details about why each car matches the preferences.

User Preferences:
${formattedPreferences}

Please provide recommendations in the following JSON format:
{
  "cars": [
    {
      "make": "Car Manufacturer",
      "model": "Car Model",
      "year": "Year",
      "type": "Vehicle Type (sedan, suv, etc)",
      "priceRange": "Price Range",
      "description": "Brief description of the car",
      "performance": "Performance rating (1-5)",
      "reliability": "Reliability rating (1-5)",
      "features": ["Key Feature 1", "Key Feature 2", "Key Feature 3"],
      "matchReason": "Detailed explanation of why this car matches the user's preferences"
    }
  ]
}

Provide 3 car recommendations, with the best match first.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an automotive expert AI that provides detailed car recommendations based on user preferences. Your recommendations should be accurate, up-to-date, and include both mainstream and luxury vehicles as appropriate for the user's budget and preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo-1106",
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseText = completion.choices[0].message.content;
    const recommendations = JSON.parse(responseText);

    // Return the recommendations
    return NextResponse.json(recommendations);

  } catch (error) {
    console.error('Error getting recommendations:', error);
    
    // Check if it's an OpenAI API error
    if (error.response) {
      return NextResponse.json(
        { error: 'Failed to get recommendations from AI' },
        { status: error.response.status }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 