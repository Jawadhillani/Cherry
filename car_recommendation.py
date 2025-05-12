from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import openai
import os
from dotenv import load_dotenv
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

router = APIRouter()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OPENAI_API_KEY not found in environment variables")

class CarPreference(BaseModel):
    budget: str = None
    vehicle_type: str = None
    priority: str = None
    brand_preference: str = None
    use_case: str = None

class CarRecommendationRequest(BaseModel):
    preferences: CarPreference

def format_preferences_for_prompt(preferences: CarPreference) -> str:
    parts = []
    
    if preferences.budget:
        parts.append(f"Budget: {preferences.budget}")
    
    if preferences.vehicle_type:
        parts.append(f"Vehicle Type: {preferences.vehicle_type}")
    
    if preferences.priority:
        parts.append(f"Priority: {preferences.priority}")
    
    if preferences.brand_preference:
        parts.append(f"Brand Preference: {preferences.brand_preference}")
    
    if preferences.use_case:
        parts.append(f"Use Case: {preferences.use_case}")
    
    return "\n".join(parts)

@router.post("/car-recommendation")
async def get_car_recommendations(request: CarRecommendationRequest):
    try:
        logger.info("Received car recommendation request")
        logger.info(f"Preferences: {request.preferences.dict()}")
        
        # Check if OpenAI API key is set
        if not openai.api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured"
            )
        
        # Format preferences for the prompt
        formatted_preferences = format_preferences_for_prompt(request.preferences)
        logger.info(f"Formatted preferences: {formatted_preferences}")
        
        # Construct the prompt for OpenAI
        prompt = f"""Based on the following user preferences, recommend cars that would be a good fit. Include details about why each car matches the preferences.

User Preferences:
{formatted_preferences}

Please provide recommendations in the following JSON format:
{{
  "cars": [
    {{
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
    }}
  ]
}}

Provide 3 car recommendations, with the best match first."""

        logger.info("Calling OpenAI API...")
        # Call OpenAI API
        completion = await openai.ChatCompletion.acreate(
            messages=[
                {
                    "role": "system",
                    "content": "You are an automotive expert AI that provides detailed car recommendations based on user preferences. Your recommendations should be accurate, up-to-date, and include both mainstream and luxury vehicles as appropriate for the user's budget and preferences."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="gpt-3.5-turbo-1106",
            response_format={ "type": "json_object" }
        )

        # Parse the response
        response_text = completion.choices[0].message.content
        logger.info(f"Received response from OpenAI: {response_text}")
        
        try:
            recommendations = eval(response_text)  # Convert string to dict
            logger.info("Successfully parsed recommendations")
            return recommendations
        except Exception as parse_error:
            logger.error(f"Error parsing OpenAI response: {str(parse_error)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error parsing recommendations: {str(parse_error)}"
            )

    except openai.error.AuthenticationError as auth_error:
        logger.error(f"OpenAI authentication error: {str(auth_error)}")
        raise HTTPException(
            status_code=500,
            detail="OpenAI API authentication failed. Please check your API key."
        )
    except openai.error.APIError as api_error:
        logger.error(f"OpenAI API error: {str(api_error)}")
        raise HTTPException(
            status_code=500,
            detail=f"OpenAI API error: {str(api_error)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error in car recommendation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get recommendations: {str(e)}"
        ) 