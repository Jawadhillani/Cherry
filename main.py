# app/main.py

import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import json
from datetime import datetime
from fastapi import FastAPI
from app.enhanced_chat_controller_hybrid import router as chat_router

# Load environment variables early
load_dotenv()

# Import Supabase service methods (now contains in-memory fallback)
# Ensure these are correctly implemented to use the SUPABASE_URL and SUPABASE_KEY from .env
from app.supabase_service import (
    get_cars,
    get_car_by_id,
    get_reviews_for_car,
    get_manufacturers,
    add_review,
    is_using_fallback
)

# Setup logging
# Configure basic logging to see INFO messages and above in the console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Include routers
# Ensure prefix is applied correctly if needed, usually only once
app.include_router(chat_router, prefix="/api/chat")
# If your frontend is *only* calling /api/chat/*, you might not need the line below.
# If your frontend calls /chat/* directly, keep it. Based on your proxy errors,
# frontend seems to expect /api/*, so prefix=/api/chat seems appropriate.
# If you are still seeing /api/chat proxy errors, double check frontend fetch calls and Next.js proxy config.
# app.include_router(chat_router)


# Define request model
class GenerateReviewRequest(BaseModel):
    car_id: int

# Attach CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing - Adjust in production!
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Astra API"}

# ==========================
# Car Endpoints
# ==========================
# Note: Based on our previous conversation, your frontend CarListing and CarDetail
# components are now fetching directly from Supabase and may no longer rely on these.
# However, other parts of your app or lingering frontend code might still use them,
# hence the proxy errors. Ensure these endpoints are correctly implemented if still needed.

@app.get("/api/cars")
def api_get_cars(
    query: str = None,
    manufacturer: str = None
):
    """Get cars from data source."""
    # This endpoint might still be hit by something if you see proxy errors for it.
    # Ensure get_cars in supabase_service.py uses the Supabase client correctly.
    logger.info(f"API: Received request for /api/cars with query='{query}', manufacturer='{manufacturer}'")
    cars = get_cars(query=query, manufacturer=manufacturer)
    logger.info(f"API: Returning {len(cars) if cars else 0} cars from /api/cars")
    return cars or []

@app.get("/api/cars/{car_id}")
def api_get_car(car_id: int):
    """Get a specific car by ID."""
    # This endpoint might still be hit by something if you see proxy errors for it.
    # Ensure get_car_by_id in supabase_service.py uses the Supabase client correctly.
    logger.info(f"API: Received request for /api/cars/{car_id}")
    car = get_car_by_id(car_id)
    if not car:
        logger.warning(f"API: Car with ID {car_id} not found in /api/cars/{car_id}")
        raise HTTPException(status_code=404, detail=f"Car with ID {car_id} not found")
    logger.info(f"API: Returning car {car_id} from /api/cars/{car_id}")
    return car

@app.get("/api/cars/{car_id}/reviews")
def api_get_car_reviews(car_id: int):
    """Get reviews for a specific car."""
     # This endpoint might still be hit by something if you see proxy errors for it.
     # However, CarDetail should now be using fetchReviewsSupabase directly.
    logger.info(f"API: Received request for /api/cars/{car_id}/reviews")
    # First check if car exists
    car = get_car_by_id(car_id) # Make sure this uses Supabase directly too
    if not car:
        logger.warning(f"API: Car with ID {car_id} not found when fetching reviews via API")
        raise HTTPException(status_code=404, detail=f"Car with ID {car_id} not found")

    # Get reviews
    # Ensure get_reviews_for_car in supabase_service.py uses the Supabase client correctly.
    reviews = get_reviews_for_car(car_id)
    logger.info(f"API: Returning {len(reviews) if reviews else 0} reviews for car {car_id} from /api/cars/{car_id}/reviews")
    return reviews

@app.post("/api/reviews/generate")
async def api_generate_review(request: GenerateReviewRequest):
    """Generate a review for a car and save it."""
    import datetime

    car_id = request.car_id
    # --- START: Added Logging ---
    logger.info(f"API: Received request to generate review for car_id: {car_id}")

    # Check if car exists
    car_data = get_car_by_id(car_id) # Ensure this uses Supabase directly
    if not car_data:
        logger.warning(f"API: Car with ID {car_id} not found for review generation")
        return JSONResponse(
            status_code=404,
            content={"detail": f"Car with ID {car_id} not found"}
        )
    logger.info(f"API: Found car data for ID {car_id}: {car_data.get('manufacturer')} {car_data.get('model')}")

    # Generate mock review structure
    mock_review = {
        "car_id": car_id, # Ensure car_id is included
        "review_title": f"AI Review: {car_data.get('year')} {car_data.get('manufacturer')} {car_data.get('model')}",
        "review_text": f"This is a test review for the {car_data.get('year')} {car_data.get('manufacturer')} {car_data.get('model')}. " +
                      f"The car has a {car_data.get('engine_info', 'modern')} engine and {car_data.get('transmission', 'smooth')} transmission. " +
                      f"It gets about {car_data.get('mpg', 'average')} MPG and runs on {car_data.get('fuel_type', 'fuel')}. " + # Added more details
                      "Overall, it's a good vehicle for its class.",
        "rating": 4.2, # This will be overwritten if AI generates one
        "author": "AI Reviewer",
        "review_date": datetime.datetime.utcnow().isoformat(),
        "is_ai_generated": True,
        "pros": [], # Ensure pros/cons are included in mock
        "cons": []
    }

    ai_review_generated = False
    try:
        # Try to import and use OpenAI service if available
        # Ensure generate_car_review internally uses ModelRouter and handles its timeouts/errors
        logger.info("API: Attempting to import and use generate_car_review service")
        from app.openai_service import generate_car_review
        logger.info(f"API: Calling generate_car_review for car ID {car_id}...")
        ai_review_json_string = generate_car_review(car_data) # <--- THIS IS WHERE IT LIKELY HANGS
        logger.info(f"API: Received response (string) from generate_car_review (length: {len(ai_review_json_string) if ai_review_json_string else 0})")

        if ai_review_json_string:
            try:
                # Attempt to parse the JSON string returned by generate_car_review
                review_data_from_ai = json.loads(ai_review_json_string)
                logger.info("API: Successfully parsed AI review JSON")
                # Merge the parsed data into our mock review template
                # This overwrites title, text, rating, pros, cons if provided by AI
                mock_review = {**mock_review, **review_data_from_ai, "is_ai_generated": True, "car_id": car_id} # Ensure car_id persists
                ai_review_generated = True
            except json.JSONDecodeError as e:
                 logger.error(f"API: Failed to parse AI review JSON for car ID {car_id}: {e}", exc_info=True)
                 logger.warning("API: Using mock review instead due to JSON parsing error.")
            except Exception as e:
                logger.error(f"API: Unexpected error parsing AI review for car ID {car_id}: {str(e)}", exc_info=True)
                logger.warning("API: Using mock review instead due to unexpected parsing error.")
        else:
             logger.warning(f"API: generate_car_review returned None or empty for car ID {car_id}. Using mock.")

    except ImportError:
        # Handle case where openai_service cannot be imported (e.g., OpenAI key not set)
        logger.warning("API: OpenAI service module not available. Using mock review.")
    except Exception as e:
        # Catch exceptions that might occur during the LLM call itself
        logger.error(f"API: Exception during generate_car_review call for car ID {car_id}: {str(e)}", exc_info=True)
        logger.warning("API: Falling back to mock review due to exception.")

    # Add review to data store
    # Ensure add_review uses Supabase directly
    logger.info(f"API: Adding review to database for car ID {car_id}...")
    result = add_review(car_id, mock_review) # Pass the potentially updated mock_review
    logger.info(f"API: add_review completed for car ID {car_id}. Result: {'Success' if result else 'Failure'}")


    if result:
        # The add_review function should ideally return the saved review object,
        # including the 'id' assigned by the database.
        # Ensure the result object includes pros and cons as the frontend expects them.
        if 'pros' not in result:
             result['pros'] = mock_review.get('pros', []) # Fallback to mock if DB didn't return it
        if 'cons' not in result:
             result['cons'] = mock_review.get('cons', []) # Fallback to mock if DB didn't return it

        logger.info(f"API: Successfully generated and added review for car ID {car_id}")
        return result # Return the saved review object
    else:
        logger.error(f"API: Failed to add review to database for car ID {car_id}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to add review"}
        )
    # --- END: Added Logging ---


@app.get("/api/test-db")
def test_db():
    """Test database connection."""
    # This endpoint might still be hit by something if you see proxy errors for it.
    # Ensure is_using_fallback correctly checks the Supabase connection status.
    logger.info("API: Received request for /api/test-db")
    fallback = is_using_fallback()

    if fallback:
        logger.info("API: /api/test-db returning fallback status")
        return {
            "message": "Using fallback database with sample data",
            "using_fallback": True,
            "status": "warning"
        }

    logger.info("API: /api/test-db returning success status")
    return {
        "message": "Database connection successful",
        "using_fallback": False,
        "status": "success"
    }