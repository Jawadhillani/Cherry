'use client';
import { useState, useEffect } from 'react';
import { ChevronRight, Car, ArrowRight, ThumbsUp, ArrowLeft, X, AlertCircle } from 'lucide-react';

/**
 * Car Recommendation Wizard Component using OpenAI API
 * 
 * This version sends user preferences directly to OpenAI to get intelligent
 * car recommendations with accurate matches to preferences.
 */
const CarRecommendationWizard = ({ onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isCompleting, setIsCompleting] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [animation, setAnimation] = useState('slide-in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Question bank for preference gathering
  const questions = [
    {
      id: 'budget',
      question: 'What is your budget range?',
      options: [
        { value: 'under_20k', label: 'Under $20,000' },
        { value: '20k_to_40k', label: '$20,000 - $40,000' },
        { value: '40k_to_60k', label: '$40,000 - $60,000' },
        { value: 'over_60k', label: 'Over $60,000' },
        { value: 'any', label: 'No specific budget' }
      ]
    },
    {
      id: 'vehicle_type',
      question: 'What type of vehicle are you looking for?',
      options: [
        { value: 'sedan', label: 'Sedan' },
        { value: 'suv', label: 'SUV / Crossover' },
        { value: 'truck', label: 'Truck / Pickup' },
        { value: 'coupe', label: 'Coupe / Sports Car' },
        { value: 'luxury', label: 'Luxury Vehicle' }
      ]
    },
    {
      id: 'priority',
      question: 'What is your top priority in a vehicle?',
      options: [
        { value: 'performance', label: 'Performance & Speed' },
        { value: 'luxury', label: 'Luxury & Comfort' },
        { value: 'reliability', label: 'Reliability & Durability' },
        { value: 'efficiency', label: 'Fuel Efficiency' },
        { value: 'technology', label: 'Technology & Features' }
      ]
    },
    {
      id: 'brand_preference',
      question: 'Do you have any brand preferences?',
      options: [
        { value: 'american', label: 'American (Ford, Chevrolet, etc.)' },
        { value: 'european', label: 'European (BMW, Mercedes, Audi, etc.)' },
        { value: 'asian', label: 'Asian (Toyota, Honda, Lexus, etc.)' },
        { value: 'specific', label: 'I have specific brands in mind' },
        { value: 'no_preference', label: 'No preference' }
      ]
    },
    {
      id: 'use_case',
      question: 'How will you primarily use this vehicle?',
      options: [
        { value: 'commuting', label: 'Daily Commuting' },
        { value: 'family', label: 'Family Transportation' },
        { value: 'recreation', label: 'Recreation & Fun' },
        { value: 'business', label: 'Business & Professional' },
        { value: 'mixed', label: 'Mixed Use' }
      ]
    }
  ];

  // The wizard will dynamically select which questions to ask
  const determineQuestionSequence = () => {
    return ['budget', 'vehicle_type', 'priority', 'brand_preference', 'use_case'];
  };

  // Get current question based on the sequence and step
  const getCurrentQuestion = () => {
    const sequence = determineQuestionSequence();
    if (currentStep >= sequence.length) return null;

    const questionId = sequence[currentStep];
    return questions.find(q => q.id === questionId) || null;
  };

  // Get total number of questions in sequence
  const getTotalQuestions = () => {
    return determineQuestionSequence().length;
  };

  // Handle answer selection
  const handleAnswer = (questionId, answer) => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    // Animate out
    setAnimation('slide-out');

    setTimeout(() => {
      // Update answers
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: answer,
      }));

      // Move to next question or complete if we're at the end
      const sequence = determineQuestionSequence();
      if (currentStep >= sequence.length - 1) {
        // We're at the last question, start recommendation process
        setIsCompleting(true);
        setLoading(true);
        getOpenAIRecommendation();
      } else {
        setCurrentStep(currentStep + 1);
        setAnimation('slide-in');
      }
    }, 300);
  };

  // Go back to previous question
  const handleBack = () => {
    if (currentStep === 0) return;

    setAnimation('slide-out-reverse');

    setTimeout(() => {
      setCurrentStep(currentStep - 1);
      setAnimation('slide-in-reverse');
    }, 300);
  };

  // Get car recommendations from OpenAI API
  const getOpenAIRecommendation = async () => {
    try {
      console.log('Getting recommendations from OpenAI API');
      setError(null);
      
      const response = await fetch('/api/car-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: answers
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }
      
      const data = await response.json();
      
      if (!data.cars || data.cars.length === 0) {
        throw new Error('No recommendations received');
      }
      
      console.log('Received recommendations:', data);
      
      // Format the main recommendation and alternatives
      const mainRecommendation = data.cars[0];
      const alternatives = data.cars.slice(1);
      
      setRecommendation({
        ...mainRecommendation,
        alternatives
      });
      
    } catch (err) {
      console.error('Error getting recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // UseEffect to call onComplete when recommendation is found
  useEffect(() => {
    if (recommendation) {
      onComplete(recommendation);
    }
  }, [recommendation, onComplete]);

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md z-50 flex items-center justify-center">
      <div
        className={`bg-gray-800 rounded-xl p-8 max-w-md w-full ${
          animation || ''
        }`}
        style={{ animationDuration: '300ms' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-400"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-white">
          <h2 className="text-2xl font-bold mb-6">Find Your Ideal Car</h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-violet-500 mb-4"></div>
              <p className="text-gray-300">Getting intelligent recommendations...</p>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-800 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-gray-300 text-lg mb-3">
                Error getting recommendations
              </p>
              <p className="text-gray-400 mb-6">
                {error}
              </p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getOpenAIRecommendation();
                }}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : !isCompleting ? (
            <>
              <p className="text-lg mb-4">
                {getCurrentQuestion()?.question}
              </p>
              <div className="grid grid-cols-1 gap-4">
                {getCurrentQuestion()?.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      handleAnswer(getCurrentQuestion().id, option.value)
                    }
                    className="w-full p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700 hover:border-violet-500/50 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-gray-200">{option.label}</span>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-violet-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 text-center text-sm text-gray-400">
                Step {currentStep + 1} of {getTotalQuestions()}
              </div>
              
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="mt-4 text-sm text-gray-400 hover:text-gray-300 flex items-center mx-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to previous question
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              {recommendation ? (
                <>
                  <h3 className="text-xl font-semibold mb-4">
                    Here's your recommended car:
                  </h3>
                  <div className="bg-gray-700 rounded-lg p-6">
                    <div className="mb-4">
                      <h4 className="text-2xl font-bold text-white mb-2">
                        {recommendation.make} {recommendation.model}
                      </h4>
                      <p className="text-gray-400">
                        {recommendation.description}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Vehicle Type</div>
                        <div className="text-white font-medium capitalize">{recommendation.type}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Price Range</div>
                        <div className="text-white font-medium">{recommendation.priceRange}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Performance</div>
                        <div className="text-white font-medium">{recommendation.performance}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <div className="text-sm text-gray-400">Reliability</div>
                        <div className="text-white font-medium">{recommendation.reliability}</div>
                      </div>
                    </div>

                    <div className="bg-gray-800/50 p-3 rounded-lg mb-4">
                      <div className="text-sm text-gray-400 mb-2">Key Features</div>
                      <ul className="list-disc pl-5 text-sm text-gray-300 space-y-1">
                        {recommendation.features && recommendation.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Match reasons */}
                    <div className="bg-violet-900/30 border border-violet-800/50 rounded-lg p-3 mb-4">
                      <div className="text-sm text-violet-300 mb-2 font-medium">Why This Matches Your Preferences:</div>
                      <p className="text-sm text-gray-300">{recommendation.matchReason}</p>
                    </div>
                    
                    {/* Alternatives section */}
                    {recommendation.alternatives && recommendation.alternatives.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-600">
                        <p className="text-gray-300 text-sm mb-3">Also Consider:</p>
                        <div className="space-y-2">
                          {recommendation.alternatives.map((alt, index) => (
                            <div key={index} className="p-2 bg-gray-800/50 rounded-lg">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-300 font-medium">
                                  {alt.make} {alt.model}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 mt-1 capitalize">
                                {alt.type} • {alt.priceRange}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onComplete(recommendation)}
                    className="mt-6 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-colors flex items-center justify-center mx-auto"
                  >
                    <span>View Full Details</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarRecommendationWizard;